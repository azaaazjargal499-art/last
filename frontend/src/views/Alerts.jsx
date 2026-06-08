// smart-inventory/frontend/src/pages/Alerts.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Bell, Plus, Trash2, X, CheckCircle, Clock } from 'lucide-react';
import { alertService } from '@/services/index';
import { formatDateTime, FOREX_PAIRS } from '@/utils/formatters';
import toast from 'react-hot-toast';

const ALERT_TYPES = [
  { value: 'PRICE_ABOVE', label: '📈 Үнэ дээш гарахад' },
  { value: 'PRICE_BELOW', label: '📉 Үнэ доош унахад' },
  { value: 'STOP_LOSS',   label: '🛑 Stop Loss хүрэхэд' },
  { value: 'TAKE_PROFIT', label: '🎯 Take Profit хүрэхэд' },
];

const inputCls = "w-full bg-[var(--bg-base)] border border-[var(--border)] text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary-500";

export default function Alerts() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const { data, isLoading } = useQuery({ queryKey: ['alerts'], queryFn: alertService.getAll });

  const createMutation = useMutation({
    mutationFn: alertService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['alerts'] }); toast.success('Alert үүслээ!'); setShowForm(false); reset(); },
  });

  const deleteMutation = useMutation({
    mutationFn: alertService.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['alerts'] }); toast.success('Alert устгагдлаа'); },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) => alertService.update(id, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const alerts = data?.alerts || [];
  const activeAlerts = alerts.filter(a => a.isActive && !a.isTriggered);
  const triggeredAlerts = alerts.filter(a => a.isTriggered);

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Үнийн мэдэгдлүүд</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">Тодорхой үнийн түвшинд хүрэхэд мэдэгдэл авна уу</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Alert нэмэх
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Нийт', value: alerts.length, icon: Bell, color: 'text-white' },
          { label: 'Идэвхтэй', value: activeAlerts.length, icon: Clock, color: 'text-blue-400' },
          { label: 'Биелсэн', value: triggeredAlerts.length, icon: CheckCircle, color: 'text-green-400' },
        ].map(s => (
          <div key={s.label} className="card flex items-center gap-3">
            <s.icon className={`w-5 h-5 ${s.color}`} />
            <div>
              <div className={`font-display text-2xl font-bold stat-value ${s.color}`}>{s.value}</div>
              <div className="text-xs text-[var(--text-muted)]">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Alerts List */}
      <div className="card">
        {isLoading ? (
          <div className="text-center py-12 text-[var(--text-muted)]">Ачааллаж байна...</div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" />
            <div className="text-[var(--text-muted)] text-sm">Alert байхгүй байна. Шинэ alert үүсгэнэ үү!</div>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map(alert => (
              <div key={alert.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                alert.isTriggered ? 'bg-green-400/5 border-green-400/20' :
                alert.isActive ? 'bg-[var(--bg-hover)] border-[var(--border)]' :
                'bg-[var(--bg-base)] border-[var(--border)] opacity-50'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${alert.isTriggered ? 'bg-green-400' : alert.isActive ? 'bg-blue-400 animate-pulse' : 'bg-gray-600'}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-white text-sm">{alert.pair}</span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {ALERT_TYPES.find(t => t.value === alert.alertType)?.label}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">
                      Зорилтот үнэ: <span className="font-mono text-white">{alert.targetPrice}</span>
                      {alert.isTriggered && <span className="ml-2 text-green-400">✓ Биелсэн {formatDateTime(alert.triggeredAt)}</span>}
                    </div>
                    {alert.message && <div className="text-xs text-[var(--text-muted)] mt-0.5 italic">"{alert.message}"</div>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!alert.isTriggered && (
                    <button onClick={() => toggleMutation.mutate({ id: alert.id, isActive: !alert.isActive })}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                        alert.isActive ? 'border-blue-400/30 text-blue-400 hover:bg-blue-400/10' : 'border-gray-600 text-gray-500 hover:text-white'
                      }`}>
                      {alert.isActive ? 'Идэвхтэй' : 'Идэвхгүй'}
                    </button>
                  )}
                  <button onClick={() => deleteMutation.mutate(alert.id)}
                    className="p-1.5 hover:bg-red-400/10 rounded text-[var(--text-muted)] hover:text-red-400 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
              <h2 className="font-display font-semibold text-white">Alert үүсгэх</h2>
              <button onClick={() => { setShowForm(false); reset(); }} className="p-1.5 hover:bg-[var(--bg-hover)] rounded">
                <X className="w-4 h-4 text-[var(--text-muted)]" />
              </button>
            </div>
            <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="p-5 space-y-4">
              <div>
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Валютын пар</label>
                <select {...register('pair', { required: true })} className={inputCls}>
                  {FOREX_PAIRS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Мэдэгдлийн төрөл</label>
                <select {...register('alertType', { required: true })} className={inputCls}>
                  {ALERT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Зорилтот үнэ</label>
                <input {...register('targetPrice', { required: true })} type="number" step="0.00001" className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Нэмэлт тэмдэглэл</label>
                <input {...register('message')} placeholder="Жишээ: EUR нь дэмжлэгийн шугамд хүрлээ" className={inputCls} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-[var(--border)] text-[var(--text-secondary)] hover:text-white py-2.5 rounded-lg text-sm">Болих</button>
                <button type="submit" className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-lg text-sm font-medium">Үүсгэх</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
