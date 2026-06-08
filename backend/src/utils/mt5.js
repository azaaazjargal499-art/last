const crypto = require('crypto');

const maskAccount = (account) => {
  const value = String(account || '');
  if (value.length < 7) return '****';
  return `${value.slice(0, 3)}****${value.slice(-3)}`;
};

const normalizeServer = (value) => String(value || '').toLowerCase().replace(/\s+/g, '');

const normalizeSymbol = (symbol) => {
  const clean = String(symbol || '').toUpperCase().replace(/[^A-Z0-9.]/g, '');
  const base = clean.replace(/\..*$/, '');
  const known = {
    XAUUSD: 'XAU/USD',
    XAGUSD: 'XAG/USD',
    EURUSD: 'EUR/USD',
    GBPUSD: 'GBP/USD',
    USDJPY: 'USD/JPY',
    AUDUSD: 'AUD/USD',
    USDCAD: 'USD/CAD',
    USDCHF: 'USD/CHF',
    NZDUSD: 'NZD/USD',
    GBPJPY: 'GBP/JPY',
    EURJPY: 'EUR/JPY',
    BTCUSD: 'BTC/USD',
    BTCUSDT: 'BTC/USDT',
    ETHUSD: 'ETH/USD',
    ETHUSDT: 'ETH/USDT',
  };

  if (known[base]) return known[base];
  if (base.length === 6) return `${base.slice(0, 3)}/${base.slice(3)}`;
  return base || clean || symbol;
};

const parseTradeDate = (value) => {
  if (!value) return null;
  const normalized = String(value).includes('T')
    ? String(value)
    : String(value).replace('.', '-').replace('.', '-').replace(' ', 'T');
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
};

const hashApiToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');

const createApiToken = () => crypto.randomBytes(32).toString('hex');

module.exports = {
  createApiToken,
  hashApiToken,
  maskAccount,
  normalizeServer,
  normalizeSymbol,
  parseTradeDate,
};
