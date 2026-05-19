// smart-inventory/frontend/src/pages/RiskManagement.jsx
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { ShieldAlert, Calculator, AlertTriangle, CheckCircle } from 'lucide-react';
import { riskService } from '@/services/index';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, FOREX_PAIRS } from '@/utils/formatters';

const inputCls = "w-full bg-[var(--bg-base)] border border-[var(--border)] text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary-500";

export default function RiskManagement() {
  const { user } = useAuthStore();
  const [result, setResult] = useState(null);
  const { register, handleSubmit } = useForm({
    defaultValues: {
      accountBalance: user?.balance || 10000,
      riskPercent: user?.riskPerTrade || 2,
    }
  });

  const { data: exposure } = useQuery({
    queryKey: ['exposure'],
    queryFn: riskService.getExposure,
  });

  const calcMutation = useMutation({
    mutationFn: riskService.calculate,
    onSuccess: (data) => setResult(data),
  });

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Эрсдэлийн хяналт</h1>
        <p className="text-[var(--text-muted)] text-sm mt-1">Позицийн хэмжээ тооцоолох, нийт эрсдэл хянах</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Calculator */}
        <div className="card">
          <div className="flex items-center gap-2 mb-5">
            <Calculator className="w-5 h-5 text-primary-400" />
            <h3 className="font-display font-semibold text-white">Позицийн хэмжээ тооцоолол</h3>
          </div>

          <form onSubmit={handleSubmit(d => calcMutation.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Валютын пар</label>
                <select {...register('pair')} className={inputCls}>
                  {FOREX_PAIRS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Данс баланс (USD)</label>
                <input {...register('accountBalance')} type="number" className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Эрсдэл % *</label>
                <input {...register('riskPercent')} type="number" step="0.1" min="0.1" max="10" className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Оролтын үнэ</label>
                <input {...register('entryPrice')} type="number" step="0.00001" className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Stop Loss *</label>
                <input {...register('stopLoss')} type="number" step="0.00001" className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Лот хэмжээ (шалгах)</label>
                <input {...register('lotSize')} type="number" step="0.01" className={inputCls} />
              </div>
            </div>

            <button type="submit" disabled={calcMutation.isPending}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
              Тооцоолох
            </button>
          </form>

          {/* Result */}
          {result && (
            <div className="mt-5 p-4 bg-[var(--bg-hover)] rounded-xl space-y-3 animate-slide-up">
              <div className="font-display font-semibold text-white text-sm mb-3">📊 Тооцооллын үр дүн</div>
              {[
                { label: 'Данс баланс', value: formatCurrency(result.accountBalance), color: 'text-white' },
                { label: 'Эрсдэлийн дүн', value: formatCurrency(result.riskAmount), color: 'text-warn' },
                { label: 'Pip-ийн алдагдал', value: `${result.pipsAtRisk} pips`, color: 'text-[var(--text-secondary)]' },
                { label: 'Санал болгох лот', value: result.recommendedLotSize, color: 'text-primary-400 font-bold text-lg stat-value' },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center text-sm">
                  <span className="text-[var(--text-muted)]">{item.label}</span>
                  <span className={`font-mono ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Open Exposure */}
        <div className="card">
          <div className="flex items-center gap-2 mb-5">
            <ShieldAlert className="w-5 h-5 text-warn" />
            <h3 className="font-display font-semibold text-white">Нийт нээлттэй эрсдэл</h3>
          </div>

          {exposure?.isOverExposed && (
            <div className="flex items-center gap-2 p-3 bg-red-400/10 border border-red-400/20 rounded-lg mb-4">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="text-red-400 text-sm">Нийт эрсдэл 10%-аас хэтэрлээ!</span>
            </div>
          )}

          {exposure?.positions?.length === 0 ? (
            <div className="flex items-center gap-2 p-3 bg-green-400/10 border border-green-400/20 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm">Нээлттэй позиц байхгүй</span>
            </div>
          ) : (
            <>
              <div className="mb-4 p-3 bg-[var(--bg-hover)] rounded-lg">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--text-muted)]">Нийт эрсдэл</span>
                  <span className={`font-mono font-bold ${(exposure?.totalExposurePercent || 0) > 10 ? 'text-red-400' : 'text-green-400'}`}>
                    {exposure?.totalExposurePercent || 0}%
                  </span>
                </div>
                <div className="h-2 bg-[var(--bg-card)] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${(exposure?.totalExposurePercent || 0) > 10 ? 'bg-red-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(exposure?.totalExposurePercent || 0, 100)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                {exposure?.positions?.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 bg-[var(--bg-hover)] rounded-lg text-sm">
                    <div>
                      <span className="font-mono font-medium text-white">{p.pair}</span>
                      <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${p.direction === 'BUY' ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>
                        {p.direction}
                      </span>
                    </div>
                    <span className={`font-mono text-xs ${p.exposurePercent > 3 ? 'text-warn' : 'text-[var(--text-secondary)]'}`}>
                      {p.exposurePercent}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
