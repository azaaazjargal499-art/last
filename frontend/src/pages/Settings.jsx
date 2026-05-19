// smart-inventory/frontend/src/pages/Settings.jsx
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Settings as SettingsIcon, User, Shield, DollarSign } from 'lucide-react';
import { authService } from '@/services/index';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const inputCls = "w-full bg-[var(--bg-base)] border border-[var(--border)] text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary-500";

export default function Settings() {
  const { user, updateUser } = useAuthStore();
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
      toast.success('Тохиргоо хадгалагдлаа!');
    },
  });

  return (
    <div className="space-y-6 animate-slide-up max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Тохиргоо</h1>
        <p className="text-[var(--text-muted)] text-sm mt-1">Дансны мэдээлэл болон эрсдэлийн тохиргоо</p>
      </div>

      {/* Profile */}
      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <User className="w-4 h-4 text-primary-400" />
          <h3 className="font-display font-semibold text-white">Профайл</h3>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Хэрэглэгчийн нэр', value: user?.username },
            { label: 'Email хаяг',        value: user?.email },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-[var(--border)]">
              <span className="text-sm text-[var(--text-secondary)]">{item.label}</span>
              <span className="text-sm text-white font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trading Settings */}
      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <Shield className="w-4 h-4 text-primary-400" />
          <h3 className="font-display font-semibold text-white">Арилжааны тохиргоо</h3>
        </div>
        <form onSubmit={handleSubmit(d => updateMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="text-xs text-[var(--text-secondary)] mb-1 block">
              Эхлэх баланс (USD)
              <span className="ml-2 text-[var(--text-muted)]">— Дансны анхны хэмжээ</span>
            </label>
            <input {...register('balance')} type="number" step="0.01" className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-[var(--text-secondary)] mb-1 block">
              Нэг арилжааны эрсдэл (%)
              <span className="ml-2 text-[var(--text-muted)]">— Зөвлөмж: 1-2%</span>
            </label>
            <input {...register('riskPerTrade')} type="number" step="0.1" min="0.1" max="20" className={inputCls} />
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Одоогийн тохиргоо: нэг арилжаанд <span className="text-warn font-mono">{user?.riskPerTrade}%</span> эрсдэл
              = <span className="text-warn font-mono">${((user?.balance || 0) * (user?.riskPerTrade || 0) / 100).toFixed(2)}</span>
            </p>
          </div>
          <button type="submit" disabled={updateMutation.isPending}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            {updateMutation.isPending ? 'Хадгалж байна...' : 'Хадгалах'}
          </button>
        </form>
      </div>

      {/* Risk Rules */}
      <div className="card border-amber-500/20 bg-amber-500/5">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="w-4 h-4 text-warn" />
          <h3 className="font-display font-semibold text-white">Эрсдэлийн дүрмүүд</h3>
        </div>
        <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
          {[
            'Нэг арилжаанд хөрөнгийнхөө 1-2%-иас хэтрэхгүй байх',
            'Нийт нээлттэй позицуудын эрсдэл 5-10%-иас хэтрэхгүй байх',
            'Ашиг/алдагдлын харьцаа (R:R) 1:2-оос дээш байх',
            'Өдөрт 3-аас илүүгүй арилжаа хийх',
            'Stop Loss заавал тавих — ямар ч нөхцөлд',
          ].map((rule, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-primary-400 font-mono text-xs mt-0.5">{String(i + 1).padStart(2, '0')}.</span>
              {rule}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
