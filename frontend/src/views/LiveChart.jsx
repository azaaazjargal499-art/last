import { useEffect, useMemo, useRef, useState } from 'react';
import { Maximize2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getUserPairs } from '@/utils/formatters';
import { useAuthStore } from '@/store/authStore';

const brokerSymbols = {
  'XAU/USD': 'OANDA:XAUUSD',
  'XAG/USD': 'OANDA:XAGUSD',
  'EUR/USD': 'OANDA:EURUSD',
  'GBP/USD': 'OANDA:GBPUSD',
  'USD/JPY': 'OANDA:USDJPY',
  'AUD/USD': 'OANDA:AUDUSD',
  'USD/CAD': 'OANDA:USDCAD',
  'USD/CHF': 'OANDA:USDCHF',
  'NZD/USD': 'OANDA:NZDUSD',
  'GBP/JPY': 'OANDA:GBPJPY',
  'EUR/JPY': 'OANDA:EURJPY',
};

const DEFAULT_WATCHLIST = [
  'OANDA:XAUUSD',
  'OANDA:XAGUSD',
  'OANDA:EURUSD',
  'OANDA:GBPUSD',
  'OANDA:USDJPY',
  'OANDA:AUDUSD',
  'OANDA:USDCAD',
  'OANDA:GBPJPY',
  'TVC:DXY',
  'SP:SPX',
  'NASDAQ:NDX',
  'DJ:DJI',
  'COINBASE:BTCUSD',
  'BINANCE:BTCUSDT',
  'BINANCE:ETHUSDT',
  'BINANCE:SOLUSDT',
];

const getChartTheme = () => {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
};

const getChartOverrides = (theme) => {
  const isDark = theme === 'dark';

  return {
    'paneProperties.background': isDark ? '#0b0f14' : '#ffffff',
    'paneProperties.backgroundType': 'solid',
    'paneProperties.vertGridProperties.color': isDark ? 'rgba(148, 163, 184, 0.10)' : 'rgba(15, 23, 42, 0.07)',
    'paneProperties.horzGridProperties.color': isDark ? 'rgba(148, 163, 184, 0.10)' : 'rgba(15, 23, 42, 0.07)',
    'scalesProperties.textColor': isDark ? '#cbd5e1' : '#111827',
    'mainSeriesProperties.showCountdown': true,
  };
};

function TradingViewWidget({ symbol, theme }) {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);
  const themeRef = useRef(theme);
  const widgetId = useMemo(() => `tradingview_${Math.random().toString(36).slice(2)}`, []);

  useEffect(() => {
    themeRef.current = theme;
    if (!containerRef.current) return undefined;

    containerRef.current.innerHTML = `<div id="${widgetId}" class="h-full w-full"></div>`;

    const createWidget = () => {
      if (!window.TradingView) return;

      widgetRef.current = new window.TradingView.widget({
        autosize: true,
        symbol,
        interval: '60',
        timezone: 'Asia/Ulaanbaatar',
        theme,
        style: '1',
        locale: 'en',
        enable_publishing: false,
        allow_symbol_change: true,
        show_symbol_logo: true,
        show_exchange_logo: true,
        hide_side_toolbar: false,
        details: true,
        hotlist: false,
        calendar: false,
        watchlist: DEFAULT_WATCHLIST,
        studies: [],
        overrides: getChartOverrides(themeRef.current),
        settings_overrides: getChartOverrides(themeRef.current),
        disabled_features: ['create_volume_indicator_by_default', 'volume_force_overlay'],
        container_id: widgetId,
      });

      if (typeof widgetRef.current.onChartReady === 'function') {
        widgetRef.current.onChartReady(() => {
          applyTradingViewTheme(widgetRef.current, themeRef.current);
        });
      }
    };

    const existingScript = document.getElementById('tradingview-widget-script');
    if (existingScript) {
      createWidget();
      return undefined;
    }

    const script = document.createElement('script');
    script.id = 'tradingview-widget-script';
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = createWidget;
    document.head.appendChild(script);

    return undefined;
  }, [symbol, widgetId]);

  useEffect(() => {
    themeRef.current = theme;
    applyTradingViewTheme(widgetRef.current, theme);
    const timers = [120, 420, 900].map((delay) =>
      window.setTimeout(() => applyTradingViewTheme(widgetRef.current, theme), delay)
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [theme]);

  return <div ref={containerRef} className="h-full w-full" />;
}

function applyTradingViewTheme(widget, theme) {
  if (!widget) return;

  try {
    if (typeof widget.changeTheme === 'function') widget.changeTheme(theme);
  } catch {
    // Keep the active symbol/timeframe even if TradingView ignores theme switching.
  }

  try {
    if (typeof widget.applyOverrides === 'function') widget.applyOverrides(getChartOverrides(theme));
  } catch {
    // Public widgets expose different APIs depending on TradingView's loaded version.
  }

  try {
    const chart = widget.chart?.();
    if (typeof chart?.applyOverrides === 'function') chart.applyOverrides(getChartOverrides(theme));
  } catch {
    // The chart API is not always ready immediately after widget creation.
  }
}

export default function LiveChart() {
  const { user } = useAuthStore();
  const pairs = getUserPairs(user);
  const initialPair = pairs[0] || 'XAU/USD';
  const symbol = brokerSymbols[initialPair] || `OANDA:${initialPair.replace('/', '')}`;
  const [theme, setTheme] = useState(getChartTheme);
  const fullscreenRef = useRef(null);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(getChartTheme());
    });
    const handleThemeChange = (event) => {
      setTheme(event.detail || getChartTheme());
    };

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    window.addEventListener('si-theme-change', handleThemeChange);

    return () => {
      observer.disconnect();
      window.removeEventListener('si-theme-change', handleThemeChange);
    };
  }, []);

  const openFullscreen = async () => {
    try {
      await fullscreenRef.current?.requestFullscreen?.();
    } catch {
      toast.error('Дэлгэц дүүргэж чадсангүй.');
    }
  };

  return (
    <div className="animate-slide-up space-y-3">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={openFullscreen}
          className="live-chart-ghost-btn inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-black"
        >
          <Maximize2 className="h-4 w-4" />
          Fullscreen
        </button>
      </div>

      <section
        ref={fullscreenRef}
        className="live-chart-shell overflow-hidden rounded-2xl border backdrop-blur-xl"
      >
        <div className="live-chart-frame h-[calc(100dvh-10.25rem)] min-h-[650px]">
          <TradingViewWidget key={`${symbol}-${theme}`} symbol={symbol} theme={theme} />
        </div>
      </section>
    </div>
  );
}
