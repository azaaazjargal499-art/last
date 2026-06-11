import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRound,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '@/services/index';
import { useAuthStore } from '@/store/authStore';

const inputClass = 'h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 pl-12 text-[15px] font-bold leading-none text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100';

const startGoogleSignIn = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/_/smart-inventory-api/api';
  const frontendUrl = encodeURIComponent(window.location.origin);
  window.location.href = `${apiUrl}/auth/google?frontend_url=${frontendUrl}`;
};

function Field({ label, error, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-black leading-none text-slate-700">{label}</label>
      <div className="relative">{children}</div>
      {error && <p className="mt-1.5 text-xs font-bold leading-4 text-rose-500">{error}</p>}
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

function BrandLogo({ dark = false }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-12 w-12 flex-shrink-0 place-items-center overflow-hidden rounded-2xl border border-emerald-300/30 bg-black shadow-lg shadow-emerald-950/20">
        <img src="/disciplinex-logo.png" alt="Disciplinex logo" className="h-full w-full object-cover" />
      </div>
      <div>
        <div className={`font-display text-xl font-black leading-5 ${dark ? 'text-white' : 'text-slate-950'}`}>Disciplinex</div>
        <div className={`text-sm font-bold leading-5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Trade Journal</div>
      </div>
    </div>
  );
}

function BrandPreview() {
  const bars = [46, 62, 40, 76, 58, 82, 54, 88, 70];

  return (
    <section className="relative overflow-hidden rounded-[34px] bg-slate-950 p-8 text-white shadow-2xl shadow-slate-300/40 lg:p-10">
      <div className="flex items-center justify-between gap-6">
        <BrandLogo dark />
        <div className="hidden rounded-full bg-emerald-400 px-4 py-2 text-sm font-black text-slate-950 sm:block">Secure trader workspace</div>
      </div>

      <div className="mt-12 max-w-[760px]">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-black text-emerald-200">
          <TrendingUp className="h-4 w-4" />
          Trade smarter, review cleaner
        </div>
        <h1 className="font-display text-5xl font-black leading-[1.02] tracking-normal xl:text-7xl">
          Арилжаагаа датагаар хяна.
        </h1>
        <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-slate-300">
          Trade Journal нь MT5 sync, journal, analytics, risk management, strategy tracker, AI review-ийг нэг workspace дотор нэгтгэнэ.
        </p>
      </div>

      <div className="mt-10 grid gap-5 xl:grid-cols-[1fr_320px]">
        <div className="rounded-[30px] border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-black/10">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold leading-5 text-white">Performance preview</div>
              <div className="text-xs font-medium leading-5 text-slate-400">Journal + AI review</div>
            </div>
            <div className="rounded-full bg-emerald-300 px-3 py-1 text-xs font-black leading-4 text-emerald-950">+12.4%</div>
          </div>
          <div className="flex h-32 items-end justify-center gap-2">
            {bars.map((height, index) => (
              <div
                key={index}
                className="w-2 rounded-t-full bg-gradient-to-t from-emerald-400 to-cyan-300"
                style={{
                  height: `${height}%`,
                  animation: 'barPulse 2.4s ease-in-out infinite',
                  animationDelay: `${index * 0.08}s`,
                }}
              />
            ))}
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              ['Win rate', '68%'],
              ['Monthly P&L', '+$8.2K'],
              ['Risk score', 'Low'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-white/[0.07] p-4">
                <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</div>
                <div className="mt-2 text-xl font-black text-white">{value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          {[
            [CalendarDays, 'Auto journal', 'Trade бүр хадгалагдана'],
            [BarChart3, 'Analytics', 'Win rate, P&L, risk'],
            [Sparkles, 'AI review', 'Алдаагаа хурдан ол'],
          ].map(([Icon, title, text]) => (
            <div key={title} className="rounded-[24px] border border-white/10 bg-white/[0.06] p-5">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-400 text-slate-950">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-black text-white">{title}</div>
                  <div className="text-sm font-semibold text-slate-400">{text}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Auth() {
  const [mode, setMode] = useState('login');
  const [showPass, setShowPass] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleToken = params.get('token');
    const googleError = params.get('google_error');

    if (googleError) {
      toast.error(decodeURIComponent(googleError));
      window.history.replaceState({}, '', '/auth');
      return;
    }

    if (!googleToken) return;

    const completeGoogleSignIn = async () => {
      try {
        setIsLoggingIn(true);
        localStorage.setItem('si_token', googleToken);
        const user = await authService.getMe();
        login(user, googleToken);
        toast.success(`Тавтай морил, ${user.username}!`);
        navigate('/dashboard', { replace: true });
      } catch (_) {
        localStorage.removeItem('si_token');
        setIsLoggingIn(false);
        window.history.replaceState({}, '', '/auth');
      }
    };

    completeGoogleSignIn();
  }, [login, navigate]);

  const loginForm = useForm();
  const loginSubmit = async (data) => {
    try {
      setIsLoggingIn(true);
      const res = await authService.login(data);
      login(res.user, res.token);
      toast.success(`Тавтай морил, ${res.user.username}!`);
      navigate('/dashboard');
    } catch (_) {
      setIsLoggingIn(false);
    }
  };

  const registerForm = useForm();
  const registerSubmit = async (data) => {
    try {
      setIsLoggingIn(true);
      const res = await authService.register(data);
      login(res.user, res.token);
      toast.success('Бүртгэл амжилттай!');
      navigate('/dashboard');
    } catch (_) {
      setIsLoggingIn(false);
    }
  };

  const resetForm = useForm();
  const requestResetCode = async () => {
    const valid = await resetForm.trigger(['email', 'username']);
    if (!valid) return;

    const { email, username } = resetForm.getValues();
    try {
      setIsSendingCode(true);
      await authService.requestResetCode({ email, username });
      toast.success('Код email рүү илгээгдлээ.');
    } catch (_) {
    } finally {
      setIsSendingCode(false);
    }
  };

  const resetSubmit = async (data) => {
    if (data.password !== data.confirmPassword) {
      resetForm.setError('confirmPassword', { message: 'Нууц үг таарахгүй байна' });
      return;
    }

    try {
      setIsLoggingIn(true);
      await authService.resetPassword({
        email: data.email,
        username: data.username,
        code: data.code,
        password: data.password,
      });
      toast.success('Нууц үг шинэчлэгдлээ. Одоо нэвтэрнэ үү.');
      resetForm.reset();
      setMode('login');
    } catch (_) {
    } finally {
      setIsLoggingIn(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    loginForm.reset();
    registerForm.reset();
    resetForm.reset();
  };

  const isLogin = mode === 'login';
  const isRegister = mode === 'register';
  const isReset = mode === 'reset';

  return (
    <div className="min-h-screen bg-[linear-gradient(120deg,#ffffff_0%,#f4f8ff_55%,#ecfdf5_100%)] p-4 text-slate-950 md:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1840px] gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="hidden lg:block">
          <BrandPreview />
        </div>

        <main className="flex items-center justify-center rounded-[34px] border border-slate-200 bg-white/85 px-5 py-10 shadow-2xl shadow-slate-200/70 backdrop-blur-xl">
          <div className="w-full max-w-[520px]">
            <div className="mb-8">
              <div className="mb-6 lg:hidden">
                <BrandLogo />
              </div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">
                <ShieldCheck className="h-4 w-4" />
                Secure access
              </div>
              <h2 className="font-display text-4xl font-black leading-tight text-slate-950 md:text-5xl">
                {isLogin ? 'Нэвтрэх' : isReset ? 'Нууц үг сэргээх' : 'Бүртгүүлэх'}
              </h2>
              <p className="mt-3 text-base font-medium leading-7 text-slate-500">
                {isLogin
                  ? 'Өөрийн Trade Journal workspace руугаа нэвтэрч journal, analytics, AI review-ээ үргэлжлүүл.'
                  : isReset
                    ? 'Email болон хэрэглэгчийн нэрээ баталгаажуулаад шинэ нууц үг тохируулна.'
                  : 'Шинэ trading journal үүсгээд арилжаагаа эхний өдрөөсөө датагаар хяна.'}
              </p>
            </div>

            <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-200/80 sm:p-8">
              {isLogin ? (
                <form onSubmit={loginForm.handleSubmit(loginSubmit)} className="space-y-5">
                  <Field label="Email хаяг" error={loginForm.formState.errors.email?.message}>
                    <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      {...loginForm.register('email', { required: 'Email оруулна уу' })}
                      type="email"
                      placeholder="trader@example.com"
                      className={inputClass}
                      disabled={isLoggingIn}
                    />
                  </Field>

                  <Field label="Нууц үг" error={loginForm.formState.errors.password?.message}>
                    <LockKeyhole className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      {...loginForm.register('password', { required: 'Нууц үг оруулна уу' })}
                      type={showPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      className={`${inputClass} pr-12`}
                      disabled={isLoggingIn}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-800"
                      disabled={isLoggingIn}
                      aria-label={showPass ? 'Нууц үг нуух' : 'Нууц үг харах'}
                    >
                      {showPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </Field>

                  <button
                    type="submit"
                    disabled={loginForm.formState.isSubmitting || isLoggingIn}
                    className="group flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-base font-black text-white shadow-2xl shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoggingIn || loginForm.formState.isSubmitting ? 'Нэвтэрч байна...' : 'Нэвтрэх'}
                    <ArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" />
                  </button>
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('reset');
                        loginForm.reset();
                        resetForm.reset();
                      }}
                      className="text-sm font-black text-blue-600 transition hover:text-slate-950"
                    >
                      Нууц үгээ мартсан уу?
                    </button>
                  </div>
                </form>
              ) : isRegister ? (
                <form onSubmit={registerForm.handleSubmit(registerSubmit)} className="space-y-5">
                  <Field label="Хэрэглэгчийн нэр" error={registerForm.formState.errors.username?.message}>
                    <UserRound className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      {...registerForm.register('username', { required: 'Хэрэглэгчийн нэр оруулна уу' })}
                      placeholder="trader123"
                      className={inputClass}
                      disabled={isLoggingIn}
                    />
                  </Field>

                  <Field label="Email хаяг" error={registerForm.formState.errors.email?.message}>
                    <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      {...registerForm.register('email', { required: 'Email оруулна уу' })}
                      type="email"
                      placeholder="email@example.com"
                      className={inputClass}
                      disabled={isLoggingIn}
                    />
                  </Field>

                  <Field label="Нууц үг" error={registerForm.formState.errors.password?.message}>
                    <LockKeyhole className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      {...registerForm.register('password', {
                        required: 'Нууц үг оруулна уу',
                        minLength: { value: 6, message: 'Дор хаяж 6 тэмдэгт' },
                      })}
                      type="password"
                      placeholder="••••••••"
                      className={inputClass}
                      disabled={isLoggingIn}
                    />
                  </Field>

                  <button
                    type="submit"
                    disabled={registerForm.formState.isSubmitting || isLoggingIn}
                    className="group flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-base font-black text-white shadow-2xl shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoggingIn || registerForm.formState.isSubmitting ? 'Бүртгэж байна...' : 'Бүртгүүлэх'}
                    <ArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" />
                  </button>
                </form>
              ) : (
                <form onSubmit={resetForm.handleSubmit(resetSubmit)} className="space-y-5">
                  <Field label="Email хаяг" error={resetForm.formState.errors.email?.message}>
                    <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      {...resetForm.register('email', { required: 'Email оруулна уу' })}
                      type="email"
                      placeholder="email@example.com"
                      className={inputClass}
                      disabled={isLoggingIn}
                    />
                  </Field>

                  <Field label="Хэрэглэгчийн нэр" error={resetForm.formState.errors.username?.message}>
                    <UserRound className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      {...resetForm.register('username', { required: 'Хэрэглэгчийн нэр оруулна уу' })}
                      placeholder="trader123"
                      className={inputClass}
                      disabled={isLoggingIn}
                    />
                  </Field>

                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <Field label="Email code" error={resetForm.formState.errors.code?.message}>
                      <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <input
                        {...resetForm.register('code', {
                          required: 'Email-р ирсэн код оруулна уу',
                          minLength: { value: 6, message: '6 оронтой код' },
                        })}
                        inputMode="numeric"
                        placeholder="123456"
                        className={inputClass}
                        disabled={isLoggingIn}
                      />
                    </Field>
                    <button
                      type="button"
                      onClick={requestResetCode}
                      disabled={isSendingCode || isLoggingIn}
                      className="mt-7 h-14 rounded-2xl border border-blue-200 bg-blue-50 px-5 text-sm font-black text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSendingCode ? 'Илгээж байна...' : 'Код илгээх'}
                    </button>
                  </div>

                  <Field label="Шинэ нууц үг" error={resetForm.formState.errors.password?.message}>
                    <LockKeyhole className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      {...resetForm.register('password', {
                        required: 'Шинэ нууц үг оруулна уу',
                        minLength: { value: 6, message: 'Дор хаяж 6 тэмдэгт' },
                      })}
                      type="password"
                      placeholder="••••••••"
                      className={inputClass}
                      disabled={isLoggingIn}
                    />
                  </Field>

                  <Field label="Шинэ нууц үг давтах" error={resetForm.formState.errors.confirmPassword?.message}>
                    <LockKeyhole className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      {...resetForm.register('confirmPassword', { required: 'Нууц үгээ давтана уу' })}
                      type="password"
                      placeholder="••••••••"
                      className={inputClass}
                      disabled={isLoggingIn}
                    />
                  </Field>

                  <button
                    type="submit"
                    disabled={resetForm.formState.isSubmitting || isLoggingIn}
                    className="group flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-base font-black text-white shadow-2xl shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoggingIn || resetForm.formState.isSubmitting ? 'Шинэчилж байна...' : 'Нууц үг шинэчлэх'}
                    <ArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" />
                  </button>
                </form>
              )}

              <p className="mt-6 text-center text-sm font-semibold leading-6 text-slate-500">
                {isLogin ? 'Бүртгэл байхгүй юу?' : isReset ? 'Нууц үгээ санасан уу?' : 'Аль хэдийн бүртгэлтэй юу?'}{' '}
                <button
                  onClick={isReset ? () => setMode('login') : toggleMode}
                  className="font-black text-blue-600 transition hover:text-slate-950"
                >
                  {isLogin ? 'Бүртгүүлэх' : 'Нэвтрэх'}
                </button>
              </p>

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-black uppercase tracking-wide text-slate-400">эсвэл</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <button
                type="button"
                onClick={startGoogleSignIn}
                disabled={isLoggingIn}
                className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-base font-black leading-none text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
              >
                <GoogleIcon />
                Google аккаунтаар {isLogin ? 'нэвтрэх' : 'бүртгүүлэх'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
