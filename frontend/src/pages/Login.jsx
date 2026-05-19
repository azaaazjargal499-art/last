// smart-inventory/frontend/src/pages/Login.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Activity, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, TrendingUp } from 'lucide-react';
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
  toast.error('Google нэвтрэлтийн backend тохиргоо хийгдээгүй байна.');
};

// Animated Forex bars for chart visualization
const ForexChart = ({ isLoading }) => {
  const bars = [45, 62, 38, 71, 55, 68, 48, 74, 59];
  
  return (
    <div className="flex items-end justify-center gap-1.5 h-32">
      {bars.map((height, idx) => (
        <div
          key={idx}
          className={`w-1.5 rounded-t-sm transition-all duration-500 ${
            isLoading ? 'bg-gradient-to-t from-emerald-400 to-cyan-300 animate-pulse' : 'bg-gradient-to-t from-emerald-400 to-cyan-300'
          }`}
          style={{
            height: `${height}%`,
            animation: isLoading ? `barPulse 0.8s ease-in-out infinite` : `barPulse 2.4s ease-in-out infinite`,
            animationDelay: `${idx * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
};

export default function Login() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const onSubmit = async (data) => {
    try {
      setIsLoggingIn(true);
      const res = await authService.login(data);
      login(res.user, res.token);
      toast.success(`Тавтай морил, ${res.user.username}!`);
      await new Promise(resolve => setTimeout(resolve, 600));
      navigate('/dashboard');
    } catch (_) {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07111f] p-4 text-white">
      <div className="grid min-h-[calc(100vh-2rem)] overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/30 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden bg-[#08111f] px-10 py-9 lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_8%,rgba(52,211,153,0.16),transparent_34%),radial-gradient(circle_at_85%_70%,rgba(34,211,238,0.12),transparent_30%)]" />

          <div className="relative flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-400 text-slate-950">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <div className="font-display text-lg font-extrabold leading-6">Smart Inventory</div>
              <div className="text-sm font-medium leading-5 text-slate-400">Forex Trading Journal</div>
            </div>
          </div>

          <div className="relative max-w-[760px]">
            <div className="mb-5 inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 text-sm font-semibold text-slate-200">
              <TrendingUp className="h-4 w-4 text-emerald-300" />
              Trade smarter, review cleaner
            </div>
            <h1 className="font-display text-[52px] font-black leading-[1.08] tracking-normal xl:text-[62px]">
              Арилжаагаа цэгцтэй хяна.
            </h1>
            <p className="mt-5 max-w-[620px] text-base leading-7 text-slate-400">
              Calendar, analytics, AI review, risk management бүгд нэг premium workspace дотор.
            </p>
          </div>

          <div className="relative grid gap-4 xl:grid-cols-[1fr_320px]">
            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-black/10">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold leading-5 text-white">Equity motion</div>
                  <div className="text-xs font-medium leading-5 text-slate-400">Live preview</div>
                </div>
                <div className="rounded-full bg-emerald-300 px-3 py-1 text-xs font-black leading-4 text-emerald-950">+12.4%</div>
              </div>
              <div className="mb-4 animate-float-soft">
                <ForexChart isLoading={false} />
              </div>
              <svg viewBox="0 0 520 170" className="h-24 w-full">
                <defs>
                  <linearGradient id="loginLine" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="55%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#60a5fa" />
                  </linearGradient>
                  <linearGradient id="loginArea" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity="0.24" />
                    <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M10 140 C70 118 92 126 134 96 C184 58 219 102 260 78 C303 52 332 57 374 38 C426 14 461 44 510 18 L510 170 L10 170 Z" fill="url(#loginArea)" />
                <path d="M10 140 C70 118 92 126 134 96 C184 58 219 102 260 78 C303 52 332 57 374 38 C426 14 461 44 510 18" fill="none" stroke="url(#loginLine)" strokeWidth="6" strokeLinecap="round" className="animate-draw-line" />
              </svg>
            </div>

            <div className="grid gap-3">
              {[
                ['Win rate', '68%', 'bg-emerald-300 text-emerald-950'],
                ['Monthly P&L', '+$8.2K', 'bg-cyan-300 text-cyan-950'],
                ['Risk score', 'Low', 'bg-indigo-300 text-indigo-950'],
              ].map(([label, value, tone]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                  <div className="text-xs font-bold uppercase leading-4 tracking-wide text-slate-500">{label}</div>
                  <div className={`mt-2 inline-flex rounded-full px-3 py-1 font-mono text-sm font-black leading-5 ${tone}`}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <main className="flex items-center justify-center bg-slate-50 px-5 py-8 text-slate-950 sm:px-8 animate-auth-right">
          <div className="w-full max-w-[460px]">
            <div className="mb-6">
              <div className="mb-3 inline-flex h-8 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                Secure access
              </div>
              <h2 className="font-display text-[36px] font-black leading-[1.1] tracking-normal">Нэвтрэх</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Өөрийн арилжааны workspace руугаа нэвтрэнэ үү.</p>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-300/40 animate-auth-card">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Field label="Email хаяг" error={errors.email?.message}>
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    {...register('email', { required: 'Email оруулна уу' })}
                    type="email"
                    placeholder="trader@example.com"
                    className={inputClass}
                    disabled={isLoggingIn}
                  />
                </Field>

                <Field label="Нууц үг" error={errors.password?.message}>
                  <LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    {...register('password', { required: 'Нууц үг оруулна уу' })}
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={`${inputClass} pr-11`}
                    disabled={isLoggingIn}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    disabled={isLoggingIn}
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </Field>

                <button
                  type="submit"
                  disabled={isSubmitting || isLoggingIn}
                  className="group relative flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold leading-none text-white shadow-xl shadow-slate-300 transition hover:bg-emerald-500 hover:text-slate-950 disabled:opacity-50 overflow-hidden"
                >
                  {isLoggingIn ? (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-cyan-300 to-emerald-400 animate-pulse" />
                      <div className="relative flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full border-2 border-white border-t-slate-950 animate-spin" />
                        <span>Нэвтэрч байна...</span>
                      </div>
                    </>
                  ) : (
                    <>
                      {isSubmitting ? 'Нэвтэрч байна...' : 'Нэвтрэх'}
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-5 text-center text-sm leading-6 text-slate-500">
                Бүртгэл байхгүй юу?{' '}
                <Link to="/register" className="font-bold text-emerald-600 hover:text-emerald-700">Бүртгүүлэх</Link>
              </p>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-bold uppercase tracking-wide text-slate-400">эсвэл</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <button
                type="button"
                onClick={startGoogleSignIn}
                disabled={isLoggingIn}
                className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold leading-none text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
              >
                <GoogleIcon />
                Google аккаунтаар нэвтрэх
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold leading-none text-slate-700">{label}</label>
      <div className="relative">{children}</div>
      {error && <p className="mt-1.5 text-xs font-semibold leading-4 text-rose-500">{error}</p>}
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
