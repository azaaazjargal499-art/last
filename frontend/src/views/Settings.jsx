// smart-inventory/frontend/src/pages/Settings.jsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Settings as SettingsIcon, User, Shield, DollarSign, Check } from 'lucide-react';
import { authService } from '@/services/index';
import { useAuthStore } from '@/store/authStore';
import {
  DEFAULT_RISK_REWARD_PRESETS,
  DEFAULT_SELECTED_PAIRS,
  FOREX_PAIRS,
  RISK_REWARD_PRESETS,
  getUserPairs,
  getUserRiskRewardPresets,
} from '@/utils/formatters';
import toast from 'react-hot-toast';

const inputCls = 'w-full bg-[var(--bg-base)] border border-[var(--border)] text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary-500';

export default function Settings() {
  const { user, updateUser } = useAuthStore();
  const [selectedPairs, setSelectedPairs] = useState(() => getUserPairs(user));
  const [riskRewardPresets, setRiskRewardPresets] = useState(() => getUserRiskRewardPresets(user));

  const { register, handleSubmit } = useForm({
    defaultValues: {
      balance: user?.balance || 10000,
      riskPerTrade: user?.riskPerTrade || 2,
    },
  });

  const updateMutation = useMutation({
    mutationFn: authService.update,
    onSuccess: (data) => {
      updateUser(data.user);
      setSelectedPairs(getUserPairs(data.user));
      setRiskRewardPresets(getUserRiskRewardPresets(data.user));
      toast.success('Тохиргоо хадгалагдлаа!');
    },
  });

  const togglePair = (pair) => {
    setSelectedPairs((current) => {
      if (current.includes(pair)) {
        const next = current.filter((item) => item !== pair);
        return next.length ? next : current;
      }

      return [...current, pair];
    });
  };

  const toggleRiskRewardPreset = (preset) => {
    setRiskRewardPresets((current) => {
      if (current.includes(preset)) {
        const next = current.filter((item) => item !== preset);
        return next.length ? next : current;
      }

      return [...current, preset].sort((a, b) => a - b);
    });
  };

  const submit = (values) => {
    updateMutation.mutate({
      ...values,
      selectedPairs: selectedPairs.length ? selectedPairs : DEFAULT_SELECTED_PAIRS,
      riskRewardPresets: riskRewardPresets.length ? riskRewardPresets : DEFAULT_RISK_REWARD_PRESETS,
    });
  };

  return (
    <div className="space-y-6 animate-slide-up max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Тохиргоо</h1>
        <p className="text-[var(--text-muted)] text-sm mt-1">Данс, эрсдэл болон арилжаалдаг хослолуудаа тохируулна.</p>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <User className="w-4 h-4 text-primary-400" />
          <h3 className="font-display font-semibold text-white">Профайл</h3>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Хэрэглэгчийн нэр', value: user?.username },
            { label: 'Email хаяг', value: user?.email },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-[var(--border)]">
              <span className="text-sm text-[var(--text-secondary)]">{item.label}</span>
              <span className="text-sm text-white font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <Shield className="w-4 h-4 text-primary-400" />
          <h3 className="font-display font-semibold text-white">Арилжааны тохиргоо</h3>
        </div>

        <form onSubmit={handleSubmit(submit)} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs text-[var(--text-secondary)] mb-1 block">
                Эхлэх баланс (USD)
                <span className="ml-2 text-[var(--text-muted)]">- Дансны анхны хэмжээ</span>
              </label>
              <input {...register('balance')} type="number" step="0.01" className={inputCls} />
            </div>

            <div>
              <label className="text-xs text-[var(--text-secondary)] mb-1 block">
                Нэг арилжааны эрсдэл (%)
                <span className="ml-2 text-[var(--text-muted)]">- Зөвлөмж: 1-2%</span>
              </label>
              <input {...register('riskPerTrade')} type="number" step="0.1" min="0.1" max="20" className={inputCls} />
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Одоогийн тохиргоо: <span className="text-warn font-mono">{user?.riskPerTrade}%</span>
                {' '}= <span className="text-warn font-mono">${((user?.balance || 0) * (user?.riskPerTrade || 0) / 100).toFixed(2)}</span>
              </p>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <label className="text-sm font-semibold text-white">Арилжаалдаг хослолууд</label>
                <p className="text-xs text-[var(--text-muted)] mt-1">Сонгосон хослолууд Trade болон Risk хуудсан дээр харагдана.</p>
              </div>
              <div className="text-xs font-semibold text-primary-300">{selectedPairs.length}/{FOREX_PAIRS.length}</div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {FOREX_PAIRS.map((pair) => {
                const checked = selectedPairs.includes(pair);
                return (
                  <button
                    key={pair}
                    type="button"
                    onClick={() => togglePair(pair)}
                    className={`flex h-11 items-center gap-3 rounded-lg border px-4 text-left text-sm font-bold transition ${
                      checked
                        ? 'border-green-400 bg-green-100 text-green-900 shadow-[0_0_0_1px_rgba(74,222,128,0.35)]'
                        : 'border-white/15 bg-white/[0.035] text-white hover:border-white/30 hover:bg-white/[0.06]'
                    }`}
                  >
                    <span className={`grid h-5 w-5 shrink-0 place-items-center rounded border text-[13px] ${
                      checked ? 'border-green-500 bg-green-500 text-green-950' : 'border-white/30 bg-white/[0.03] text-transparent'
                    }`}>
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                    <span className="font-mono">{pair}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <label className="text-sm font-semibold text-white">Risk / Reward preset</label>
                <p className="text-xs text-[var(--text-muted)] mt-1">Risk хуудсан дээр R:R сонгоход ашиглана.</p>
              </div>
              <div className="text-xs font-semibold text-primary-300">{riskRewardPresets.length}/{RISK_REWARD_PRESETS.length}</div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {RISK_REWARD_PRESETS.map((preset) => {
                const checked = riskRewardPresets.includes(preset);
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => toggleRiskRewardPreset(preset)}
                    className={`flex h-11 items-center gap-3 rounded-lg border px-4 text-left text-sm font-bold transition ${
                      checked
                        ? 'border-green-400 bg-green-100 text-green-900 shadow-[0_0_0_1px_rgba(74,222,128,0.35)]'
                        : 'border-white/15 bg-white/[0.035] text-white hover:border-white/30 hover:bg-white/[0.06]'
                    }`}
                  >
                    <span className={`grid h-5 w-5 shrink-0 place-items-center rounded border text-[13px] ${
                      checked ? 'border-green-500 bg-green-500 text-green-950' : 'border-white/30 bg-white/[0.03] text-transparent'
                    }`}>
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                    <span className="font-mono">1:{preset}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="rounded-lg border border-white/15 bg-white/[0.04] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/[0.08] disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Хадгалж байна...' : 'Тохиргоог хадгалах'}
          </button>
        </form>
      </div>

      <div className="card border-amber-500/20 bg-amber-500/5">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="w-4 h-4 text-warn" />
          <h3 className="font-display font-semibold text-white">Эрсдэлийн дүрмүүд</h3>
        </div>
        <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
          {[
            'Нэг арилжаанд хөрөнгийнхөө 1-2%-иас хэтрүүлэхгүй байх',
            'Нийт нээлттэй позицуудын эрсдэл 5-10%-иас хэтрүүлэхгүй байх',
            'Ашиг/алдагдлын харьцаа (R:R) 1:2-оос дээш байх',
            'Өдөрт 3-аас илүүгүй арилжаа хийх',
            'Stop Loss заавал тавих',
          ].map((rule, index) => (
            <li key={rule} className="flex items-start gap-2">
              <span className="text-primary-400 font-mono text-xs mt-0.5">{String(index + 1).padStart(2, '0')}.</span>
              {rule}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
