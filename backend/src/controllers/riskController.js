// smart-inventory/backend/src/controllers/riskController.js
const prisma = require('../config/database');
const {
  getInstrumentSpec,
  getPipValuePerLotUsd,
  getPositionSize,
  requiresQuoteToUsdRate,
  roundTo,
  validateTradePrices,
} = require('../utils/helpers');

const getCurrentAccountBalance = async (userId, startingBalance) => {
  const aggregate = await prisma.trade.aggregate({
    where: { userId, status: 'CLOSED' },
    _sum: { pnl: true },
  });

  return Number(startingBalance || 0) + Number(aggregate._sum.pnl || 0);
};

const getUserPairs = async (req, res, next) => {
  try {
    const selectedPairs = Array.isArray(req.user.selectedPairs) && req.user.selectedPairs.length
      ? req.user.selectedPairs
      : ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'EUR/GBP', 'EUR/JPY', 'XAU/USD', 'XAG/USD'];

    const pairs = selectedPairs.map((pair) => {
      const spec = getInstrumentSpec(pair);
      return {
        pair,
        contractSize: spec.contractSize,
        pipSize: spec.pipSize,
        requiresQuoteToUsdRate: requiresQuoteToUsdRate(pair),
      };
    });

    const currentBalance = await getCurrentAccountBalance(req.user.id, req.user.balance);

    res.json({
      pairs,
      currentBalance: parseFloat(currentBalance.toFixed(2)),
      startingBalance: req.user.balance,
      riskPerTrade: req.user.riskPerTrade,
    });
  } catch (error) {
    next(error);
  }
};

const calculateRisk = async (req, res, next) => {
  try {
    const {
      pair,
      entryPrice,
      stopLoss,
      accountBalance,
      riskPercent,
      lotSize,
      quoteToUsdRate,
      direction,
      riskRewardRatio,
    } = req.body;

    const currentBalance = await getCurrentAccountBalance(req.user.id, req.user.balance);
    const providedBalance = parseFloat(accountBalance);
    const balance = Number.isFinite(providedBalance) ? providedBalance : currentBalance;
    const risk = parseFloat(riskPercent || req.user.riskPerTrade);
    const priceError = validateTradePrices({ pair, entryPrice, exitPrice: stopLoss });
    if (priceError) return res.status(400).json({ error: priceError });

    const result = getPositionSize({
      pair,
      direction,
      entryPrice,
      stopLoss,
      balance,
      riskPercent: risk,
      quoteToUsdRate,
      providedLotSize: lotSize,
      riskRewardRatio,
    });

    if (result.error) {
      return res.status(400).json(result);
    }

    const spec = getInstrumentSpec(pair);
    const pipValuePerLot = getPipValuePerLotUsd({ pair, price: entryPrice, quoteToUsdRate });

    res.json({
      ...result,
      accountBalance: roundTo(result.accountBalance, 2),
      currentBalance: roundTo(currentBalance, 2),
      targetRiskAmount: roundTo(result.targetRiskAmount, 2),
      stopDistance: roundTo(result.stopDistance, 5),
      pipsAtRisk: roundTo(result.pipsAtRisk, 1),
      exactLotSize: roundTo(result.exactLotSize, 4),
      brokerLotSize: result.brokerLotSize === null ? null : roundTo(result.brokerLotSize, spec.lotDecimals),
      executableLotSize: roundTo(result.executableLotSize, spec.lotDecimals),
      actualRiskAmount: roundTo(result.actualRiskAmount, 2),
      actualRiskPercent: roundTo(result.actualRiskPercent, 2),
      minLotRiskAmount: roundTo(result.minLotRiskAmount, 2),
      minLotRiskPercent: roundTo(result.minLotRiskPercent, 2),
      providedRiskAmount: result.providedRiskAmount === null ? null : roundTo(result.providedRiskAmount, 2),
      providedRiskPercent: result.providedRiskPercent === null ? null : roundTo(result.providedRiskPercent, 2),
      takeProfitPrice: result.takeProfitPrice === null ? null : roundTo(result.takeProfitPrice, 5),
      potentialRewardAmount: result.potentialRewardAmount === null ? null : roundTo(result.potentialRewardAmount, 2),
      potentialRewardPercent: result.potentialRewardPercent === null ? null : roundTo(result.potentialRewardPercent, 2),
      pipSize: spec.pipSize,
      contractSize: spec.contractSize,
      pipValuePerLot: roundTo(pipValuePerLot, 4),
      riskPercent: result.targetRiskPercent,
      riskAmount: roundTo(result.targetRiskAmount, 2),
      recommendedLotSize: roundTo(result.exactLotSize, 4),
      warning: result.isBelowMinimumLot
        ? `Зорьсон risk-д таарах lot ${spec.minLot}-оос бага байна. Minimum lot хэрэглэвэл бодит risk ${roundTo(result.actualRiskPercent, 2)}% болно.`
        : null,
    });
  } catch (error) {
    next(error);
  }
};

const getExposure = async (req, res, next) => {
  try {
    const openTrades = await prisma.trade.findMany({
      where: { userId: req.user.id, status: 'OPEN' },
    });

    const balance = await getCurrentAccountBalance(req.user.id, req.user.balance);
    let totalExposure = 0;

    const positions = openTrades.map((trade) => {
      const spec = getInstrumentSpec(trade.pair);
      const pipValuePerLot = getPipValuePerLotUsd({ pair: trade.pair, price: trade.entryPrice });
      const exposure = trade.stopLoss && pipValuePerLot
        ? (Math.abs(trade.entryPrice - trade.stopLoss) / spec.pipSize) * pipValuePerLot * trade.lotSize / balance * 100
        : trade.lotSize * 1000 / balance * 100;

      totalExposure += exposure;
      return {
        id: trade.id,
        pair: trade.pair,
        direction: trade.direction,
        lotSize: trade.lotSize,
        entryPrice: trade.entryPrice,
        stopLoss: trade.stopLoss,
        exposurePercent: parseFloat(exposure.toFixed(2)),
        pipSize: spec.pipSize,
        contractSize: spec.contractSize,
      };
    });

    res.json({
      accountBalance: parseFloat(balance.toFixed(2)),
      riskPerTrade: req.user.riskPerTrade,
      openPositions: positions.length,
      totalExposurePercent: parseFloat(totalExposure.toFixed(2)),
      positions,
      isOverExposed: totalExposure > 10,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { calculateRisk, getExposure, getUserPairs };
