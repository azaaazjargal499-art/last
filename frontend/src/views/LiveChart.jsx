import { useEffect, useMemo, useRef, useState } from 'react';
import { Brain, Camera, Maximize2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AIAssistantChat from '@/components/ai/AIAssistantChat';
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

const aiPrompt = () =>
  'TradingView chart screenshot дээр CRT, SMC, ICT, QM, Head & Shoulders, key level, Fibonacci golden zone, POI, candle pattern, breakout, IDM, liquidity sweep checklist-ээр entry санаа гарга. BUY/SELL/WAIT bias, probability, entry zone, SL, TP-г товч тодорхой Монгол хэлээр тайлбарла.';

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

async function captureScreenFrame() {
  if (!navigator.mediaDevices?.getDisplayMedia) {
    throw new Error('SCREEN_CAPTURE_UNSUPPORTED');
  }

  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: { displaySurface: 'browser' },
    audio: false,
  });

  try {
    const video = document.createElement('video');
    video.srcObject = stream;
    video.muted = true;
    await video.play();

    await new Promise((resolve) => {
      if (video.videoWidth) resolve();
      else video.onloadedmetadata = resolve;
    });

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1600;
    canvas.height = video.videoHeight || 900;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.88);
  } finally {
    stream.getTracks().forEach((track) => track.stop());
  }
}

export default function LiveChart() {
  const { user } = useAuthStore();
  const pairs = getUserPairs(user);
  const initialPair = pairs[0] || 'XAU/USD';
  const symbol = brokerSymbols[initialPair] || `OANDA:${initialPair.replace('/', '')}`;
  const [theme, setTheme] = useState(getChartTheme);
  const fullscreenRef = useRef(null);
  const [capture, setCapture] = useState(null);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

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

  const handleCaptureForAi = async () => {
    try {
      setIsCapturing(true);
      const image = await captureScreenFrame();
      setCapture({ image, createdAt: Date.now() });
      setIsAiOpen(true);
      toast.success('Chart screenshot AI-д бэлэн боллоо.');
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        toast.error('Screenshot хийхийн тулд current tab/window сонгох хэрэгтэй.');
      } else {
        toast.error('Screen capture ажиллахгүй байна. Screenshot-оо AI chat руу upload хийж болно.');
      }
    } finally {
      setIsCapturing(false);
    }
  };

  const openFullscreen = async () => {
    try {
      await fullscreenRef.current?.requestFullscreen?.();
    } catch {
      toast.error('Fullscreen нээж чадсангүй.');
    }
  };

  return (
    <div className="animate-slide-up">
      <section
        ref={fullscreenRef}
        className="live-chart-shell overflow-hidden rounded-2xl border backdrop-blur-xl"
      >
        <div className="live-chart-toolbar flex min-h-[58px] flex-wrap items-center justify-end gap-2 border-b px-4 py-2 backdrop-blur-xl sm:px-6">
          <button
            type="button"
            onClick={openFullscreen}
            className="live-chart-ghost-btn inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-black"
          >
            <Maximize2 className="h-4 w-4" />
            Fullscreen
          </button>
          <button
            type="button"
            onClick={handleCaptureForAi}
            disabled={isCapturing}
            className="live-chart-primary-btn inline-flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-black disabled:opacity-60"
          >
            <Camera className="h-4 w-4" />
            {isCapturing ? 'Capturing...' : 'Screenshot AI'}
          </button>
          <button
            type="button"
            onClick={() => setIsAiOpen(true)}
            className="live-chart-ai-btn inline-flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-black"
          >
            <Brain className="h-4 w-4" />
            AI chat
          </button>
        </div>

        <div className="live-chart-frame h-[calc(100dvh-11rem)] min-h-[620px]">
          <TradingViewWidget key={`${symbol}-${theme}`} symbol={symbol} theme={theme} />
        </div>
      </section>

      {isAiOpen && (
        <div className="fixed inset-y-3 right-3 z-50 sm:inset-y-4 sm:right-4 lg:right-7">
          <AIAssistantChat
            key={capture?.createdAt || 'live-chart-ai'}
            compact
            onClose={() => setIsAiOpen(false)}
            initialImage={capture?.image}
            initialPair={initialPair}
            initialTimeframe="H1"
            initialPrompt={aiPrompt()}
          />
        </div>
      )}
    </div>
  );
}
