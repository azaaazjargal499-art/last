import { useNavigate } from 'react-router-dom';
import { Activity, TrendingUp, BarChart3, Brain, Shield, Zap, ArrowRight } from 'lucide-react';

// Animated Forex bars for hero section
const HeroChart = () => {
  const bars = [35, 52, 28, 61, 45, 58, 38, 64, 49];
  
  return (
    <div className="flex items-end justify-center gap-2 h-48 mb-8">
      {bars.map((height, idx) => (
        <div
          key={idx}
          className="w-2 rounded-t-lg bg-gradient-to-t from-emerald-400 via-cyan-300 to-emerald-400"
          style={{
            height: `${height}%`,
            animation: `barPulse 2.4s ease-in-out infinite`,
            animationDelay: `${idx * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
};

// Feature card with animation
const FeatureCard = ({ icon: Icon, title, description, delay }) => (
  <div
    className="group relative rounded-2xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-lg hover:border-emerald-400/50 transition-all duration-300 hover:bg-white/[0.08]"
    style={{
      animation: `slideUp 0.5s ease-out ${delay}s both`,
    }}
  >
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-300 text-slate-950 group-hover:shadow-lg group-hover:shadow-emerald-400/50 transition-all duration-300">
      <Icon className="h-6 w-6" />
    </div>
    <h3 className="mb-2 text-lg font-bold text-white">{title}</h3>
    <p className="text-sm text-slate-400">{description}</p>
  </div>
);

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#07111f] via-[#0a1628] to-[#05090f] text-white overflow-hidden">
      {/* Animated background gradients */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-cyan-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 md:px-8">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-400 text-slate-950">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-base font-extrabold leading-4">Smart Inventory</div>
            <div className="text-xs font-medium text-slate-400">Forex Trading Journal</div>
          </div>
        </div>
        <button
          onClick={() => navigate('/auth')}
          className="group flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-2.5 font-semibold text-slate-950 transition hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-400/50"
        >
          Эхлүүлэх
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-16 md:py-24 lg:py-32 md:px-8">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          {/* Left: Content */}
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-4">
              <div className="inline-flex h-9 items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 text-sm font-semibold text-emerald-300">
                <TrendingUp className="h-4 w-4" />
                Forex Trading нэмэлт хөлөгч
              </div>
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-black leading-tight">
                Арилжаагаа <span className="bg-gradient-to-r from-emerald-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">цэгцтэй</span> хяна.
              </h1>
              <p className="max-w-2xl text-base md:text-lg text-slate-400">
                Smart Inventory нь таны Forex арилжаагийн компаньон. Анализ, AI шүүлэлт, эрсдлийн удирдамж—бүгдийг нэг дээр.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <button
                onClick={() => navigate('/auth')}
                className="group relative flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-8 font-bold text-slate-950 transition hover:bg-emerald-400 hover:shadow-xl hover:shadow-emerald-400/50 overflow-hidden"
              >
                <span className="relative z-10">Үнэгүй эхлүүлэх</span>
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => {
                  document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex h-12 items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-white/5 px-8 font-bold text-emerald-300 transition hover:border-emerald-400/60 hover:bg-white/10"
              >
                Дэлгэрэнгүй
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
              {[
                { value: '10K+', label: 'Хэрэглэгчид' },
                { value: '99.9%', label: 'Uptime' },
                { value: '24/7', label: 'Support' },
              ].map(({ value, label }) => (
                <div key={label} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-2xl font-black text-emerald-400">{value}</div>
                  <div className="text-xs text-slate-400">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Chart Animation */}
          <div className="relative animate-float-soft hidden lg:flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 via-cyan-300/20 to-transparent rounded-3xl blur-3xl" />
            <div className="relative rounded-3xl border border-emerald-400/30 bg-gradient-to-b from-white/5 to-white/[0.02] p-8 backdrop-blur-lg">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white">Portfolio Value</div>
                  <div className="text-xs text-slate-400">Real-time</div>
                </div>
                <div className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-black text-emerald-300">+18.5%</div>
              </div>
              <HeroChart />
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Win Rate', value: '72%', color: 'text-emerald-400' },
                  { label: 'ROI', value: '+34%', color: 'text-cyan-300' },
                  { label: 'Risk', value: 'Low', color: 'text-blue-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-lg bg-white/5 p-3 border border-white/10">
                    <div className="text-xs text-slate-500">{label}</div>
                    <div className={`mt-1 text-lg font-black ${color}`}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 mx-auto max-w-6xl px-6 py-16 md:py-24 md:px-8">
        <div className="mb-12 text-center">
          <h2 className="font-display text-4xl md:text-5xl font-black mb-4">Чадварууд</h2>
          <p className="max-w-2xl mx-auto text-slate-400">Бүх зүйлийн өөрчлөлт хийхэд шаардагдах хэрэгслүүд</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: BarChart3,
              title: 'Realtime Analytics',
              description: 'Таны арилжааг реал-тайм дүн шинжилгээлэх',
              delay: 0,
            },
            {
              icon: Brain,
              title: 'AI Review',
              description: 'Сургалтын үндсэн дээр арилжааны шүүлэлт',
              delay: 0.1,
            },
            {
              icon: Shield,
              title: 'Risk Management',
              description: 'Эрсдлийг удирдаад байх автомат системүүд',
              delay: 0.2,
            },
            {
              icon: Zap,
              title: 'High Performance',
              description: 'Үзүүлэлтээ хүргүүлээ бүхэлдээ',
              delay: 0.3,
            },
            {
              icon: TrendingUp,
              title: 'Trade Journal',
              description: 'Бүх арилжаагаа дэлгэрэнгүй бүртгэлэх',
              delay: 0.4,
            },
            {
              icon: Activity,
              title: 'Health Check',
              description: 'Таны trading health-ыг үндэслэх',
              delay: 0.5,
            },
          ].map((feature, idx) => (
            <FeatureCard key={idx} {...feature} />
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 py-16 md:py-24 md:px-8">
        <div className="rounded-3xl border border-emerald-400/30 bg-gradient-to-r from-emerald-400/10 via-cyan-300/10 to-blue-400/10 p-8 md:p-12 backdrop-blur-lg text-center">
          <h2 className="font-display text-3xl md:text-4xl font-black mb-4">Өнөө эхлүүлэх</h2>
          <p className="mb-6 max-w-2xl mx-auto text-slate-300">Хэдэн минутын дотор бүртгүүлээд нэвтэрч эхэлцгээе.</p>
          <button
            onClick={() => navigate('/auth')}
            className="group inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-8 py-3 font-bold text-slate-950 transition hover:bg-emerald-400 hover:shadow-xl hover:shadow-emerald-400/50"
          >
            Үнэгүй эхлүүлэх
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-black/20 px-6 py-8 md:px-8 text-center text-sm text-slate-500">
        <p>© 2026 Smart Inventory. Бүх эрхээ хуулиар хамгаалав.</p>
      </footer>
    </div>
  );
}
