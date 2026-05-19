import { useEffect, useMemo, useState } from 'react';
import { Activity, CreditCard, RefreshCw, Search, ShieldCheck, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '@/services/index';

const plans = ['BASIC', 'PRO', 'PREMIUM'];
const statuses = ['ACTIVE', 'CANCELLED', 'PAST_DUE', 'UNPAID'];
const roles = ['USER', 'ADMIN'];

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('mn-MN', { year: 'numeric', month: 'short', day: 'numeric' });
};

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="mt-1 text-sm text-slate-400">{label}</div>
    </div>
  );
}

export default function Admin() {
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const [overviewData, usersData] = await Promise.all([
        adminService.getOverview(),
        adminService.getUsers(search ? { search } : undefined),
      ]);
      setOverview(overviewData);
      setUsers(usersData.users || []);
    } catch (_) {
      toast.error('Admin мэдээлэл татахад алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const planSummary = useMemo(() => {
    const source = overview?.subscriptionsByPlan || [];
    return plans.map(plan => ({
      plan,
      count: source.find(item => item.plan === plan)?.count || 0,
    }));
  }, [overview]);

  const updateUser = async (user, patch) => {
    try {
      setSavingId(user.id);
      await adminService.updateUser(user.id, patch);
      toast.success('Шинэчлэгдлээ');
      await load();
    } catch (_) {
      toast.error('Шинэчлэхэд алдаа гарлаа');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6 text-white">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-sm font-bold text-emerald-200">
            <ShieldCheck className="h-4 w-4" />
            Admin dashboard
          </div>
          <h1 className="font-display text-3xl font-black">Хэрэглэгч, эрхийн хяналт</h1>
          <p className="mt-2 text-sm text-slate-400">Хэрэглэгчид, AI эрх, subscription plan болон хэрэглээг нэг дор хянах хэсэг.</p>
        </div>
        <button
          onClick={load}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 text-sm font-bold text-slate-200 hover:bg-white/[0.1]"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={Users} label="Нийт хэрэглэгч" value={overview?.totals?.users ?? '-'} />
        <StatCard icon={Users} label="Энэ сарын шинэ" value={overview?.totals?.newUsersThisMonth ?? '-'} />
        <StatCard icon={CreditCard} label="Идэвхтэй эрх" value={overview?.totals?.activeSubscriptions ?? '-'} />
        <StatCard icon={Activity} label="Нийт арилжаа" value={overview?.totals?.trades ?? '-'} />
        <StatCard icon={Activity} label="AI шинжилгээ" value={overview?.totals?.aiAnalyses ?? '-'} />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
        <h2 className="mb-4 text-lg font-black">Эрхийн төрлөөр</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {planSummary.map(item => (
            <div key={item.plan} className="rounded-xl border border-white/10 bg-[#07111f]/60 p-4">
              <div className="text-xs font-bold text-slate-500">{item.plan}</div>
              <div className="mt-2 text-2xl font-black text-emerald-300">{item.count}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.06]">
        <div className="flex flex-col gap-3 border-b border-white/10 p-5 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-black">Хэрэглэгчид</h2>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              load();
            }}
            className="relative w-full md:w-80"
          >
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Email эсвэл нэрээр хайх"
              className="h-10 w-full rounded-xl border border-white/10 bg-[#07111f] pl-10 pr-3 text-sm text-white outline-none focus:border-emerald-300/60"
            />
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full text-left text-sm">
            <thead className="bg-white/[0.04] text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Хэрэглэгч</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Эрх</th>
                <th className="px-5 py-3">Төлөв</th>
                <th className="px-5 py-3">Дуусах</th>
                <th className="px-5 py-3">Хэрэглээ</th>
                <th className="px-5 py-3">Үүссэн</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr><td className="px-5 py-8 text-center text-slate-400" colSpan="7">Уншиж байна...</td></tr>
              ) : users.length === 0 ? (
                <tr><td className="px-5 py-8 text-center text-slate-400" colSpan="7">Хэрэглэгч олдсонгүй.</td></tr>
              ) : users.map(user => (
                <tr key={user.id} className="text-slate-300">
                  <td className="px-5 py-4">
                    <div className="font-bold text-white">{user.username}</div>
                    <div className="text-xs text-slate-500">{user.email}</div>
                  </td>
                  <td className="px-5 py-4">
                    <select
                      value={user.role}
                      disabled={savingId === user.id}
                      onChange={(event) => updateUser(user, { role: event.target.value })}
                      className="h-9 rounded-lg border border-white/10 bg-[#07111f] px-2 text-xs font-bold text-white"
                    >
                      {roles.map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-4">
                    <select
                      value={user.subscription?.plan || 'BASIC'}
                      disabled={savingId === user.id}
                      onChange={(event) => updateUser(user, { plan: event.target.value, status: user.subscription?.status || 'ACTIVE' })}
                      className="h-9 rounded-lg border border-white/10 bg-[#07111f] px-2 text-xs font-bold text-white"
                    >
                      {plans.map(plan => <option key={plan} value={plan}>{plan}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-4">
                    <select
                      value={user.subscription?.status || 'CANCELLED'}
                      disabled={savingId === user.id || !user.subscription}
                      onChange={(event) => updateUser(user, { plan: user.subscription?.plan || 'BASIC', status: event.target.value })}
                      className="h-9 rounded-lg border border-white/10 bg-[#07111f] px-2 text-xs font-bold text-white disabled:opacity-50"
                    >
                      {statuses.map(status => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-4">{formatDate(user.subscription?.currentPeriodEnd)}</td>
                  <td className="px-5 py-4">
                    <div>{user._count.trades} trades</div>
                    <div className="text-xs text-slate-500">{user._count.aiAnalyses} AI, {user._count.alerts} alerts</div>
                  </td>
                  <td className="px-5 py-4">{formatDate(user.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
