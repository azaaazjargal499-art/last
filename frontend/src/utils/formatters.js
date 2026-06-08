// smart-inventory/frontend/src/utils/formatters.js

export const formatCurrency = (val, symbol = '$') =>
  `${symbol}${Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatPnL = (val) => {
  const abs = formatCurrency(val);
  return val >= 0 ? `+${abs}` : `-${abs}`;
};

export const formatPercent = (val) =>
  `${val >= 0 ? '+' : ''}${parseFloat(val).toFixed(2)}%`;

export const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('mn-MN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });

export const formatDateTime = (dateStr) =>
  new Date(dateStr).toLocaleString('mn-MN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });

export const getPnLClass = (val) =>
  val > 0 ? 'profit' : val < 0 ? 'loss' : 'text-gray-400';

export const FOREX_PAIRS = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF',
  'AUD/USD', 'USD/CAD', 'NZD/USD', 'EUR/GBP',
  'EUR/JPY', 'GBP/JPY', 'XAU/USD', 'XAG/USD',
];

export const DEFAULT_SELECTED_PAIRS = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF',
  'AUD/USD', 'EUR/GBP', 'EUR/JPY', 'XAU/USD', 'XAG/USD',
];

export const RISK_REWARD_PRESETS = [1, 1.5, 2, 2.5, 3, 4, 5];
export const DEFAULT_RISK_REWARD_PRESETS = [2, 3];

export const getUserPairs = (user) =>
  Array.isArray(user?.selectedPairs) && user.selectedPairs.length
    ? user.selectedPairs
    : DEFAULT_SELECTED_PAIRS;

export const getUserRiskRewardPresets = (user) =>
  Array.isArray(user?.riskRewardPresets) && user.riskRewardPresets.length
    ? user.riskRewardPresets
    : DEFAULT_RISK_REWARD_PRESETS;

export const TIMEFRAMES = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1', 'MN'];
