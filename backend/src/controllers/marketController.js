const yahooSymbolMap = {
  XAUUSD: 'XAUUSD=X',
  XAGUSD: 'XAGUSD=X',
  EURUSD: 'EURUSD=X',
  GBPUSD: 'GBPUSD=X',
  USDJPY: 'JPY=X',
  AUDUSD: 'AUDUSD=X',
  USDCAD: 'CAD=X',
  USDCHF: 'CHF=X',
  NZDUSD: 'NZDUSD=X',
  GBPJPY: 'GBPJPY=X',
  EURJPY: 'EURJPY=X',
  DXY: 'DX-Y.NYB',
  SPX: '^GSPC',
  NDX: '^NDX',
  DJI: '^DJI',
  SPY: 'SPY',
  QQQ: 'QQQ',
  NVDA: 'NVDA',
  BTCUSD: 'BTC-USD',
  BTCUSDT: 'BTC-USD',
  ETHUSDT: 'ETH-USD',
  SOLUSDT: 'SOL-USD',
};

const cryptoBinanceMap = {
  BTCUSD: 'BTCUSDT',
  BTCUSDT: 'BTCUSDT',
  ETHUSD: 'ETHUSDT',
  ETHUSDT: 'ETHUSDT',
  SOLUSD: 'SOLUSDT',
  SOLUSDT: 'SOLUSDT',
};

const forexPairs = new Set([
  'EURUSD',
  'GBPUSD',
  'USDJPY',
  'AUDUSD',
  'USDCAD',
  'USDCHF',
  'NZDUSD',
  'GBPJPY',
  'EURJPY',
]);

const normalizeSymbol = (value) => String(value || '').trim().toUpperCase();

const toPlainSymbol = (fullSymbol) => {
  const parts = normalizeSymbol(fullSymbol).split(':');
  return parts[parts.length - 1] || '';
};

const formatQuote = ({ symbol, sourceSymbol, price, change, changePercent, source }) => ({
  symbol,
  sourceSymbol,
  price: Number.isFinite(price) ? price : null,
  change: Number.isFinite(change) ? change : null,
  changePercent: Number.isFinite(changePercent) ? changePercent : null,
  source,
  updatedAt: new Date().toISOString(),
});

const fetchJson = async (url, timeoutMs = 7000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 SmartInventory/1.0',
        Accept: 'application/json',
      },
    });
    if (!response.ok) throw new Error(`Quote provider failed: ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
};

const fetchBinanceQuote = async (fullSymbol) => {
  const plain = toPlainSymbol(fullSymbol);
  const binanceSymbol = cryptoBinanceMap[plain];
  if (!binanceSymbol) return null;

  const data = await fetchJson(`https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`);
  const price = Number(data.lastPrice);
  const change = Number(data.priceChange);
  const changePercent = Number(data.priceChangePercent);
  return formatQuote({
    symbol: fullSymbol,
    sourceSymbol: binanceSymbol,
    price,
    change,
    changePercent,
    source: 'BINANCE',
  });
};

const fetchYahooQuotes = async (symbols) => {
  const yahooSymbols = [...new Set(symbols.map((fullSymbol) => yahooSymbolMap[toPlainSymbol(fullSymbol)]).filter(Boolean))];
  if (!yahooSymbols.length) return new Map();

  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(yahooSymbols.join(','))}`;
  const data = await fetchJson(url);
  const byYahooSymbol = new Map();

  for (const item of data?.quoteResponse?.result || []) {
    byYahooSymbol.set(item.symbol, item);
  }

  const quotes = new Map();
  for (const fullSymbol of symbols) {
    const sourceSymbol = yahooSymbolMap[toPlainSymbol(fullSymbol)];
    const item = byYahooSymbol.get(sourceSymbol);
    if (!item) continue;

    quotes.set(fullSymbol, formatQuote({
      symbol: fullSymbol,
      sourceSymbol,
      price: Number(item.regularMarketPrice ?? item.bid ?? item.ask),
      change: Number(item.regularMarketChange),
      changePercent: Number(item.regularMarketChangePercent),
      source: 'YAHOO',
    }));
  }

  return quotes;
};

const fetchForexQuotes = async (symbols) => {
  const needed = symbols.filter((fullSymbol) => forexPairs.has(toPlainSymbol(fullSymbol)));
  if (!needed.length) return new Map();

  const data = await fetchJson('https://open.er-api.com/v6/latest/USD');
  const rates = data?.rates || {};
  const usdValue = (currency) => currency === 'USD' ? 1 : Number(rates[currency]);
  const quotes = new Map();

  for (const fullSymbol of needed) {
    const plain = toPlainSymbol(fullSymbol);
    const base = plain.slice(0, 3);
    const quote = plain.slice(3, 6);
    const baseUsdRate = usdValue(base);
    const quoteUsdRate = usdValue(quote);
    if (!Number.isFinite(baseUsdRate) || !Number.isFinite(quoteUsdRate) || baseUsdRate === 0) continue;

    quotes.set(fullSymbol, formatQuote({
      symbol: fullSymbol,
      sourceSymbol: plain,
      price: quoteUsdRate / baseUsdRate,
      change: null,
      changePercent: null,
      source: 'FX_FALLBACK',
    }));
  }

  return quotes;
};

const getQuotes = async (req, res, next) => {
  try {
    const symbols = String(req.query.symbols || '')
      .split(',')
      .map(normalizeSymbol)
      .filter(Boolean)
      .slice(0, 60);

    if (!symbols.length) {
      return res.json({ quotes: {} });
    }

    const quotes = {};
    const [yahooResult, forexResult] = await Promise.allSettled([
      fetchYahooQuotes(symbols),
      fetchForexQuotes(symbols),
    ]);

    if (yahooResult.status === 'fulfilled') {
      for (const [symbol, quote] of yahooResult.value.entries()) {
        quotes[symbol] = quote;
      }
    }

    if (forexResult.status === 'fulfilled') {
      for (const [symbol, quote] of forexResult.value.entries()) {
        if (!quotes[symbol]) quotes[symbol] = quote;
      }
    }

    const binanceSymbols = symbols.filter((symbol) => cryptoBinanceMap[toPlainSymbol(symbol)] && !quotes[symbol]);
    const binanceResults = await Promise.allSettled(binanceSymbols.map(fetchBinanceQuote));
    for (const result of binanceResults) {
      if (result.status === 'fulfilled' && result.value) {
        quotes[result.value.symbol] = result.value;
      }
    }

    for (const symbol of symbols) {
      if (!quotes[symbol]) {
        quotes[symbol] = formatQuote({
          symbol,
          sourceSymbol: toPlainSymbol(symbol),
          price: null,
          change: null,
          changePercent: null,
          source: 'UNAVAILABLE',
        });
      }
    }

    return res.json({ quotes });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getQuotes,
};
