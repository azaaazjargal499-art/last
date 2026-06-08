// smart-inventory/frontend/src/pages/Analytics.jsx
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
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

const KpiCard = ({ icon: Icon, label, value, sub, tone = 'blue', progress }) => {
  const tones = {
    green: { text: 'text-emerald-300', icon: 'bg-emerald-300/12 text-emerald-200 ring-emerald-300/20', ring: '#34d399' },
    red: { text: 'text-rose-300', icon: 'bg-rose-300/12 text-rose-200 ring-rose-300/20', ring: '#fb7185' },
    blue: { text: 'text-blue-300', icon: 'bg-blue-300/12 text-blue-200 ring-blue-300/20', ring: '#60a5fa' },
    cyan: { text: 'text-cyan-300', icon: 'bg-cyan-300/12 text-cyan-200 ring-cyan-300/20', ring: '#22d3ee' },
    amber: { text: 'text-amber-300', icon: 'bg-amber-300/12 text-amber-200 ring-amber-300/20', ring: '#fbbf24' },
  };
  const activeTone = tones[tone] || tones.blue;
  const progressValue = clamp(progress);

  return (
    <div className="rounded-[20px] border border-white/10 bg-white/[0.055] p-4 shadow-lg shadow-blue-950/5 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-black text-slate-500">{label}</div>
          <div className={`mt-2 font-mono text-2xl font-black leading-none ${activeTone.text}`}>{value}</div>
          {sub && <div className="mt-2 truncate text-xs font-semibold text-slate-500">{sub}</div>}
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

const CustomBar = ({ x, y, width, height, value }) => (
  <rect
    x={x}
    y={y}
    width={width}
    height={Math.abs(height)}
    fill={value >= 0 ? '#34d399' : '#fb7185'}
    fillOpacity={0.9}
    rx={4}
  />
);

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
  const netPnl = monthlyRows.reduce((sum, row) => sum + Number(row.pnl || 0), 0);
  const tradeMonths = monthlyRows.filter((row) => Number(row.trades || 0) > 0);
  const avgMonth = tradeMonths.length ? netPnl / tradeMonths.length : 0;
  const bestPair = pairRows[0];
  const bestHour = [...hourlyRows].sort((a, b) => Number(b.pnl || 0) - Number(a.pnl || 0))[0];
  const activeHours = hourlyRows.filter((row) => Number(row.trades || 0) > 0).length;
  const totalPairTrades = pairRows.reduce((sum, row) => sum + Number(row.trades || 0), 0);

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-200">
          <BarChart3 className="h-3.5 w-3.5" />
          Performance analytics
        </div>
        <h1 className="font-display text-3xl font-black tracking-normal text-white">Аналитик</h1>
        <p className="mt-2 text-sm text-slate-400">Арилжааны үр дүн, цаг, валютын парын гүйцэтгэлийг нэг дор харна.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          icon={DollarSign}
          label="Net P&L"
          value={formatCurrency(netPnl)}
          tone={netPnl >= 0 ? 'green' : 'red'}
          sub={`${tradeMonths.length} идэвхтэй сар`}
        />
        <KpiCard
          icon={Gauge}
          label="Best pair win %"
          value={`${bestPair?.winRate || 0}%`}
          tone={(bestPair?.winRate || 0) >= 50 ? 'green' : 'amber'}
          sub={bestPair ? `${bestPair.pair} · ${bestPair.trades} trades` : 'Өгөгдөл байхгүй'}
          progress={bestPair?.winRate || 0}
        />
        <KpiCard
          icon={TrendingUp}
          label="Avg month"
          value={formatCurrency(avgMonth)}
          tone={avgMonth >= 0 ? 'green' : 'red'}
          sub="Идэвхтэй саруудын дундаж"
        />
        <KpiCard
          icon={Clock3}
          label="Best hour"
          value={bestHour?.label || '--:--'}
          tone={(bestHour?.pnl || 0) >= 0 ? 'cyan' : 'red'}
          sub={bestHour ? formatCurrency(bestHour.pnl || 0) : 'Өгөгдөл байхгүй'}
        />
        <KpiCard
          icon={Layers3}
          label="Tracked pairs"
          value={pairRows.length}
          tone="blue"
          sub={`${totalPairTrades} closed trades`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className={surface}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-bold text-white">Сарын ашиг / алдагдал</h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">{new Date().getFullYear()} performance</p>
            </div>
            <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-slate-300">{formatCurrency(netPnl)}</div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyRows}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.14)" />
              <XAxis dataKey="name" tick={chartAxis} axisLine={false} tickLine={false} />
              <YAxis tick={chartAxis} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value) => [formatCurrency(value), 'P&L']} contentStyle={tooltipStyle} />
              <Bar dataKey="pnl" shape={<CustomBar />} />
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section className={surface}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-bold text-white">Валютын паруудын үр дүн</h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">Pair performance ranking</p>
            </div>
            <Flame className="h-5 w-5 text-amber-300" />
          </div>
          {pairRows.length ? (
            <div className="space-y-4">
              {pairRows.slice(0, 7).map((pair) => {
                const positive = pair.totalPnL >= 0;
                return (
                  <div key={pair.pair} className="grid grid-cols-[82px_1fr_104px_58px] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-3">
                    <div className="font-mono text-sm font-bold text-white">{pair.pair}</div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full ${positive ? 'bg-emerald-300' : 'bg-rose-300'}`}
                        style={{ width: `${Math.min(Math.max(Math.abs(pair.winRate), 4), 100)}%` }}
                      />
                    </div>
                    <div className={`text-right font-mono text-sm font-bold ${positive ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {positive ? '+' : '-'}{formatCurrency(Math.abs(pair.totalPnL))}
                    </div>
                    <div className="text-right text-xs font-semibold text-slate-500">{pair.winRate}%</div>
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
              <p className="mt-1 text-xs font-semibold text-slate-500">{activeHours} цагийн бүсэд арилжаа бүртгэгдсэн</p>
            </div>
            <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-slate-300">{bestHour?.label || '--:--'} best</div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourlyRows}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.14)" />
              <XAxis dataKey="label" tick={chartAxis} axisLine={false} tickLine={false} />
              <YAxis tick={chartAxis} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value) => [formatCurrency(value), 'P&L']} contentStyle={tooltipStyle} />
              <Bar dataKey="pnl" shape={<CustomBar />} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>
    </div>
  );
}
