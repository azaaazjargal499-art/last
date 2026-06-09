// smart-inventory/frontend/src/pages/Dashboard.jsx
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  Award,
  BarChart2,
  DollarSign,
  Percent,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { analyticsService, tradeService } from '@/services/index';
import { formatCurrency, formatDateTime, formatPnL, getPnLClass } from '@/utils/formatters';
import { useAuthStore } from '@/store/authStore';

const surface = 'rounded-3xl border border-white/10 bg-white/[0.055] shadow-2xl shadow-black/10 backdrop-blur-xl';

const StatCard = ({ icon: Icon, label, value, sub, tone = 'slate' }) => {
  const toneClass = {
    emerald: 'stat-icon-primary text-emerald-100',
    rose: 'stat-icon-primary text-emerald-100',
    cyan: 'stat-icon-primary text-emerald-100',
    amber: 'stat-icon-primary text-emerald-100',
    slate: 'stat-icon-primary text-emerald-100',
  }[tone];

  return (
    <div className={`${surface} p-4 sm:p-5`}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="break-words text-xs font-bold leading-5 text-slate-200 sm:text-sm">{label}</div>
          {sub && <div className="mt-1.5 break-words text-xs font-medium leading-5 text-slate-500">{sub}</div>}
        </div>
        <div className={`stat-icon-luxury grid h-10 w-10 flex-shrink-0 place-items-center ${toneClass}`}>
          <Icon className="h-7 w-7" />
        </div>
      </div>
      <div className="number-value text-[1.55rem] font-extrabold leading-none text-white sm:text-[1.7rem]">{value}</div>
    </div>
  );
};

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/95 p-3 text-sm shadow-xl">
      <div className="mb-1 text-xs font-semibold text-slate-400">{label}</div>
      <div className={`number-value font-extrabold ${value >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
        {formatCurrency(value)}
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuthStore();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: analyticsService.getDashboard,
  });

  const { data: monthly } = useQuery({
    queryKey: ['monthly'],
    queryFn: () => analyticsService.getMonthly(new Date().getFullYear()),
  });

  const { data: equity } = useQuery({
    queryKey: ['equity'],
    queryFn: analyticsService.getEquityCurve,
  });

  const { data: tradesData } = useQuery({
    queryKey: ['trades', { limit: 5 }],
    queryFn: () => tradeService.getAll({ limit: 5, sortBy: 'openedAt', order: 'desc' }),
  });

  const s = stats?.summary;
  const displayBalance = s?.currentBalance ?? user?.balance ?? 0;

  return (
    <div className="space-y-4 animate-slide-up sm:space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="mb-3 inline-flex items-center rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-200">
            Trading overview
          </div>
          <h1 className="font-display text-2xl font-black tracking-normal text-white sm:text-3xl">Хянах самбар</h1>
          <p className="mt-2 text-sm text-slate-400">
            Сайн байна уу, <span className="font-bold text-emerald-300">{user?.username || 'trader'}</span>. Өнөөдрийн арилжааны ерөнхий зураглал.
          </p>
        </div>
        <Link
          to="/dashboard/trades"
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-black text-slate-950 shadow-lg shadow-emerald-950/20 transition-colors hover:bg-emerald-300 sm:w-auto"
        >
          <TrendingUp className="h-4 w-4" />
          Арилжаа бүртгэх
        </Link>
      </div>

      {statsLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="h-36 animate-pulse rounded-3xl bg-white/[0.055]" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={DollarSign}
            label="Нийт ашиг/алдагдал"
            value={s ? formatPnL(s.totalPnL) : '$0'}
            tone={s?.totalPnL >= 0 ? 'emerald' : 'rose'}
            sub={`Баланс: ${formatCurrency(s?.currentBalance || 0)}`}
          />
          <StatCard
            icon={Percent}
            label="Win rate"
            value={`${s?.winRate || 0}%`}
            tone={s?.winRate >= 50 ? 'emerald' : 'amber'}
            sub={`${s?.winTrades || 0}W / ${s?.lossTrades || 0}L`}
          />
          <StatCard icon={Activity} label="Нийт арилжаа" value={s?.totalTrades || 0} tone="cyan" sub={`${s?.openTrades || 0} нээлттэй`} />
          <StatCard icon={Target} label="Risk / Reward" value={`1:${s?.riskRewardRatio || 0}`} sub="Дундаж харьцаа" />
          <StatCard icon={TrendingUp} label="Дундаж ашиг" value={formatCurrency(s?.avgWin || 0)} tone="emerald" />
          <StatCard icon={TrendingDown} label="Дундаж алдагдал" value={formatCurrency(s?.avgLoss || 0)} tone="rose" />
          <StatCard icon={BarChart2} label="Хаагдсан арилжаа" value={s?.closedTrades || 0} />
          <StatCard
            icon={Award}
            label="Account balance"
            value={formatCurrency(displayBalance)}
            tone="amber"
            sub={s?.accountEquity ? `Equity: ${formatCurrency(s.accountEquity)}` : undefined}
          />
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <div className={`${surface} p-4 sm:p-5`}>
          <h3 className="mb-4 font-display text-lg font-bold text-white">Сарын P&L</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthly?.data || []}>
              <defs>
                <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.14)" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="pnl" stroke="#34d399" strokeWidth={2.5} fill="url(#pnlGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className={`${surface} p-4 sm:p-5`}>
          <h3 className="mb-4 font-display text-lg font-bold text-white">Equity curve</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={equity?.data || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.14)" />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#020617', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', color: '#f8fafc' }} />
              <Line type="monotone" dataKey="balance" stroke="#34d399" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={`${surface} p-4 sm:p-5`}>
        <h3 className="mb-4 font-display text-lg font-bold text-white">Сүүлийн арилжаанууд</h3>
        {tradesData?.trades?.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 py-10 text-center text-sm text-slate-400">
            Одоогоор арилжаа бүртгэгдээгүй байна.
          </div>
        ) : (
          <>
            <div className="grid gap-3 md:hidden">
              {tradesData?.trades?.map((trade) => (
                <div key={trade.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-mono text-sm font-bold text-white">{trade.pair}</div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${trade.direction === 'BUY' ? 'bg-emerald-300/15 text-emerald-200' : 'bg-rose-300/15 text-rose-200'}`}>
                      {trade.direction}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400">
                    <div>Оролт: <span className="font-mono text-slate-200">{trade.entryPrice}</span></div>
                    <div>Гаралт: <span className="font-mono text-slate-200">{trade.exitPrice || '-'}</span></div>
                    <div>Лот: <span className="font-mono text-slate-200">{trade.lotSize}</span></div>
                    <div className={getPnLClass(trade.pnl)}>P&L: {trade.pnl !== null ? formatPnL(trade.pnl) : '-'}</div>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">{formatDateTime(trade.openedAt)}</div>
                </div>
              ))}
            </div>
            <div className="hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  {['Пар', 'Чиглэл', 'Оролт', 'Гаралт', 'Лот', 'P&L', 'Огноо'].map((header) => (
                    <th key={header} className="pb-3 pr-4">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {tradesData?.trades?.map((trade) => (
                  <tr key={trade.id} className="transition-colors hover:bg-white/[0.04]">
                    <td className="py-3 pr-4 font-mono font-bold text-white">{trade.pair}</td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${trade.direction === 'BUY' ? 'bg-emerald-300/15 text-emerald-200' : 'bg-rose-300/15 text-rose-200'}`}>
                        {trade.direction}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-mono text-slate-300">{trade.entryPrice}</td>
                    <td className="py-3 pr-4 font-mono text-slate-300">{trade.exitPrice || '-'}</td>
                    <td className="py-3 pr-4 font-mono text-slate-300">{trade.lotSize}</td>
                    <td className={`py-3 pr-4 font-mono font-bold ${getPnLClass(trade.pnl)}`}>
                      {trade.pnl !== null ? formatPnL(trade.pnl) : '-'}
                    </td>
                    <td className="py-3 pr-4 text-xs text-slate-400">{formatDateTime(trade.openedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
