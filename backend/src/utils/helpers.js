// smart-inventory/backend/src/utils/helpers.js

const INSTRUMENT_SPECS = {
  'XAU/USD': {
    type: 'metal',
    contractSize: 100,
    pipSize: 0.1,
    minPrice: 100,
    maxPrice: 10000,
  },
  'XAG/USD': {
    type: 'metal',
    contractSize: 100,
    pipSize: 0.1,
    minPrice: 1,
    maxPrice: 10000,
  },
  default: {
    type: 'forex',
    contractSize: 100000,
    pipSize: 0.0001,
    minPrice: 0.0001,
    maxPrice: 300,
  },
};

const getInstrumentSpec = (pair) => INSTRUMENT_SPECS[pair] || INSTRUMENT_SPECS.default;

const validateTradePrices = ({ pair, entryPrice, exitPrice }) => {
  const spec = getInstrumentSpec(pair);
  const prices = [
    ['Оролтын үнэ', entryPrice],
    ['Гаралтын үнэ', exitPrice],
  ].filter(([, value]) => value !== undefined && value !== null && value !== '');

  for (const [label, rawValue] of prices) {
    const value = Number(rawValue);
    if (!Number.isFinite(value) || value <= 0) {
      return `${label} зөв тоо байх ёстой.`;
    }

    if (value < spec.minPrice || value > spec.maxPrice) {
      if (spec.type === 'forex') {
        return `${pair} дээр ${value} үнэ хэт өндөр байна. Алт/мөнгөний арилжаа бол XAU/USD эсвэл XAG/USD сонгоно уу.`;
      }
      return `${pair} дээр ${value} үнэ зөв хүрээнээс гарсан байна.`;
    }
  }

  return null;
};

/**
 * PnL тооцоолол. USD quote-той major forex болон XAU/XAG металлыг дэмжинэ.
 */
const calculatePnL = ({ pair, direction, entryPrice, exitPrice, lotSize }) => {
  const spec = getInstrumentSpec(pair);
  const units = lotSize * spec.contractSize;

  let priceDiff = direction === 'BUY'
    ? exitPrice - entryPrice
    : entryPrice - exitPrice;

  let pnl = priceDiff * units;

  // USD/XXX pairs report PnL in the quote currency, so convert back to USD.
  if (spec.type === 'forex' && pair.startsWith('USD')) {
    pnl = pnl / exitPrice;
  }

  const pips = parseFloat((priceDiff / spec.pipSize).toFixed(1));

  return { pnl: parseFloat(pnl.toFixed(2)), pips };
};

/**
 * Winrate тооцоолол
 */
const calculateWinRate = (trades) => {
  const closed = trades.filter(t => t.status === 'CLOSED');
  if (!closed.length) return 0;
  const wins = closed.filter(t => t.pnl > 0).length;
  return parseFloat(((wins / closed.length) * 100).toFixed(1));
};

/**
 * Drawdown тооцоолол
 */
const calculateMaxDrawdown = (equityCurve) => {
  let maxDrawdown = 0;
  let peak = equityCurve[0]?.balance || 0;

  equityCurve.forEach(point => {
    if (point.balance > peak) peak = point.balance;
    const dd = ((peak - point.balance) / peak) * 100;
    if (dd > maxDrawdown) maxDrawdown = dd;
  });

  return parseFloat(maxDrawdown.toFixed(2));
};

module.exports = {
  calculatePnL,
  calculateWinRate,
  calculateMaxDrawdown,
  getInstrumentSpec,
  validateTradePrices,
};
