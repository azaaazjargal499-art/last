// smart-inventory/frontend/src/components/common/Layout.jsx
import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  Brain,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  X,
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

const adminNavItem = { to: '/dashboard/admin', icon: ShieldCheck, label: 'Admin' };

function BrandBlock({ showCloseButton = false, onClose }) {
  return (
    <div className="p-5">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-950/30">
            <Activity className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="truncate font-display text-sm font-bold text-white">Smart Inventory</div>
            <div className="mt-0.5 text-xs text-slate-400">Forex Journal</div>
          </div>
        </div>
        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Цэс хаах"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const visibleNavItems = [...navItems, ...(user?.role === 'ADMIN' ? [adminNavItem] : [])];
  const closeMobileSidebar = () => setIsMobileSidebarOpen(false);

  const handleLogout = () => {
    logout();
    toast.success('Амжилттай гарлаа');
    closeMobileSidebar();
    navigate('/login');
  };

  const SidebarContent = ({ isMobile = false }) => (
    <>
      <BrandBlock showCloseButton={isMobile} onClose={closeMobileSidebar} />

      <nav className="flex-1 space-y-1 overflow-y-auto px-4 pb-4">
        {visibleNavItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={isMobile ? closeMobileSidebar : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 ${
                isMobile ? 'py-3' : 'py-2.5'
              } text-sm font-medium transition-colors ${
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
    </>
  );

  return (
    <div className="flex min-h-dvh overflow-hidden bg-[#07111f]">
      <aside className="hidden w-72 flex-shrink-0 flex-col border-r border-white/10 bg-[#07111f] lg:flex">
        <SidebarContent />
      </aside>

      <div
        className={`fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm transition-opacity lg:hidden ${
          isMobileSidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={closeMobileSidebar}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(82vw,20rem)] flex-col border-r border-white/10 bg-[#07111f] shadow-2xl shadow-black/40 transition-transform duration-200 lg:hidden ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!isMobileSidebarOpen}
      >
        <SidebarContent isMobile />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-[#07111f]/95 px-4 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-xl text-slate-200 transition-colors hover:bg-white/10"
            aria-label="Цэс нээх"
            aria-expanded={isMobileSidebarOpen}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-950/30">
              <Activity className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="truncate font-display text-sm font-bold text-white">Smart Inventory</div>
              <div className="mt-0.5 text-xs text-slate-400">Forex Journal</div>
            </div>
          </div>

          <div className="h-10 w-10" aria-hidden="true" />
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto bg-[#07111f] bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.13),transparent_30%),radial-gradient(circle_at_85%_10%,_rgba(56,189,248,0.10),transparent_28%),linear-gradient(180deg,#07111f_0%,#0b1220_100%)]">
          <div className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
