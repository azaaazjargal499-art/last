import { useEffect, useMemo, useState } from 'react';
import { BookOpenCheck, Crown, Lock, Play, Search, Video, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { lessonService } from '@/services/index';

const tabs = [
  { id: 'BEGINNER', label: 'Анхан шат' },
  { id: 'ADVANCED', label: 'Ахисан шат' },
];

const isLocalVideo = (url) => String(url || '').startsWith('/uploads/lessons/');
const isDirectVideo = (url) => /\.(mp4|webm|ogg)(\?.*)?$/i.test(String(url || '')) || isLocalVideo(url);

const getEmbedUrl = (url) => {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com')) {
      const id = parsed.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : url;
    }
    if (parsed.hostname.includes('youtu.be')) {
      return `https://www.youtube.com/embed/${parsed.pathname.replace('/', '')}`;
    }
  } catch {
    return url;
  }
  return url;
};

function LessonCard({ lesson, onOpen }) {
  return (
    <div
      className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] text-left shadow-xl shadow-black/10 backdrop-blur-xl transition hover:-translate-y-1 hover:border-emerald-300/40"
    >
      <button
        type="button"
        onClick={() => lesson.locked ? toast('Ахисан шатны төлбөртэй хичээл үзэхийн тулд эрхээ идэвхжүүлээрэй.') : onOpen(lesson)}
        className="block w-full text-left"
      >
        <div className="relative aspect-video overflow-hidden bg-slate-950/50">
        {lesson.thumbnailUrl ? (
          <img src={lesson.thumbnailUrl} alt={lesson.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        ) : (
          <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_30%_20%,rgba(52,211,153,0.26),transparent_32%),linear-gradient(135deg,#0f172a,#12312b)]">
            <Video className="h-12 w-12 text-emerald-200" />
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-2">
          {lesson.isPremium && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-300 px-3 py-1 text-xs font-black text-amber-950">
              <Crown className="h-3.5 w-3.5" />
              Төлбөртэй
            </span>
          )}
          {lesson.locked && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-950/85 px-3 py-1 text-xs font-black text-white">
              <Lock className="h-3.5 w-3.5" />
              Locked
            </span>
          )}
        </div>
        <div className="lesson-media-overlay absolute inset-0 grid place-items-center transition">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-white/90 text-emerald-600 shadow-xl transition group-hover:scale-105">
            {lesson.locked ? <Lock className="h-6 w-6" /> : <Play className="ml-0.5 h-6 w-6 fill-current" />}
          </div>
        </div>
        </div>
      </button>
      <div className="p-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="rounded-full bg-emerald-300/10 px-2.5 py-1 text-xs font-black text-emerald-200">
            {lesson.level === 'ADVANCED' ? 'Ахисан шат' : 'Анхан шат'}
          </span>
          {lesson.duration && <span className="text-xs font-bold text-slate-500">{lesson.duration}</span>}
        </div>
        <h3 className="font-sans text-lg font-extrabold leading-snug tracking-normal text-white">{lesson.title}</h3>
        {lesson.description && (
          <p className="mt-3 line-clamp-2 text-sm font-semibold leading-6 text-slate-400">{lesson.description}</p>
        )}
        <div className="mt-4 text-xs font-bold text-slate-500">
          {lesson.author?.username || 'Trade Journal'}
        </div>
        {!lesson.locked && (
          <button
            type="button"
            onClick={() => onOpen(lesson)}
            className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 text-xs font-black text-slate-950 hover:bg-emerald-300"
          >
            <Play className="h-4 w-4 fill-current" />
            Үзэх
          </button>
        )}
      </div>
    </div>
  );
}

export default function Learn() {
  const [activeTab, setActiveTab] = useState('BEGINNER');
  const [lessons, setLessons] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const response = await lessonService.getAll({ level: activeTab });
      setLessons(response.lessons || []);
    } catch (_) {
      toast.error('Хичээлүүд татахад алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const openLesson = (lesson) => {
    if (lesson.locked) {
      toast('Ахисан шатны төлбөртэй хичээл үзэхийн тулд эрхээ идэвхжүүлээрэй.');
      return;
    }
    setSelectedLesson(lesson);
  };

  const filteredLessons = useMemo(() => {
    const clean = query.trim().toLowerCase();
    if (!clean) return lessons;
    return lessons.filter((lesson) => (
      lesson.title.toLowerCase().includes(clean) ||
      String(lesson.description || '').toLowerCase().includes(clean)
    ));
  }, [lessons, query]);

  return (
    <div className="space-y-6 animate-slide-up">
      <section className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.06] shadow-xl shadow-black/10 backdrop-blur-xl">
        <div className="grid gap-4 bg-[radial-gradient(circle_at_8%_0%,rgba(52,211,153,0.13),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.075),rgba(255,255,255,0.02))] p-4 sm:p-5 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-black text-emerald-200">
              <BookOpenCheck className="h-4 w-4" />
              Trading education
            </div>
            <h1 className="font-sans text-xl font-extrabold tracking-normal text-white">Өөрийгөө хөгжүүлэх</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-400">
              Анхан шатнаас ахисан шат хүртэл видео хичээлүүдээ дарааллаар үзэж, арилжааны арга барилаа системтэй хөгжүүлээрэй.
            </p>
          </div>
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Хичээл хайх"
              className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.08] pl-11 pr-4 text-sm font-semibold text-white outline-none placeholder:text-slate-500 focus:border-emerald-300/50"
            />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-xl px-3 py-2.5 text-sm font-extrabold transition sm:px-5 sm:py-3 ${
              activeTab === tab.id
                ? 'bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-950/20'
                : 'border border-white/10 bg-white/[0.06] text-slate-300 hover:bg-white/[0.1]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, index) => <div key={index} className="h-80 animate-pulse rounded-2xl bg-white/[0.06]" />)}
        </div>
      ) : filteredLessons.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredLessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              onOpen={openLesson}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.04] py-16 text-center text-sm font-semibold text-slate-400">
          Энэ ангилалд хичээл алга байна.
        </div>
      )}

      {selectedLesson && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/85 p-3 backdrop-blur-md" onClick={() => setSelectedLesson(null)}>
          <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-4 border-b border-white/10 p-4">
              <div className="min-w-0">
                <h2 className="truncate font-sans text-lg font-extrabold tracking-normal text-white">{selectedLesson.title}</h2>
                <p className="text-xs font-semibold text-slate-400">
                  {selectedLesson.level === 'ADVANCED' ? 'Ахисан шат' : 'Анхан шат'}
                </p>
              </div>
              <button onClick={() => setSelectedLesson(null)} className="grid h-10 w-10 place-items-center rounded-xl text-slate-400 hover:bg-white/10 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="aspect-video bg-black">
              {isDirectVideo(selectedLesson.videoUrl) ? (
                <video
                  src={selectedLesson.videoUrl}
                  title={selectedLesson.title}
                  className="h-full w-full"
                  controls
                  preload="metadata"
                />
              ) : (
                <iframe
                  src={getEmbedUrl(selectedLesson.videoUrl)}
                  title={selectedLesson.title}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              )}
            </div>
            {selectedLesson.description && (
              <div className="p-5 text-sm font-semibold leading-6 text-slate-300">{selectedLesson.description}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
