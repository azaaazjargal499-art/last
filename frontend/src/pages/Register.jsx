// smart-inventory/frontend/src/pages/Register.jsx
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Activity, ArrowRight, BadgeDollarSign, LockKeyhole, Mail, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '@/services/index';
import { useAuthStore } from '@/store/authStore';

const inputClass = 'h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pl-11 text-[15px] font-medium leading-none text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100';

const startGoogleSignIn = () => {
  const googleUrl = import.meta.env.VITE_GOOGLE_AUTH_URL;
  if (googleUrl) {
    window.location.href = googleUrl;
    return;
  }
  toast.error('Google бүртгэлийн backend тохиргоо хийгдээгүй байна.');
};

export default function Register() {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const res = await authService.register(data);
      login(res.user, res.token);
      toast.success('Бүртгэл амжилттай!');
      navigate('/dashboard');
    } catch (_) {}
  };

  return (
    <div className="min-h-screen bg-[#07111f] p-4">
      <div className="grid min-h-[calc(100vh-2rem)] overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/30 lg:grid-cols-[0.95fr_1.05fr]">
        <main className="flex items-center justify-center bg-slate-50 px-5 py-8 text-slate-950 sm:px-8 animate-auth-left">
          <div className="w-full max-w-[460px]">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-emerald-400 text-slate-950">
                <Activity className="h-6 w-6" />
              </div>
              <h1 className="font-display text-[36px] font-black leading-[1.1] tracking-normal">Бүртгүүлэх</h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">Шинэ trading journal үүсгээд арилжаагаа цэгцэлж эхлээрэй.</p>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-300/40 animate-auth-card">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Field label="Хэрэглэгчийн нэр" icon={<UserRound className="h-4 w-4" />}>
                  <input {...register('username', { required: true })} placeholder="trader123" className={inputClass} />
                </Field>
                <Field label="Email" icon={<Mail className="h-4 w-4" />}>
                  <input {...register('email', { required: true })} type="email" placeholder="email@example.com" className={inputClass} />
                </Field>
                <Field label="Нууц үг" icon={<LockKeyhole className="h-4 w-4" />}>
                  <input {...register('password', { required: true, minLength: 6 })} type="password" placeholder="••••••••" className={inputClass} />
                </Field>
                <Field label="Эхлэх баланс (USD)" icon={<BadgeDollarSign className="h-4 w-4" />}>
                  <input {...register('balance')} type="number" defaultValue={10000} className={inputClass} />
                </Field>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold leading-none text-white shadow-xl shadow-slate-300 transition hover:bg-emerald-500 hover:text-slate-950 disabled:opacity-50"
                >
                  {isSubmitting ? 'Бүртгэж байна...' : 'Бүртгүүлэх'}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </button>
              </form>

              <p className="mt-5 text-center text-sm leading-6 text-slate-500">
                Аль хэдийн бүртгэлтэй юу?{' '}
                <Link to="/login" className="font-bold text-emerald-600 hover:text-emerald-700">Нэвтрэх</Link>
              </p>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-bold uppercase tracking-wide text-slate-400">эсвэл</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <button
                type="button"
                onClick={startGoogleSignIn}
                className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold leading-none text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                <GoogleIcon />
                Google аккаунтаар бүртгүүлэх
              </button>
            </div>
          </div>
        </main>

        <section className="relative hidden overflow-hidden bg-[#08111f] px-10 py-9 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(52,211,153,0.16),transparent_34%),radial-gradient(circle_at_88%_76%,rgba(99,102,241,0.14),transparent_30%)]" />

          <div className="relative flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-400 text-slate-950">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <div className="font-display text-lg font-extrabold leading-6">Smart Inventory</div>
              <div className="text-sm font-medium leading-5 text-slate-400">Forex Trading Journal</div>
            </div>
          </div>

          <div className="relative max-w-[680px]">
            <h2 className="font-display text-[52px] font-black leading-[1.08] tracking-normal xl:text-[60px]">Эхний өдрөөсөө зөв хэмж.</h2>
            <p className="mt-5 max-w-[600px] text-base leading-7 text-slate-400">
              Strategy, P&L, win rate, эрсдэлийн хэмжээгээ нэг дор хөтөлж, дараагийн шийдвэрээ илүү тод гарга.
            </p>
          </div>

          <div className="relative grid grid-cols-3 gap-3">
            {[44, 78, 56, 92, 64, 83, 51, 72, 88].map((height, index) => (
              <div key={height + index} className="flex h-24 items-end rounded-2xl border border-white/10 bg-white/[0.05] p-3">
                <div
                  className="w-full rounded-xl bg-gradient-to-t from-emerald-400 to-cyan-300 animate-bar-pulse"
                  style={{ height: `${height}%`, animationDelay: `${index * 90}ms` }}
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({ label, icon, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold leading-none text-slate-700">{label}</label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
        {children}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.23c0-.74-.07-1.45-.19-2.14H12v4.05h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.44z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.24-2.51c-.9.6-2.04.95-3.38.95-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0 0 12 22z" />
      <path fill="#FBBC05" d="M6.41 13.89a6 6 0 0 1 0-3.78V7.52H3.07a10 10 0 0 0 0 8.96l3.34-2.59z" />
      <path fill="#EA4335" d="M12 5.99c1.47 0 2.78.5 3.82 1.5l2.87-2.87A9.62 9.62 0 0 0 12 2 10 10 0 0 0 3.07 7.52l3.34 2.59C7.2 7.75 9.4 5.99 12 5.99z" />
    </svg>
  );
}
