import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Brain,
  CalendarDays,
  CheckCircle2,
  LineChart,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  WalletCards,
} from 'lucide-react';

const productTabs = [
  {
    label: 'Trade journal',
    icon: CalendarDays,
    eyebrow: 'Automated journal',
    title: 'Арилжаа бүр дээр юу болсон нь тод харагдана.',
    text: 'Open, close, lot, entry, exit, P&L, screenshot, note, strategy бүгд нэг мөр дээр хадгалагдана.',
    bullets: ['Real-time MT5 sync', 'Open болон closed trade', 'Screenshot ба тэмдэглэл', 'AI review action item'],
    preview: 'journal',
  },
  {
    label: 'MT5 sync',
    icon: WalletCards,
    eyebrow: 'Broker connector',
    title: 'MT5-аа холбоод trade-аа автоматаар тат.',
    text: 'Broker password шаардахгүй. Connector нь trade event-ийг journal руу явуулж, dashboard дээр шууд шинэчилнэ.',
    bullets: ['MT5 Expert Advisor connector', 'Token-based secure sync', 'Open/close event tracking', 'Manual бичилт багасна'],
    preview: 'sync',
  },
  {
    label: 'Live chart',
    icon: LineChart,
    eyebrow: 'Chart workspace',
    title: 'Chart дээрээ setup, entry, exit-ээ шалга.',
    text: 'Live chart, symbol tracking, screenshot, review note бүгд journal-тэй холбогдоно.',
    bullets: ['Symbol watch', 'Chart screenshot', 'Setup review', 'Entry/exit context'],
    preview: 'chart',
  },
  {
    label: 'AI review',
    icon: Brain,
    eyebrow: 'AI insight',
    title: 'Алдаа давтагдаж байгаа эсэхийг AI-р шалга.',
    text: 'AI нь таны trade note, result, risk behavior дээр үндэслээд сайжруулах action item гаргана.',
    bullets: ['Best setup detection', 'Repeated mistake review', 'Risk discipline check', 'Next action suggestion'],
    preview: 'ai',
  },
  {
    label: 'Risk tools',
    icon: ShieldCheck,
    eyebrow: 'Risk control',
    title: 'Risk, drawdown, plan-vs-actual-аа нэг дор хяна.',
    text: 'Position risk, max daily loss, profit factor, drawdown, risk score-оо dashboard дээр хурдан харна.',
    bullets: ['Max risk tracking', 'Daily loss guard', 'Profit factor', 'Plan vs actual'],
    preview: 'risk',
  },
];

const featureCards = [
  {
    title: 'Автомат журнал',
    text: 'MT5 account холбосны дараа open болон closed trade-ууд нэг дор орж ирнэ.',
    tone: 'from-emerald-500 via-teal-500 to-blue-600',
    type: 'journal',
  },
  {
    title: 'Нэг workspace',
    text: 'Calendar, analytics, strategy, screenshot, тэмдэглэл, AI review бүгд нэг dashboard дотор.',
    tone: 'from-blue-600 via-indigo-600 to-violet-700',
    type: 'workspace',
  },
  {
    title: 'Автомат статистик',
    text: 'Win rate, net P&L, profit factor, risk ratio, pair performance-оо гараар бодох шаардлагагүй.',
    tone: 'from-slate-900 via-slate-800 to-emerald-700',
    type: 'stats',
  },
];

const stats = [
  ['MT5 sync', 'Live'],
  ['Journal', 'Auto'],
  ['AI review', 'Ready'],
  ['Risk', 'Tracked'],
];

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-12 w-12 flex-shrink-0 place-items-center overflow-hidden rounded-2xl border border-emerald-200 bg-black shadow-lg shadow-emerald-200">
        <img src="/disciplinex-logo.png" alt="Disciplinex logo" className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0">
        <div className="text-lg font-black leading-5 text-slate-950">Disciplinex</div>
        <div className="text-sm font-semibold leading-5 text-slate-500">Smart Inventory Trading Journal</div>
      </div>
    </div>
  );
}

function ChameleonButton({ children, onClick, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full border border-white/60 bg-white/35 px-6 py-3 font-black text-slate-950 shadow-xl shadow-emerald-200/60 backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-2xl ${className}`}
    >
      <span className="absolute inset-0 bg-[linear-gradient(120deg,rgba(16,185,129,0.45),rgba(34,211,238,0.35),rgba(99,102,241,0.32),rgba(236,72,153,0.24))]" />
      <span className="absolute inset-[1px] rounded-full bg-white/55" />
      <span className="relative inline-flex items-center gap-2">{children}</span>
    </button>
  );
}

function HeroMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[760px]">
      <div className="overflow-hidden rounded-[34px] border border-slate-200 bg-white p-5 shadow-[0_36px_100px_rgba(15,23,42,0.12)]">
        <div className="rounded-[28px] bg-slate-950 p-5 text-white">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.34em] text-emerald-300">Smart Inventory</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Өнөөдрийн арилжааны зураглал</h2>
            </div>
            <div className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-black text-slate-950">+ $800.00</div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.85fr]">
            <div className="rounded-[26px] bg-white p-5 text-slate-950">
              <div className="mb-4 flex items-center justify-between text-sm font-bold text-slate-500">
                <span>Trade journal</span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">MT5 synced</span>
              </div>
              <div className="grid gap-3">
                {[
                  ['XAU/USD', 'BUY', '+$420', 'POI retest'],
                  ['BTCUSD', 'SELL', '-$120', 'Breakout'],
                  ['EUR/USD', 'BUY', '+$500', 'Liquidity sweep'],
                ].map(([symbol, side, pnl, strategy]) => (
                  <div key={symbol} className="grid grid-cols-[0.8fr_0.6fr_0.7fr_1.2fr] items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black">
                    <span>{symbol}</span>
                    <span className="text-slate-500">{side}</span>
                    <span className={pnl.startsWith('+') ? 'text-emerald-600' : 'text-rose-500'}>{pnl}</span>
                    <span className="truncate text-slate-500">{strategy}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[26px] border border-white/10 bg-white/10 p-5">
              <div className="flex items-center justify-between text-sm uppercase tracking-[0.22em] text-slate-300">
                <span>AI review</span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-950">Auto</span>
              </div>
              <div className="mt-6 rounded-[22px] bg-white p-5 text-slate-950">
                <div className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">Best setup</div>
                <p className="mt-3 text-xl font-black leading-tight">Liquidity sweep + POI retest</p>
                <p className="mt-4 text-sm font-semibold leading-6 text-slate-500">
                  Risk discipline сайжирсан. Давтагдсан алдаагаа бууруулахын тулд exit rule-ээ дахин шалга.
                </p>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  ['Win rate', '62%'],
                  ['Risk', '0.8%'],
                  ['Trades', '24'],
                  ['Plan', '92%'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-white/10 p-4">
                    <div className="text-xs font-bold text-slate-400">{label}</div>
                    <div className="mt-1 text-xl font-black text-white">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureVisual({ type }) {
  if (type === 'journal') {
    return (
      <div className="space-y-3">
        {[
          ['XAU/USD', '+$420', 'WIN'],
          ['EUR/USD', '+$180', 'WIN'],
          ['BTCUSD', '-$90', 'LOSS'],
        ].map(([symbol, pnl, status]) => (
          <div key={symbol} className="grid grid-cols-[1fr_0.8fr_0.7fr] rounded-2xl bg-white/20 px-4 py-3 text-sm font-black text-white backdrop-blur">
            <span>{symbol}</span>
            <span>{pnl}</span>
            <span>{status}</span>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'workspace') {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[
          [CalendarDays, 'Calendar'],
          [BarChart3, 'Analytics'],
          [LineChart, 'Live chart'],
          [Brain, 'AI review'],
        ].map(([Icon, label]) => (
          <div key={label} className="rounded-2xl bg-white/20 p-4 text-white backdrop-blur">
            <Icon className="mb-3 h-5 w-5" />
            <div className="text-sm font-black">{label}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {[
        ['Win rate', '62%', 'w-[62%]'],
        ['Profit factor', '2.4', 'w-[78%]'],
        ['Risk score', 'Low', 'w-[44%]'],
      ].map(([label, value, width]) => (
        <div key={label} className="rounded-2xl bg-white/18 p-4 backdrop-blur">
          <div className="flex justify-between text-sm font-black text-white">
            <span>{label}</span>
            <span>{value}</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-white/25">
            <div className={`h-2 rounded-full bg-emerald-300 ${width}`} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ProductPreview({ type }) {
  if (type === 'sync') {
    return (
      <div className="rounded-[28px] bg-slate-950 p-6 text-white">
        <div className="flex items-center justify-between">
          <span className="font-black">MT5 Connector</span>
          <span className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-black text-slate-950">Connected</span>
        </div>
        <div className="mt-6 space-y-3">
          {['Account verified', 'Token active', 'Trade stream online', 'Last sync: 8 seconds ago'].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              {item}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'chart') {
    return (
      <div className="rounded-[28px] bg-slate-950 p-6 text-white">
        <div className="mb-5 flex items-center justify-between">
          <span className="font-black">XAU/USD live chart</span>
          <span className="text-sm font-bold text-emerald-300">Setup marked</span>
        </div>
        <svg viewBox="0 0 520 220" className="h-64 w-full">
          <path d="M20 170 C80 130 105 155 150 115 C205 70 235 130 285 95 C340 58 380 70 420 44 C458 20 480 42 505 28" fill="none" stroke="#34d399" strokeWidth="8" strokeLinecap="round" />
          <path d="M90 48 L90 190 M245 48 L245 190 M400 48 L400 190" stroke="rgba(255,255,255,.12)" strokeWidth="2" />
          <circle cx="285" cy="95" r="14" fill="#22d3ee" />
          <rect x="312" y="70" width="132" height="42" rx="18" fill="rgba(255,255,255,.12)" />
          <text x="330" y="96" fill="white" fontSize="18" fontWeight="800">Entry zone</text>
        </svg>
      </div>
    );
  }

  if (type === 'ai') {
    return (
      <div className="rounded-[28px] bg-slate-950 p-6 text-white">
        <div className="text-sm font-black uppercase tracking-[0.24em] text-emerald-300">AI conclusion</div>
        <h4 className="mt-4 text-3xl font-black">Best setup: POI retest</h4>
        <p className="mt-4 text-base font-semibold leading-7 text-slate-300">
          Entry сайн байсан ч exit plan эрт өөрчлөгдсөн. Дараагийн 5 trade дээр fixed exit rule мөрд.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {['Risk discipline improved', 'Repeated loss reduced', 'Plan match 92%', 'Review exits'].map((item) => (
            <div key={item} className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-black">{item}</div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'risk') {
    return (
      <div className="rounded-[28px] bg-slate-950 p-6 text-white">
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ['Max daily risk', '1.2%'],
            ['Drawdown', '3.8%'],
            ['Profit factor', '2.4'],
            ['Plan match', '92%'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-3xl bg-white p-5 text-slate-950">
              <div className="text-sm font-black text-slate-400">{label}</div>
              <div className="mt-3 text-3xl font-black">{value}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[28px] bg-[linear-gradient(135deg,#ecfdf5,#ffffff_55%,#eff6ff)] p-5">
      <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-xl">
        <div className="grid grid-cols-5 gap-px bg-slate-100 text-sm font-black text-slate-500">
          {['Date', 'Symbol', 'Net P&L', 'Status', 'Strategy'].map((head) => (
            <div key={head} className="bg-white px-4 py-3">{head}</div>
          ))}
        </div>
        {[
          ['06/10/2026', 'XAU/USD', '+$600', 'WIN', 'POI Retest'],
          ['06/14/2026', 'BTCUSD', '-$225', 'LOSS', 'Breakout'],
          ['06/16/2026', 'EUR/USD', '+$400', 'WIN', 'Liquidity'],
          ['06/18/2026', 'GBP/USD', '+$150', 'WIN', 'SMC'],
        ].map((row) => (
          <div key={row.join('-')} className="grid grid-cols-5 gap-px bg-slate-100 text-sm font-bold">
            {row.map((cell, index) => (
              <div key={cell} className={`bg-white px-4 py-4 ${index === 2 ? (cell.startsWith('+') ? 'text-emerald-500' : 'text-rose-500') : 'text-slate-700'}`}>{cell}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionTitle({ eyebrow, title, text }) {
  return (
    <div className="mx-auto mb-12 max-w-4xl text-center">
      <div className="mb-4 text-sm font-black uppercase tracking-[0.24em] text-emerald-500">{eyebrow}</div>
      <h2 className="text-4xl font-black leading-tight text-slate-950 md:text-6xl">{title}</h2>
      <p className="mx-auto mt-5 max-w-2xl text-lg font-medium leading-8 text-slate-500">{text}</p>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [activeProduct, setActiveProduct] = useState(0);
  const currentProduct = productTabs[activeProduct];

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/85 backdrop-blur-xl">
        <nav className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 py-4 md:px-8">
          <Logo />
          <div className="hidden rounded-full border border-white/70 bg-white/35 p-1 shadow-lg shadow-emerald-100/70 backdrop-blur-xl md:flex">
            {[
              ['Journal', '#journal'],
              ['Tools', '#products'],
              ['Strategy', '#strategy'],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="rounded-full px-5 py-2.5 text-sm font-black text-slate-800 transition hover:bg-[linear-gradient(120deg,rgba(16,185,129,.22),rgba(34,211,238,.18),rgba(99,102,241,.18))] hover:text-emerald-700"
              >
                {label}
              </a>
            ))}
          </div>
          <div className="flex justify-end">
            <ChameleonButton onClick={() => navigate('/auth')}>
              Эхлэх <ArrowRight className="h-4 w-4" />
            </ChameleonButton>
          </div>
        </nav>
      </header>

      <main>
        <section className="overflow-hidden bg-[linear-gradient(120deg,#ffffff_0%,#f5f9ff_54%,#effdf8_100%)]">
          <div className="mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl items-center gap-12 px-5 py-16 md:px-8 lg:grid-cols-[0.88fr_1.12fr]">
            <div>
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-700 shadow-sm">
                <Sparkles className="h-4 w-4" />
                AI + MT5 trading journal workspace
              </div>
              <h1 className="text-5xl font-black leading-[0.98] tracking-normal text-slate-950 md:text-7xl">
                Арилжаагаа нэг дор цэгцтэй хяна.
              </h1>
              <p className="mt-7 max-w-2xl text-xl font-medium leading-9 text-slate-600">
                Smart Inventory бол trader-д зориулсан journal систем. MT5 sync, trade calendar, live chart, screenshot, strategy tracking, risk management, AI review бүгд нэг workspace дотор ажиллана.
              </p>
              <div className="mt-9 flex flex-col gap-4 sm:flex-row">
                <ChameleonButton onClick={() => navigate('/auth')} className="h-14 px-7 text-base">
                  Workspace руу орох <ArrowRight className="h-5 w-5" />
                </ChameleonButton>
                <a href="#products" className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-7 text-base font-black text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:text-emerald-700">
                  Боломжууд харах <PlayCircle className="h-5 w-5" />
                </a>
              </div>
              <div className="mt-10 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
                {stats.map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</div>
                    <div className="mt-2 text-lg font-black text-slate-950">{value}</div>
                  </div>
                ))}
              </div>
            </div>
            <HeroMockup />
          </div>
        </section>

        <section id="journal" className="px-5 py-24 md:px-8">
          <SectionTitle
            eyebrow="Automated journaling"
            title="Trade бүрийг автоматаар журналд."
            text="Бүртгэл, статистик, screenshot, тэмдэглэл, AI feedback-ээ нэг дор хадгалж дараагийн шийдвэрээ илүү тод гарга."
          />
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-3">
            {featureCards.map((feature) => (
              <div key={feature.title} className={`min-h-[380px] overflow-hidden rounded-[28px] bg-gradient-to-br ${feature.tone} p-8 text-white shadow-2xl shadow-slate-200`}>
                <h3 className="text-3xl font-black leading-tight text-white">{feature.title}</h3>
                <p className="mt-5 min-h-[96px] text-lg font-semibold leading-8 text-white/90">{feature.text}</p>
                <div className="mt-8 rounded-3xl bg-white/12 p-5 backdrop-blur">
                  <FeatureVisual type={feature.type} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="products" className="bg-slate-50 px-5 py-24 md:px-8">
          <SectionTitle
            eyebrow="All your tools"
            title="Нэг dashboard. Бүх хэрэгсэл."
            text="Tab бүр дээр дарж үз. Journal, MT5 sync, chart, AI insight, risk tool бүр өөр өөр workflow харуулна."
          />
          <div className="mx-auto mb-10 flex max-w-6xl flex-wrap justify-center gap-3">
            {productTabs.map(({ label, icon: Icon }, index) => {
              const isActive = activeProduct === index;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setActiveProduct(index)}
                  className={`inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-black transition hover:-translate-y-0.5 ${
                    isActive
                      ? 'border-white/70 bg-[linear-gradient(120deg,rgba(16,185,129,.22),rgba(34,211,238,.18),rgba(99,102,241,.18),rgba(236,72,153,.14))] text-emerald-700 shadow-xl shadow-emerald-100 backdrop-blur'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              );
            })}
          </div>

          <div className="mx-auto grid max-w-7xl items-center gap-8 rounded-[32px] border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-200/70 lg:grid-cols-[0.85fr_1.15fr] lg:p-12">
            <div>
              <div className="mb-5 text-sm font-black uppercase tracking-[0.22em] text-emerald-500">{currentProduct.eyebrow}</div>
              <h3 className="text-4xl font-black leading-tight text-slate-950">{currentProduct.title}</h3>
              <p className="mt-6 text-lg font-medium leading-8 text-slate-500">{currentProduct.text}</p>
              <div className="mt-8 space-y-4">
                {currentProduct.bullets.map((item) => (
                  <div key={item} className="flex items-center gap-3 text-base font-bold text-slate-700">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <ProductPreview type={currentProduct.preview} />
          </div>
        </section>

        <section id="strategy" className="px-5 py-24 md:px-8">
          <SectionTitle
            eyebrow="Trade analysis"
            title="Стратеги чинь ашигтай юу?"
            text="Strategy бүрээ playbook болгож хадгалаад win rate, P&L, алдаа давтагдаж байгаа эсэхийг бодит датагаар хар."
          />
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
            <div className="min-h-[420px] overflow-hidden rounded-[30px] bg-gradient-to-br from-emerald-500 via-blue-700 to-slate-950 p-8 text-white shadow-2xl shadow-slate-200">
              <div className="mb-12 flex items-center justify-between">
                <h3 className="text-3xl font-black">Strategy rule-ээ хадгалж мөрд</h3>
                <ArrowRight className="h-9 w-9 rounded-full border border-white/60 p-2" />
              </div>
              <div className="rounded-3xl bg-white p-6 text-slate-950 shadow-2xl">
                <div className="text-sm font-black text-slate-400">General information</div>
                <div className="mt-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold">Absorption Reversal</div>
                <div className="mt-5 space-y-3">
                  {['Entry criteria', 'Broken structure confirmation', 'Risk below 1%'].map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm font-bold">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="min-h-[420px] overflow-hidden rounded-[30px] bg-gradient-to-br from-blue-600 via-indigo-700 to-slate-950 p-8 text-white shadow-2xl shadow-slate-200">
              <div className="mb-12 flex items-center justify-between">
                <h3 className="max-w-lg text-3xl font-black">Performance-оо хугацааны явцаар шинжил</h3>
                <ArrowRight className="h-9 w-9 rounded-full border border-white/60 p-2" />
              </div>
              <div className="rounded-3xl bg-white p-6 text-slate-950 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-black">Opening Drive</div>
                    <div className="mt-1 text-sm font-bold text-blue-600">87 trades</div>
                  </div>
                  <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-600">Private</div>
                </div>
                <div className="mt-7 grid grid-cols-2 gap-5">
                  {[
                    ['Win rate', '53.65%'],
                    ['Net P&L', '$27,649.61'],
                    ['Profit factor', '5.0'],
                    ['Missed trades', '54'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div className="text-sm font-bold text-slate-400">{label}</div>
                      <div className="mt-1 text-2xl font-black text-slate-950">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-950 px-5 py-20 text-center text-white md:px-8">
          <h2 className="text-4xl font-black md:text-6xl">Одоо арилжаагаа датагаар удирд.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg font-medium leading-8 text-slate-300">
            Бүртгэл үүсгээд dashboard, live chart, MT5 sync, AI review-ээ нэг дор ашигла.
          </p>
          <ChameleonButton onClick={() => navigate('/auth')} className="mt-9 h-14 px-8 text-base">
            Эхлэх <ArrowRight className="h-5 w-5" />
          </ChameleonButton>
        </section>
      </main>
    </div>
  );
}
