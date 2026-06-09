// smart-inventory/frontend/src/pages/Strategies.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { BookOpen, Plus, Pencil, Trash2, X, TrendingUp, TrendingDown } from 'lucide-react';
import { strategyService } from '@/services/index';
import { formatCurrency, FOREX_PAIRS, TIMEFRAMES } from '@/utils/formatters';
import toast from 'react-hot-toast';

const inputCls = "w-full bg-[var(--bg-base)] border border-[var(--border)] text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary-500";

export default function Strategies() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedPairs, setSelectedPairs] = useState([]);
  const { register, handleSubmit, reset, setValue } = useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['strategies'],
    queryFn: strategyService.getAll,
  });

  const saveMutation = useMutation({
    mutationFn: (d) => editing
      ? strategyService.update(editing.id, { ...d, pairs: selectedPairs })
      : strategyService.create({ ...d, pairs: selectedPairs }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['strategies'] });
      toast.success(editing ? 'Стратеги шинэчлэгдлээ!' : 'Стратеги үүслээ!');
      closeForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: strategyService.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['strategies'] });
      toast.success('Стратеги устгагдлаа');
    },
  });

  const closeForm = () => { setShowForm(false); setEditing(null); setSelectedPairs([]); reset(); };

  const openEdit = (s) => {
    setEditing(s);
    setSelectedPairs(s.pairs || []);
    setShowForm(true);
    setValue('name', s.name);
    setValue('description', s.description);
    setValue('rules', s.rules);
    setValue('timeframe', s.timeframe);
  };

  const togglePair = (p) =>
    setSelectedPairs(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  const strategies = data?.strategies || [];

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Арилжааны стратегиуд</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">Стратегиудаа бүртгэж, тус бүрийн үр дүнг хянана уу</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Стратеги нэмэх
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="card h-48 animate-pulse" />)}
        </div>
      ) : strategies.length === 0 ? (
        <div className="card text-center py-16">
          <BookOpen className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
          <div className="text-white font-medium mb-1">Стратеги байхгүй байна</div>
          <div className="text-[var(--text-muted)] text-sm">Эхний стратегиа нэмж эхэлнэ үү</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {strategies.map(s => (
            <div key={s.id} className="card hover:border-[rgba(99,179,237,0.2)] transition-all group">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-display font-semibold text-white">{s.name}</h3>
                  {s.timeframe && (
                    <span className="text-xs bg-blue-400/10 text-blue-400 px-2 py-0.5 rounded mt-1 inline-block">
                      {s.timeframe}
                    </span>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(s)}
                    className="p-1.5 hover:bg-[var(--bg-hover)] rounded text-[var(--text-muted)] hover:text-white">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteMutation.mutate(s.id)}
                    className="p-1.5 hover:bg-red-400/10 rounded text-[var(--text-muted)] hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Description */}
              {s.description && (
                <p className="text-sm text-[var(--text-secondary)] mb-3 line-clamp-2">{s.description}</p>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { label: 'Арилжаа', value: s.tradeCount },
                  { label: 'Win Rate', value: `${s.winRate}%`, color: s.winRate >= 50 ? 'text-green-400' : 'text-red-400' },
                  { label: 'Нийт P&L', value: formatCurrency(Math.abs(s.totalPnL)), color: s.totalPnL >= 0 ? 'text-green-400' : 'text-red-400', prefix: s.totalPnL >= 0 ? '+' : '-' },
                ].map(item => (
                  <div key={item.label} className="bg-[var(--bg-hover)] rounded-lg p-2 text-center">
                    <div className={`number-value text-sm font-semibold ${item.color || 'text-white'}`}>
                      {item.prefix || ''}{item.value}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{item.label}</div>
                  </div>
                ))}
              </div>

              {/* Pairs */}
              {s.pairs?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {s.pairs.map(p => (
                    <span key={p} className="text-[10px] bg-[var(--bg-hover)] text-[var(--text-muted)] px-1.5 py-0.5 rounded font-mono">
                      {p}
                    </span>
                  ))}
                </div>
              )}

              {/* Rules preview */}
              {s.rules && (
                <div className="mt-3 pt-3 border-t border-[var(--border)]">
                  <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide mb-1">Дүрэм</div>
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{s.rules}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
              <h2 className="font-display font-semibold text-white">
                {editing ? 'Стратеги засах' : 'Шинэ стратеги'}
              </h2>
              <button onClick={closeForm} className="p-1.5 hover:bg-[var(--bg-hover)] rounded">
                <X className="w-4 h-4 text-[var(--text-muted)]" />
              </button>
            </div>
            <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="p-5 space-y-4">
              <div>
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Стратегийн нэр *</label>
                <input {...register('name', { required: true })} placeholder="жишээ нь: Price Action Breakout" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[var(--text-secondary)] mb-1 block">Timeframe</label>
                  <select {...register('timeframe')} className={inputCls}>
                    <option value="">— Сонгох —</option>
                    {TIMEFRAMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Тайлбар</label>
                <textarea {...register('description')} rows={2} placeholder="Стратегийн товч тайлбар..." className={`${inputCls} resize-none`} />
              </div>
              <div>
                <label className="text-xs text-[var(--text-secondary)] mb-2 block">Валютын парууд</label>
                <div className="flex flex-wrap gap-1.5">
                  {FOREX_PAIRS.map(p => (
                    <button key={p} type="button" onClick={() => togglePair(p)}
                      className={`text-xs px-2.5 py-1 rounded-full font-mono transition-all ${
                        selectedPairs.includes(p)
                          ? 'bg-primary-600 text-white'
                          : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-white'
                      }`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Арилжааны дүрмүүд</label>
                <textarea {...register('rules')} rows={4}
                  placeholder="1. Үнэ дэмжлэгийн шугамаас эргэх ёстой&#10;2. RSI 30-аас дор байх ёстой&#10;3. ..."
                  className={`${inputCls} resize-none`} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeForm}
                  className="flex-1 border border-[var(--border)] text-[var(--text-secondary)] hover:text-white py-2.5 rounded-lg text-sm">
                  Болих
                </button>
                <button type="submit" disabled={saveMutation.isPending}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50">
                  {saveMutation.isPending ? 'Хадгалж байна...' : editing ? 'Хадгалах' : 'Үүсгэх'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
