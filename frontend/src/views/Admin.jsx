import { useEffect, useMemo, useState } from 'react';
import { Activity, CreditCard, Pencil, Plus, RefreshCw, Search, ShieldCheck, Trash2, Users, Video, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '@/services/index';

const plans = ['BASIC', 'PRO', 'PREMIUM'];
const statuses = ['ACTIVE', 'CANCELLED', 'PAST_DUE', 'UNPAID'];
const roles = ['USER', 'ADMIN'];
const lessonLevels = ['BEGINNER', 'ADVANCED'];

const emptyLesson = {
  title: '',
  description: '',
  videoUrl: '',
  thumbnailUrl: '',
  level: 'BEGINNER',
  isPremium: false,
  duration: '',
  sortOrder: 0,
  isPublished: true,
};

const getYoutubeThumbnail = (url) => {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    let id = '';
    if (parsed.hostname.includes('youtube.com')) {
      id = parsed.searchParams.get('v') || '';
    }
    if (parsed.hostname.includes('youtu.be')) {
      id = parsed.pathname.replace('/', '').split('/')[0];
    }
    return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : '';
  } catch {
    return '';
  }
};

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
  const [lessons, setLessons] = useState([]);
  const [lessonForm, setLessonForm] = useState(emptyLesson);
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [lessonSaving, setLessonSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [overviewData, usersData, lessonsData] = await Promise.all([
        adminService.getOverview(),
        adminService.getUsers(search ? { search } : undefined),
        adminService.getLessons(),
      ]);
      setOverview(overviewData);
      setUsers(usersData.users || []);
      setLessons(lessonsData.lessons || []);
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

  const resetLessonForm = () => {
    setLessonForm(emptyLesson);
    setEditingLessonId(null);
  };

  const editLesson = (lesson) => {
    setEditingLessonId(lesson.id);
    setLessonForm({
      title: lesson.title || '',
      description: lesson.description || '',
      videoUrl: lesson.videoUrl || '',
      thumbnailUrl: lesson.thumbnailUrl || '',
      level: lesson.level || 'BEGINNER',
      isPremium: Boolean(lesson.isPremium),
      duration: lesson.duration || '',
      sortOrder: lesson.sortOrder || 0,
      isPublished: Boolean(lesson.isPublished),
    });
  };

  const saveLesson = async (event) => {
    event.preventDefault();
    try {
      setLessonSaving(true);
      if (editingLessonId) {
        await adminService.updateLesson(editingLessonId, lessonForm);
        toast.success('Хичээл шинэчлэгдлээ');
      } else {
        await adminService.createLesson(lessonForm);
        toast.success('Хичээл нэмэгдлээ');
      }
      resetLessonForm();
      await load();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Хичээл хадгалахад алдаа гарлаа');
    } finally {
      setLessonSaving(false);
    }
  };

  const removeLesson = async (lesson) => {
    if (!confirm(`"${lesson.title}" хичээлийг устгах уу?`)) return;
    try {
      await adminService.deleteLesson(lesson.id);
      toast.success('Хичээл устгагдлаа');
      await load();
    } catch (_) {
      toast.error('Хичээл устгахад алдаа гарлаа');
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

      <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <form onSubmit={saveLesson} className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-black">
              <Video className="h-5 w-5 text-blue-300" />
              Видео хичээл
            </h2>
            {editingLessonId && (
              <button type="button" onClick={resetLessonForm} className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-white/10 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          <div className="space-y-3">
            <input
              value={lessonForm.title}
              onChange={(event) => setLessonForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Хичээлийн гарчиг"
              className="h-11 w-full rounded-xl border border-white/10 bg-[#07111f] px-3 text-sm font-semibold text-white outline-none focus:border-blue-300/60"
            />
            <textarea
              value={lessonForm.description}
              onChange={(event) => setLessonForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Тайлбар"
              rows={3}
              className="w-full resize-none rounded-xl border border-white/10 bg-[#07111f] px-3 py-3 text-sm font-semibold text-white outline-none focus:border-blue-300/60"
            />
            <input
              value={lessonForm.videoUrl}
              onChange={(event) => {
                const videoUrl = event.target.value;
                const autoThumbnail = getYoutubeThumbnail(videoUrl);
                setLessonForm((current) => ({
                  ...current,
                  videoUrl,
                  thumbnailUrl: current.thumbnailUrl || autoThumbnail,
                }));
              }}
              placeholder="Video URL (YouTube, embed эсвэл mp4/webm URL)"
              className="h-11 w-full rounded-xl border border-white/10 bg-[#07111f] px-3 text-sm font-semibold text-white outline-none focus:border-blue-300/60"
            />
            {getYoutubeThumbnail(lessonForm.videoUrl) && (
              <button
                type="button"
                onClick={() => setLessonForm((current) => ({ ...current, thumbnailUrl: getYoutubeThumbnail(current.videoUrl) }))}
                className="h-10 rounded-xl border border-blue-300/20 bg-blue-300/10 px-3 text-sm font-black text-blue-200 hover:bg-blue-300/15"
              >
                YouTube thumbnail автоматаар авах
              </button>
            )}
            <input
              value={lessonForm.thumbnailUrl}
              onChange={(event) => setLessonForm((current) => ({ ...current, thumbnailUrl: event.target.value }))}
              placeholder="Thumbnail зурагны URL"
              className="h-11 w-full rounded-xl border border-white/10 bg-[#07111f] px-3 text-sm font-semibold text-white outline-none focus:border-blue-300/60"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <select
                value={lessonForm.level}
                onChange={(event) => setLessonForm((current) => ({ ...current, level: event.target.value, isPremium: event.target.value === 'ADVANCED' ? current.isPremium : false }))}
                className="h-11 rounded-xl border border-white/10 bg-[#07111f] px-3 text-sm font-bold text-white"
              >
                {lessonLevels.map(level => <option key={level} value={level}>{level === 'ADVANCED' ? 'Ахисан шат' : 'Анхан шат'}</option>)}
              </select>
              <input
                value={lessonForm.duration}
                onChange={(event) => setLessonForm((current) => ({ ...current, duration: event.target.value }))}
                placeholder="Duration: 18 мин"
                className="h-11 rounded-xl border border-white/10 bg-[#07111f] px-3 text-sm font-semibold text-white outline-none focus:border-blue-300/60"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-[#07111f] px-3 text-sm font-bold text-slate-300">
                <input
                  type="checkbox"
                  checked={lessonForm.isPremium}
                  onChange={(event) => setLessonForm((current) => ({ ...current, isPremium: event.target.checked }))}
                />
                Төлбөртэй
              </label>
              <label className="flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-[#07111f] px-3 text-sm font-bold text-slate-300">
                <input
                  type="checkbox"
                  checked={lessonForm.isPublished}
                  onChange={(event) => setLessonForm((current) => ({ ...current, isPublished: event.target.checked }))}
                />
                Published
              </label>
            </div>
            <input
              type="number"
              value={lessonForm.sortOrder}
              onChange={(event) => setLessonForm((current) => ({ ...current, sortOrder: Number(event.target.value) }))}
              placeholder="Дараалал"
              className="h-11 w-full rounded-xl border border-white/10 bg-[#07111f] px-3 text-sm font-semibold text-white outline-none focus:border-blue-300/60"
            />
            <button disabled={lessonSaving} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 disabled:opacity-50">
              <Plus className="h-4 w-4" />
              {editingLessonId ? 'Хичээл шинэчлэх' : 'Хичээл нэмэх'}
            </button>
          </div>
        </form>

        <div className="rounded-2xl border border-white/10 bg-white/[0.06]">
          <div className="border-b border-white/10 p-5">
            <h2 className="text-lg font-black">Видео хичээлүүд</h2>
            <p className="mt-1 text-sm text-slate-400">Анхан болон ахисан шатны бүх хичээлийг эндээс удирдана.</p>
          </div>
          <div className="divide-y divide-white/10">
            {lessons.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">Одоогоор хичээл байхгүй.</div>
            ) : lessons.map((lesson) => (
              <div key={lesson.id} className="grid gap-3 p-4 md:grid-cols-[96px_1fr_auto] md:items-center">
                <div className="aspect-video overflow-hidden rounded-xl bg-[#07111f]">
                  {lesson.thumbnailUrl ? <img src={lesson.thumbnailUrl} alt={lesson.title} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><Video className="h-6 w-6 text-slate-500" /></div>}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-bold text-white">{lesson.title}</h3>
                    <span className="rounded-full bg-blue-300/10 px-2 py-0.5 text-[11px] font-black text-blue-200">{lesson.level === 'ADVANCED' ? 'Ахисан' : 'Анхан'}</span>
                    {lesson.isPremium && <span className="rounded-full bg-amber-300 px-2 py-0.5 text-[11px] font-black text-amber-950">Төлбөртэй</span>}
                    {!lesson.isPublished && <span className="rounded-full bg-slate-600 px-2 py-0.5 text-[11px] font-black text-white">Hidden</span>}
                  </div>
                  <p className="mt-1 line-clamp-1 text-sm text-slate-400">{lesson.description || lesson.videoUrl}</p>
                </div>
                <div className="flex items-center gap-1 justify-self-end">
                  <button type="button" onClick={() => editLesson(lesson)} className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-white/10 hover:text-white">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => removeLesson(lesson)} className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-300">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
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
