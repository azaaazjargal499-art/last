// smart-inventory/frontend/src/components/common/Layout.jsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  Brain,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Хянах самбар' },
  { to: '/dashboard/trades', icon: TrendingUp, label: 'Арилжаа' },
  { to: '/dashboard/analytics', icon: BarChart3, label: 'Аналитик' },
  { to: '/dashboard/ai', icon: Brain, label: 'AI туслагч' },
  { to: '/dashboard/risk', icon: ShieldAlert, label: 'Эрсдэл' },
  { to: '/dashboard/alerts', icon: Bell, label: 'Мэдэгдэл' },
  { to: '/dashboard/strategies', icon: BookOpen, label: 'Стратеги' },
  { to: '/dashboard/settings', icon: Settings, label: 'Тохиргоо' },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Амжилттай гарлаа');
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#07111f]">
      <aside className="hidden w-72 flex-shrink-0 flex-col border-r border-white/10 bg-[#07111f] lg:flex">
        <div className="p-5">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-950/30">
              <Activity className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="truncate font-display text-sm font-bold text-white">Smart Inventory</div>
              <div className="mt-0.5 text-xs text-slate-400">Forex Journal</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 pb-4">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-400/12 text-emerald-200 ring-1 ring-emerald-300/20'
                    : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
                }`
              }
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/[0.05] p-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-emerald-400/15 text-sm font-bold text-emerald-300">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white">{user?.username || 'Trader'}</div>
              <div className="truncate text-xs text-slate-400">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
          >
            <LogOut className="h-4 w-4" />
            Гарах
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-[#07111f] bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.13),transparent_30%),radial-gradient(circle_at_85%_10%,_rgba(56,189,248,0.10),transparent_28%),linear-gradient(180deg,#07111f_0%,#0b1220_100%)]">
        <div className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
