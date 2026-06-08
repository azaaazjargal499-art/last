// smart-inventory/backend/src/utils/helpers.js

const FOREX_CONTRACT_SIZE = 100000;

const INSTRUMENT_SPECS = {
  'XAU/USD': {
    type: 'metal',
    contractSize: 100,
    pipSize: 0.1,
    minLot: 0.01,
    lotStep: 0.01,
    lotDecimals: 2,
    minPrice: 100,
    maxPrice: 10000,
  },
  'XAG/USD': {
    type: 'metal',
    contractSize: 5000,
    pipSize: 0.01,
    minLot: 0.01,
    lotStep: 0.01,
    lotDecimals: 2,
    minPrice: 1,
    maxPrice: 1000,
  },
  default: {
    type: 'forex',
    contractSize: FOREX_CONTRACT_SIZE,
    pipSize: 0.0001,
    minLot: 0.01,
    lotStep: 0.01,
    lotDecimals: 2,
    minPrice: 0.0001,
    maxPrice: 300,
  },
};

const normalizePair = (pair = '') => String(pair).trim().toUpperCase();

const getPairParts = (pair = '') => {
  const normalized = normalizePair(pair);
  const [base = '', quote = ''] = normalized.split('/');
  return { base, quote, normalized };
};

const getInstrumentSpec = (pair) => {
  const { quote, normalized } = getPairParts(pair);
  const explicit = INSTRUMENT_SPECS[normalized];
  if (explicit) return { ...explicit, pair: normalized };

  return {
    ...INSTRUMENT_SPECS.default,
    pair: normalized,
    pipSize: quote === 'JPY' ? 0.01 : INSTRUMENT_SPECS.default.pipSize,
    maxPrice: quote === 'JPY' ? 1000 : INSTRUMENT_SPECS.default.maxPrice,
  };
};

const roundTo = (value, decimals = 2) => {
  if (!Number.isFinite(value)) return null;
  return Number(value.toFixed(decimals));
};

const floorToLotStep = (value, step, decimals) => {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const multiplier = 1 / step;
  return roundTo(Math.floor((value * multiplier) + 1e-9) / multiplier, decimals);
};

const getPipValuePerLotUsd = ({ pair, price, quoteToUsdRate }) => {
  const spec = getInstrumentSpec(pair);
  const { base, quote } = getPairParts(pair);
  const numericPrice = Number(price);
  const pipValueInQuote = spec.contractSize * spec.pipSize;

  if (quote === 'USD' || spec.type === 'metal') return pipValueInQuote;

  if (base === 'USD') {
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) return 0;
    return pipValueInQuote / numericPrice;
  }

  const quoteUsdRate = Number(quoteToUsdRate);
  if (Number.isFinite(quoteUsdRate) && quoteUsdRate > 0) {
    return pipValueInQuote * quoteUsdRate;
  }

  return 0;
};

const requiresQuoteToUsdRate = (pair) => {
  const spec = getInstrumentSpec(pair);
  const { base, quote } = getPairParts(pair);
  return spec.type === 'forex' && quote !== 'USD' && base !== 'USD';
};

const getPositionSize = ({
  pair,
  direction = 'BUY',
  entryPrice,
  stopLoss,
  balance,
  riskPercent,
  quoteToUsdRate,
  providedLotSize,
  riskRewardRatio,
}) => {
  const spec = getInstrumentSpec(pair);
  const entry = Number(entryPrice);
  const stop = Number(stopLoss);
  const accountBalance = Number(balance);
  const risk = Number(riskPercent);
  const stopDistance = Math.abs(entry - stop);
  const pipsAtRisk = stopDistance / spec.pipSize;
  const pipValuePerLot = getPipValuePerLotUsd({ pair, price: entry, quoteToUsdRate });

  if (!Number.isFinite(accountBalance) || accountBalance <= 0) {
    return { error: 'Account balance must be greater than zero.' };
  }

  if (!Number.isFinite(risk) || risk <= 0) {
    return { error: 'Risk percent must be greater than zero.' };
  }

  if (!Number.isFinite(pipsAtRisk) || pipsAtRisk <= 0) {
    return { error: 'Entry price and stop loss must be different.' };
  }

  if (!pipValuePerLot) {
    return {
      error: `${pair} position sizing needs the quote currency USD conversion rate.`,
      requiresQuoteToUsdRate: true,
    };
  }

  const targetRiskAmount = accountBalance * (risk / 100);
  const riskPerOneLot = pipsAtRisk * pipValuePerLot;
  const exactLotSize = targetRiskAmount / riskPerOneLot;
  const brokerLotSize = exactLotSize >= spec.minLot
    ? floorToLotStep(exactLotSize, spec.lotStep, spec.lotDecimals)
    : null;
  const minLotRiskAmount = riskPerOneLot * spec.minLot;
  const minLotRiskPercent = (minLotRiskAmount / accountBalance) * 100;
  const providedLot = Number(providedLotSize);
  const providedRiskAmount = Number.isFinite(providedLot) && providedLot > 0
    ? riskPerOneLot * providedLot
    : null;
  const providedRiskPercent = providedRiskAmount
    ? (providedRiskAmount / accountBalance) * 100
    : null;
  const executableLotSize = brokerLotSize || spec.minLot;
  const actualRiskAmount = riskPerOneLot * executableLotSize;
  const actualRiskPercent = (actualRiskAmount / accountBalance) * 100;
  const rr = Number(riskRewardRatio);
  const normalizedDirection = String(direction).toUpperCase() === 'SELL' ? 'SELL' : 'BUY';
  const rewardDistance = Number.isFinite(rr) && rr > 0 ? stopDistance * rr : null;
  const takeProfitPrice = rewardDistance
    ? normalizedDirection === 'BUY'
      ? entry + rewardDistance
      : entry - rewardDistance
    : null;
  const potentialRewardAmount = rewardDistance
    ? actualRiskAmount * rr
    : null;
  const potentialRewardPercent = rewardDistance
    ? actualRiskPercent * rr
    : null;

  return {
    pair,
    accountBalance,
    targetRiskPercent: risk,
    targetRiskAmount,
    stopDistance,
    pipsAtRisk,
    exactLotSize,
    brokerLotSize,
    executableLotSize,
    actualRiskAmount,
    actualRiskPercent,
    minLot: spec.minLot,
    lotStep: spec.lotStep,
    minLotRiskAmount,
    minLotRiskPercent,
    providedLotSize: Number.isFinite(providedLot) && providedLot > 0 ? providedLot : null,
    providedRiskAmount,
    providedRiskPercent,
    direction: normalizedDirection,
    riskRewardRatio: Number.isFinite(rr) && rr > 0 ? rr : null,
    takeProfitPrice,
    potentialRewardAmount,
    potentialRewardPercent,
    isBelowMinimumLot: exactLotSize < spec.minLot,
    isActualRiskOverTarget: actualRiskPercent > risk + 0.0001,
    requiresQuoteToUsdRate: requiresQuoteToUsdRate(pair),
  };
};

const validateTradePrices = ({ pair, entryPrice, exitPrice }) => {
  const spec = getInstrumentSpec(pair);
  const prices = [
    ['Entry price', entryPrice],
    ['Exit price', exitPrice],
  ].filter(([, value]) => value !== undefined && value !== null && value !== '');

  for (const [label, rawValue] of prices) {
    const value = Number(rawValue);
    if (!Number.isFinite(value) || value <= 0) {
      return `${label} must be a valid positive number.`;
    }

    if (value < spec.minPrice || value > spec.maxPrice) {
      return `${pair} price ${value} is outside the supported range.`;
    }
  }

  return null;
};

const calculatePnL = ({ pair, direction, entryPrice, exitPrice, lotSize }) => {
  const spec = getInstrumentSpec(pair);
  const units = lotSize * spec.contractSize;

  const priceDiff = direction === 'BUY'
    ? exitPrice - entryPrice
    : entryPrice - exitPrice;

  let pnl = priceDiff * units;

  if (spec.type === 'forex' && pair.startsWith('USD')) {
    pnl = pnl / exitPrice;
  }

  const pips = parseFloat((priceDiff / spec.pipSize).toFixed(1));

  return { pnl: parseFloat(pnl.toFixed(2)), pips };
};

const calculateWinRate = (trades) => {
  const closed = trades.filter(t => t.status === 'CLOSED');
  if (!closed.length) return 0;
  const wins = closed.filter(t => t.pnl > 0).length;
  return parseFloat(((wins / closed.length) * 100).toFixed(1));
};

const calculateMaxDrawdown = (equityCurve) => {
  let maxDrawdown = 0;
  let peak = equityCurve[0]?.balance || 0;

  equityCurve.forEach(point => {
    if (point.balance > peak) peak = point.balance;
    const dd = peak ? ((peak - point.balance) / peak) * 100 : 0;
    if (dd > maxDrawdown) maxDrawdown = dd;
  });

  return parseFloat(maxDrawdown.toFixed(2));
};

module.exports = {
  calculatePnL,
  calculateWinRate,
  calculateMaxDrawdown,
  floorToLotStep,
  getInstrumentSpec,
  getPipValuePerLotUsd,
  getPositionSize,
  requiresQuoteToUsdRate,
  roundTo,
  validateTradePrices,
};
