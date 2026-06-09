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
  { label: 'Trade journal', icon: CalendarDays },
  { label: 'MT5 sync', icon: WalletCards },
  { label: 'Live chart', icon: LineChart },
  { label: 'AI review', icon: Brain },
  { label: 'Risk tools', icon: ShieldCheck },
];

const featureCards = [
  {
    title: 'Автомат журнал',
    text: 'MT5 account холбосны дараа open болон closed trade-ууд нэг дор орж ирнэ. Entry, exit, lot, P&L, symbol, огноо бүгд цэгцтэй хадгалагдана.',
    tone: 'from-emerald-500 via-teal-500 to-blue-600',
  },
  {
    title: 'Нэг workspace',
    text: 'Calendar, analytics, strategy, screenshot, тэмдэглэл, AI review бүгд нэг dashboard дотор. Арилжаагаа салангид файлгүйгээр хянана.',
    tone: 'from-blue-600 via-indigo-600 to-violet-700',
  },
  {
    title: 'Автомат статистик',
    text: 'Win rate, net P&L, profit factor, risk ratio, pair performance, strategy performance-оо гараар бодох шаардлагагүй.',
    tone: 'from-slate-900 via-slate-800 to-emerald-700',
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
        <div className="font-display text-lg font-black leading-5 text-slate-950">Disciplinex</div>
        <div className="text-sm font-semibold leading-5 text-slate-500">Smart Inventory Trading Journal</div>
      </div>
    </div>
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

function SectionTitle({ eyebrow, title, text }) {
  return (
    <div className="mx-auto mb-12 max-w-4xl text-center">
      <div className="mb-4 text-sm font-black uppercase tracking-[0.24em] text-emerald-500">{eyebrow}</div>
      <h2 className="font-display text-4xl font-black leading-tight text-slate-950 md:text-6xl">{title}</h2>
      <p className="mx-auto mt-5 max-w-2xl text-lg font-medium leading-8 text-slate-500">{text}</p>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <Logo />
          <div className="hidden items-center gap-7 text-sm font-bold text-slate-500 md:flex">
            <a href="#journal" className="hover:text-slate-950">Journal</a>
            <a href="#products" className="hover:text-slate-950">Tools</a>
            <a href="#strategy" className="hover:text-slate-950">Strategy</a>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/auth')} className="hidden rounded-full px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-100 sm:block">
              Нэвтрэх
            </button>
            <button onClick={() => navigate('/auth')} className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-xl shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-slate-950">
              Эхлэх <ArrowRight className="h-4 w-4" />
            </button>
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
              <h1 className="font-display text-5xl font-black leading-[0.98] tracking-normal text-slate-950 md:text-7xl">
                Арилжаагаа нэг дор цэгцтэй хяна.
              </h1>
              <p className="mt-7 max-w-2xl text-xl font-medium leading-9 text-slate-600">
                Smart Inventory бол trader-д зориулсан journal систем. MT5 sync, trade calendar, live chart, screenshot, strategy tracking, risk management, AI review бүгд нэг workspace дотор ажиллана.
              </p>
              <div className="mt-9 flex flex-col gap-4 sm:flex-row">
                <button onClick={() => navigate('/auth')} className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-blue-600 px-7 text-base font-black text-white shadow-2xl shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-slate-950">
                  Workspace руу орох <ArrowRight className="h-5 w-5" />
                </button>
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
              <div key={feature.title} className={`min-h-[340px] overflow-hidden rounded-[28px] bg-gradient-to-br ${feature.tone} p-8 text-white shadow-2xl shadow-slate-200`}>
                <h3 className="text-3xl font-black leading-tight">{feature.title}</h3>
                <p className="mt-5 text-lg font-semibold leading-8 text-white/90">{feature.text}</p>
                <div className="mt-10 rounded-3xl bg-white/18 p-5 backdrop-blur">
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="h-20 rounded-2xl bg-white/85" />
                    ))}
                  </div>
                  <div className="mt-4 h-3 rounded-full bg-white/35">
                    <div className="h-3 w-2/3 rounded-full bg-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="products" className="bg-slate-50 px-5 py-24 md:px-8">
          <SectionTitle
            eyebrow="All your tools"
            title="Нэг dashboard. Бүх хэрэгсэл."
            text="Better trader болохын тулд хэрэгтэй journal, broker sync, chart, AI insight, risk tool, strategy tracker бүгд нэг дор."
          />
          <div className="mx-auto mb-10 flex max-w-5xl flex-wrap justify-center gap-3">
            {productTabs.map(({ label, icon: Icon }, index) => (
              <div key={label} className={`inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-black ${index === 0 ? 'border-emerald-300 bg-white text-emerald-700 shadow-lg shadow-emerald-100' : 'border-slate-200 bg-white text-slate-600'}`}>
                <Icon className="h-4 w-4" />
                {label}
              </div>
            ))}
          </div>

          <div className="mx-auto grid max-w-7xl items-center gap-8 rounded-[32px] border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-200/70 lg:grid-cols-[0.85fr_1.15fr] lg:p-12">
            <div>
              <div className="mb-5 text-sm font-black uppercase tracking-[0.22em] text-emerald-500">Journal table</div>
              <h3 className="text-4xl font-black leading-tight text-slate-950">Арилжаа бүр дээр юу болсон нь тод харагдана.</h3>
              <p className="mt-6 text-lg font-medium leading-8 text-slate-500">
                Strategy, setup, risk, result, screenshot, note, AI conclusion нэг мөр дээр холбогдоно. Ингэснээр та давтагддаг алдаагаа хурдан олно.
              </p>
              <div className="mt-8 space-y-4">
                {['Real-time MT5 sync', 'Open болон closed trade', 'Screenshot ба тэмдэглэл', 'AI review ба action item'].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-base font-bold text-slate-700">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
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
          <h2 className="font-display text-4xl font-black md:text-6xl">Одоо арилжаагаа датагаар удирд.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg font-medium leading-8 text-slate-300">
            Бүртгэл үүсгээд dashboard, live chart, MT5 sync, AI review-ээ нэг дор ашигла.
          </p>
          <button onClick={() => navigate('/auth')} className="mt-9 inline-flex h-14 items-center justify-center gap-2 rounded-full bg-white px-8 text-base font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-emerald-100">
            Нэвтрэх <ArrowRight className="h-5 w-5" />
          </button>
        </section>
      </main>
    </div>
  );
}
