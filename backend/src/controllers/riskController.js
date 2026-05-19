// smart-inventory/backend/src/controllers/riskController.js
const prisma = require('../config/database');
const { getInstrumentSpec, validateTradePrices } = require('../utils/helpers');

// ─── GET /api/risk/calculate ───────────────────────────────────────
// Нэг арилжааны эрсдэл тооцоолол
const calculateRisk = async (req, res, next) => {
  try {
    const {
      pair,
      entryPrice,
      stopLoss,
      accountBalance,
      riskPercent,
      lotSize,
    } = req.body;

    const balance = parseFloat(accountBalance || req.user.balance);
    const risk = parseFloat(riskPercent || req.user.riskPerTrade);
    const priceError = validateTradePrices({ pair, entryPrice, exitPrice: stopLoss });
    if (priceError) return res.status(400).json({ error: priceError });

    const riskAmount = balance * (risk / 100);  // Мөнгөн дүн
    const spec = getInstrumentSpec(pair);
    const pipsAtRisk = Math.abs(parseFloat(entryPrice) - parseFloat(stopLoss)) / spec.pipSize;
    const pipValuePerLot = spec.contractSize * spec.pipSize;

    const recommendedLots = riskAmount / (pipsAtRisk * pipValuePerLot);

    res.json({
      pair,
      accountBalance: balance,
      riskPercent: risk,
      riskAmount: parseFloat(riskAmount.toFixed(2)),
      pipsAtRisk: parseFloat(pipsAtRisk.toFixed(1)),
      recommendedLotSize: parseFloat(recommendedLots.toFixed(2)),
      providedLotSize: lotSize ? parseFloat(lotSize) : null,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/risk/exposure ────────────────────────────────────────
// Нийт нээлттэй позицуудын эрсдэл
const getExposure = async (req, res, next) => {
  try {
    const openTrades = await prisma.trade.findMany({
      where: { userId: req.user.id, status: 'OPEN' },
    });

    const balance = req.user.balance;
    let totalExposure = 0;

    const positions = openTrades.map(t => {
      const spec = getInstrumentSpec(t.pair);
      const exposure = t.stopLoss
        ? Math.abs(t.entryPrice - t.stopLoss) * t.lotSize * spec.contractSize / balance * 100
        : t.lotSize * 1000 / balance * 100;

      totalExposure += exposure;
      return {
        id: t.id,
        pair: t.pair,
        direction: t.direction,
        lotSize: t.lotSize,
        entryPrice: t.entryPrice,
        stopLoss: t.stopLoss,
        exposurePercent: parseFloat(exposure.toFixed(2)),
      };
    });

    res.json({
      accountBalance: balance,
      riskPerTrade: req.user.riskPerTrade,
      openPositions: positions.length,
      totalExposurePercent: parseFloat(totalExposure.toFixed(2)),
      positions,
      isOverExposed: totalExposure > 10, // 10% дээш бол анхааруулга
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { calculateRisk, getExposure };
