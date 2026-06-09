import { useQuery } from '@tanstack/react-query';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3, Clock3, DollarSign, Flame, Gauge, Layers3, TrendingUp } from 'lucide-react';
import { analyticsService } from '@/services/index';
import { formatCurrency } from '@/utils/formatters';

const surface = 'rounded-[24px] border border-white/10 bg-white/[0.055] p-5 shadow-xl shadow-black/10 backdrop-blur-xl';
const chartAxis = { fill: '#94a3b8', fontSize: 11 };

const clamp = (value, min = 0, max = 100) => Math.min(Math.max(Number(value) || 0, min), max);
const formatSignedCurrency = (value) => {
  const numeric = Number(value || 0);
  const amount = formatCurrency(Math.abs(numeric));
  return numeric < 0 ? `$-${amount.replace('$', '')}` : amount;
};

const KpiCard = ({ icon: Icon, label, value, sub, tone = 'green', progress }) => {
  const tones = {
    green: { text: 'text-[#10b981]', icon: 'bg-[#10b981]/12 text-[#10b981] ring-[#10b981]/25', ring: '#10b981' },
    red: { text: 'text-[#f43f5e]', icon: 'bg-[#f43f5e]/12 text-[#f43f5e] ring-[#f43f5e]/25', ring: '#f43f5e' },
    blue: { text: 'text-[#10b981]', icon: 'bg-[#10b981]/12 text-[#10b981] ring-[#10b981]/25', ring: '#10b981' },
    cyan: { text: 'text-[#10b981]', icon: 'bg-[#10b981]/12 text-[#10b981] ring-[#10b981]/25', ring: '#10b981' },
    amber: { text: 'text-amber-300', icon: 'bg-amber-300/12 text-amber-200 ring-amber-300/20', ring: '#fbbf24' },
  };
  const activeTone = tones[tone] || tones.blue;
  const progressValue = clamp(progress);

  return (
    <div className="rounded-[20px] border border-white/10 bg-white/[0.055] p-4 shadow-lg shadow-black/10 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-black text-slate-300">{label}</div>
          <div className={`number-value mt-2 text-2xl font-black leading-none ${activeTone.text}`}>{value}</div>
          {sub && <div className="mt-2 truncate text-xs font-semibold text-slate-400">{sub}</div>}
        </div>
        {progress !== undefined ? (
          <div
            className="grid h-14 w-14 flex-shrink-0 place-items-center rounded-full"
            style={{ background: `conic-gradient(${activeTone.ring} ${progressValue * 3.6}deg, rgba(148,163,184,0.18) 0deg)` }}
          >
            <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-950/85 text-[10px] font-black text-white">
              {Math.round(progressValue)}
            </div>
          </div>
        ) : (
          <div className={`grid h-10 w-10 flex-shrink-0 place-items-center rounded-full ring-1 ${activeTone.icon}`}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );
};

const tooltipStyle = {
  background: '#020617',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '12px',
  color: '#f8fafc',
  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.32)',
};

export default function Analytics() {
  const { data: monthly } = useQuery({ queryKey: ['monthly'], queryFn: () => analyticsService.getMonthly(new Date().getFullYear()) });
  const { data: pairs } = useQuery({ queryKey: ['pairs'], queryFn: analyticsService.getPairs });
  const { data: hourly } = useQuery({ queryKey: ['hourly'], queryFn: analyticsService.getHourly });

  const monthlyRows = monthly?.data || [];
  const pairRows = pairs?.pairs || [];
  const hourlyRows = hourly?.data || [];
  const monthlyChartRows = monthlyRows.map((row) => {
    const pnl = Number(row.pnl || 0);
    return {
      ...row,
      pnl,
      positivePnl: pnl >= 0 ? pnl : null,
      negativePnl: pnl < 0 ? pnl : null,
    };
  });
  const hourlyChartRows = hourlyRows.map((row) => {
    const pnl = Number(row.pnl || 0);
    return {
      ...row,
      pnl,
      positivePnl: pnl >= 0 ? pnl : null,
      negativePnl: pnl < 0 ? pnl : null,
    };
  });

  const netPnl = monthlyRows.reduce((sum, row) => sum + Number(row.pnl || 0), 0);
  const tradeMonths = monthlyRows.filter((row) => Number(row.trades || 0) > 0);
  const avgMonth = tradeMonths.length ? netPnl / tradeMonths.length : 0;
  const bestPair = pairRows[0];
  const bestHour = [...hourlyRows].sort((a, b) => Number(b.pnl || 0) - Number(a.pnl || 0))[0];
  const activeHours = hourlyRows.filter((row) => Number(row.trades || 0) > 0).length;
  const totalPairTrades = pairRows.reduce((sum, row) => sum + Number(row.trades || 0), 0);

  return (
    <div className="space-y-4 animate-slide-up sm:space-y-6">
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#10b981]/20 bg-[#10b981]/10 px-3 py-1 text-xs font-bold text-emerald-200">
          <BarChart3 className="h-3.5 w-3.5" />
          Арилжааны аналитик
        </div>
        <h1 className="font-display text-2xl font-black tracking-normal text-white sm:text-3xl">Аналитик</h1>
        <p className="mt-2 text-sm text-slate-300">Арилжааны үр дүн, цаг болон валютын хосуудын гүйцэтгэлийг нэг дор харна.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          icon={DollarSign}
          label="Цэвэр ашиг / алдагдал"
          value={formatSignedCurrency(netPnl)}
          tone={netPnl >= 0 ? 'green' : 'red'}
          sub={`${tradeMonths.length} идэвхтэй сар`}
        />
        <KpiCard
          icon={Gauge}
          label="Шилдэг хосын ялалт"
          value={`${bestPair?.winRate || 0}%`}
          tone={(bestPair?.winRate || 0) >= 50 ? 'green' : 'amber'}
          sub={bestPair ? `${bestPair.pair} · ${bestPair.trades} арилжаа` : 'Өгөгдөл байхгүй'}
          progress={bestPair?.winRate || 0}
        />
        <KpiCard
          icon={TrendingUp}
          label="Сарын дундаж"
          value={formatSignedCurrency(avgMonth)}
          tone={avgMonth >= 0 ? 'green' : 'red'}
          sub="Идэвхтэй саруудын дундаж"
        />
        <KpiCard
          icon={Clock3}
          label="Шилдэг цаг"
          value={bestHour?.label || '--:--'}
          tone={(bestHour?.pnl || 0) >= 0 ? 'cyan' : 'red'}
        />
        <KpiCard
          icon={Layers3}
          label="Хянаж буй хос"
          value={pairRows.length}
          tone="green"
          sub={`${totalPairTrades} хаагдсан арилжаа`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className={surface}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-bold text-white">Сарын ашиг / алдагдал</h3>
              <p className="mt-1 text-xs font-semibold text-slate-400">{new Date().getFullYear()} оны үзүүлэлт</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={monthlyChartRows} margin={{ top: 12, right: 18, left: 0, bottom: 4 }}>
              <defs>
                <linearGradient id="analyticsProfitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.34} />
                  <stop offset="92%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="analyticsLossGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.03} />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.32} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.14)" />
              <XAxis dataKey="name" tick={chartAxis} axisLine={false} tickLine={false} />
              <YAxis tick={chartAxis} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value) => [formatSignedCurrency(value), 'Ашиг / алдагдал']} contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="positivePnl" stroke="none" fill="url(#analyticsProfitGradient)" connectNulls={false} baseValue={0} />
              <Area type="monotone" dataKey="negativePnl" stroke="none" fill="url(#analyticsLossGradient)" connectNulls={false} baseValue={0} />
              <Line
                type="monotone"
                dataKey="pnl"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4, fill: '#10b981', stroke: '#0f1d31', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#4ef2b7', stroke: '#0f1d31', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </section>

        <section className={surface}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-bold text-white">Валютын хосуудын үр дүн</h3>
              <p className="mt-1 text-xs font-semibold text-slate-400">Хосуудын гүйцэтгэлийн эрэмбэ</p>
            </div>
            <Flame className="h-5 w-5 text-amber-300" />
          </div>
          {pairRows.length ? (
            <div className="space-y-4">
              {pairRows.slice(0, 7).map((pair) => {
                const positive = pair.totalPnL >= 0;
                return (
                  <div key={pair.pair} className="grid grid-cols-1 gap-2 rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-3 sm:grid-cols-[82px_1fr_104px_58px] sm:items-center sm:gap-3">
                    <div className="font-mono text-sm font-bold text-white">{pair.pair}</div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full ${positive ? 'bg-[#10b981]' : 'bg-[#f43f5e]'}`}
                        style={{ width: `${Math.min(Math.max(Math.abs(pair.winRate), 4), 100)}%` }}
                      />
                    </div>
                    <div className={`number-value text-sm font-bold sm:text-right ${positive ? 'text-[#10b981]' : 'text-[#f43f5e]'}`}>
                      {positive ? '+' : '-'}{formatCurrency(Math.abs(pair.totalPnL))}
                    </div>
                    <div className="text-xs font-semibold text-slate-400 sm:text-right">{pair.winRate}%</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 py-10 text-center text-sm text-slate-400">Өгөгдөл байхгүй</div>
          )}
        </section>

        <section className={`${surface} xl:col-span-2`}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-bold text-white">Цагийн ашиг / алдагдал</h3>
              <p className="mt-1 text-xs font-semibold text-slate-400">{activeHours} цагийн бүсэд арилжаа бүртгэгдсэн</p>
            </div>
            <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-slate-300">{bestHour?.label || '--:--'} шилдэг</div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={hourlyChartRows} margin={{ top: 12, right: 18, left: 0, bottom: 4 }}>
              <defs>
                <linearGradient id="hourlyProfitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.26} />
                  <stop offset="92%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="hourlyLossGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.03} />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.28} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.14)" />
              <XAxis dataKey="label" tick={chartAxis} axisLine={false} tickLine={false} />
              <YAxis tick={chartAxis} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value) => [formatSignedCurrency(value), 'Ашиг / алдагдал']} contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="positivePnl" stroke="none" fill="url(#hourlyProfitGradient)" connectNulls={false} baseValue={0} />
              <Area type="monotone" dataKey="negativePnl" stroke="none" fill="url(#hourlyLossGradient)" connectNulls={false} baseValue={0} />
              <Line
                type="monotone"
                dataKey="positivePnl"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 3.5, fill: '#10b981', stroke: '#0f1d31', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#4ef2b7', stroke: '#0f1d31', strokeWidth: 2 }}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="negativePnl"
                stroke="#f43f5e"
                strokeWidth={3}
                dot={{ r: 3.5, fill: '#f43f5e', stroke: '#0f1d31', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#fb7185', stroke: '#0f1d31', strokeWidth: 2 }}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </section>
      </div>
    </div>
  );
}
