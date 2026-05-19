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
import { analyticsService } from '@/services/index';
import { formatCurrency } from '@/utils/formatters';

const surface = 'rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-2xl shadow-black/10 backdrop-blur-xl';
const chartAxis = { fill: '#94a3b8', fontSize: 11 };

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

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <div className="mb-3 inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-200">
          Performance analytics
        </div>
        <h1 className="font-display text-3xl font-black tracking-normal text-white">Аналитик</h1>
        <p className="mt-2 text-sm text-slate-400">Арилжааны үр дүн, цаг, валютын парын гүйцэтгэлийг нэг дор харна.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className={surface}>
          <h3 className="mb-4 font-display text-lg font-bold text-white">Сарын ашиг / алдагдал ({new Date().getFullYear()})</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthly?.data || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.14)" />
              <XAxis dataKey="name" tick={chartAxis} axisLine={false} tickLine={false} />
              <YAxis tick={chartAxis} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value) => [formatCurrency(value), 'P&L']} contentStyle={tooltipStyle} />
              <Bar dataKey="pnl" shape={<CustomBar />} />
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section className={surface}>
          <h3 className="mb-4 font-display text-lg font-bold text-white">Валютын паруудын үр дүн</h3>
          {pairs?.pairs?.length ? (
            <div className="space-y-4">
              {pairs.pairs.slice(0, 7).map((pair) => {
                const positive = pair.totalPnL >= 0;
                return (
                  <div key={pair.pair} className="grid grid-cols-[80px_1fr_96px_52px] items-center gap-3">
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
          <h3 className="mb-4 font-display text-lg font-bold text-white">Цагийн ашиг / алдагдал</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={hourly?.data || []}>
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
