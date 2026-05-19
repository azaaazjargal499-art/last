// smart-inventory/frontend/src/pages/AI.jsx
import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  Brain,
  ChevronDown,
  CheckCircle,
  Clock,
  ImagePlus,
  MessageSquare,
  Sparkles,
  Star,
  TrendingUp,
  Upload,
  X,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/api';

const surface = 'rounded-3xl border border-white/10 bg-white/[0.055] shadow-2xl shadow-black/10 backdrop-blur-xl';
const innerSurface = 'rounded-2xl border border-white/10 bg-slate-950/35';

const aiPlans = [
  {
    id: 'BASIC',
    price: '$9.99/сар',
    limit: 'Сард 10 шинжилгээ',
    description: 'Эхний түвшний AI review',
    tone: 'border-white/10 bg-white/[0.06] text-slate-200',
  },
  {
    id: 'PRO',
    price: '$19.99/сар',
    limit: 'Сард 50 шинжилгээ',
    description: 'Идэвхтэй арилжаачинд',
    tone: 'border-cyan-300/20 bg-cyan-300/10 text-cyan-200',
  },
  {
    id: 'PREMIUM',
    price: '$29.99/сар',
    limit: 'Хязгааргүй шинжилгээ',
    description: 'Бүрэн эрх, лимитгүй',
    tone: 'border-emerald-300/30 bg-emerald-300/12 text-emerald-200',
  },
];

const forexPairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD', 'EUR/JPY', 'GBP/JPY', 'XAU/USD', 'XAG/USD'];
const timeframes = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1'];

const getPlan = (planId) => aiPlans.find((plan) => plan.id === planId) || aiPlans[0];

export default function AI() {
  const [subscription, setSubscription] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [chartAnalyzing, setChartAnalyzing] = useState(false);
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const [showChartForm, setShowChartForm] = useState(false);
  const [openPicker, setOpenPicker] = useState(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [chartForm, setChartForm] = useState({ imageUrl: '', pair: 'EUR/USD', timeframe: 'H1' });

  const activeSubscription = subscription?.status === 'ACTIVE';
  const activePlan = useMemo(() => (subscription ? getPlan(subscription.plan) : null), [subscription]);

  const fetchSubscription = async () => {
    try {
      const response = await api.get('/ai/subscription');
      setSubscription(response.data.subscription);
    } catch (error) {
      console.error('Subscription fetch error:', error);
    }
  };

  const fetchAnalyses = async () => {
    try {
      const response = await api.get('/ai/analyses');
      setAnalyses(response.data.analyses || []);
    } catch (error) {
      console.error('Analyses fetch error:', error);
    }
  };

  useEffect(() => {
    fetchSubscription();
    fetchAnalyses();
  }, []);

  const choosePlan = async (plan) => {
    setLoading(true);
    try {
      const response = await api.post('/ai/subscription', { plan });
      setSubscription(response.data.subscription);
      setShowPlanPicker(false);
      toast.success(response.data?.message || `${plan} AI эрх идэвхжлээ!`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const analyzeTrades = async () => {
    if (!activeSubscription) {
      toast.error('Эхлээд AI эрхээ сонгоно уу.');
      return;
    }

    setAnalyzing(true);
    try {
      const response = await api.post('/ai/analyze-trades');
      toast.success('Арилжааны шинжилгээ дууслаа!');
      if (response.data?.provider === 'LOCAL') {
        toast('AI provider түр ажиллахгүй тул local шинжилгээ үүсгэлээ.');
      }
      fetchAnalyses();
      fetchSubscription();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Алдаа гарлаа');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleChartFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setChartForm((current) => ({ ...current, imageUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const analyzeChart = async (event) => {
    event.preventDefault();
    if (!activeSubscription) {
      toast.error('Эхлээд AI эрхээ сонгоно уу.');
      return;
    }

    if (!chartForm.imageUrl.trim()) {
      toast.error('Чартын зураг эсвэл image URL оруулна уу.');
      return;
    }

    setChartAnalyzing(true);
    try {
      const response = await api.post('/ai/analyze-chart', {
        imageUrl: chartForm.imageUrl.trim(),
        pair: chartForm.pair.trim(),
        timeframe: chartForm.timeframe.trim(),
      });
      toast.success('Чартын шинжилгээ дууслаа!');
      if (response.data?.provider === 'LOCAL') {
        toast('AI vision provider түр ажиллахгүй тул checklist шинжилгээ үүсгэлээ.');
      }
      setShowChartForm(false);
      setChartForm({ imageUrl: '', pair: 'EUR/USD', timeframe: 'H1' });
      fetchAnalyses();
      fetchSubscription();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Алдаа гарлаа');
    } finally {
      setChartAnalyzing(false);
    }
  };

  const usageText = () => {
    if (!subscription) return 'Эрх сонгоогүй';
    if (subscription.usageLimit === null || subscription.usageLimit === undefined) return 'Хязгааргүй';
    return `${subscription.usageUsed || 0}/${subscription.usageLimit}`;
  };

  const renderPicker = ({ id, label, value, options, accent }) => {
    const activeAccent = accent === 'cyan'
      ? 'border-cyan-300/50 bg-cyan-300/12 text-cyan-100'
      : 'border-emerald-300/50 bg-emerald-300/12 text-emerald-100';
    const open = openPicker === id;

    return (
      <div className="relative">
        <span className="mb-2 block text-sm font-bold text-slate-300">{label}</span>
        <button
          type="button"
          onClick={() => setOpenPicker(open ? null : id)}
          className={`flex h-11 w-full items-center justify-between rounded-xl border px-3 text-left text-sm font-black outline-none transition-colors ${open ? activeAccent : 'border-white/10 bg-slate-950/80 text-white hover:bg-white/[0.07]'}`}
        >
          <span className="text-white">{value}</span>
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute z-20 mt-2 max-h-56 w-full overflow-y-auto rounded-xl border border-white/10 bg-slate-950 p-1.5 shadow-2xl shadow-black/30">
            {options.map((option) => {
              const selected = option === value;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setChartForm((current) => ({ ...current, [id]: option }));
                    setOpenPicker(null);
                  }}
                  className={`flex h-10 w-full items-center rounded-lg px-3 text-left text-sm font-black transition-colors ${
                    selected
                      ? accent === 'cyan'
                        ? 'bg-cyan-300 text-cyan-950'
                        : 'bg-emerald-300 text-slate-950'
                      : 'text-slate-200 hover:bg-white/[0.08] hover:text-white'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-950/30">
          <Brain className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">AI Туслагч</h1>
          <p className="text-sm text-slate-400">Оюун ухаалаг шинжилгээ ба зөвлөгөө</p>
        </div>
      </div>

      <div className={`${surface} p-6`}>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Star className="h-5 w-5 text-amber-300" />
            AI Эрх
          </h2>
          {activeSubscription ? (
            <div className="flex items-center gap-2 text-emerald-300">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Идэвхтэй</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-amber-300">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Эрх сонгоогүй</span>
            </div>
          )}
        </div>

        {activeSubscription && !showPlanPicker ? (
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr_auto] lg:items-stretch">
            <div className="rounded-2xl border border-emerald-300/40 bg-emerald-300/12 p-5 ring-1 ring-emerald-300/15">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-emerald-200">Одоогийн эрх</div>
                  <div className="mt-1 text-2xl font-black text-white">{activePlan.id}</div>
                </div>
                <span className="rounded-full bg-emerald-300 px-3 py-1 text-xs font-black text-emerald-950">Идэвхтэй</span>
              </div>
              <div className="mt-3 text-sm font-semibold text-emerald-100">{activePlan.price}</div>
              <div className="mt-1 text-sm text-slate-400">{activePlan.description}</div>
            </div>

            <div className={`${innerSurface} p-5`}>
              <div className="text-sm text-slate-400">Ашиглалт</div>
              <div className="mt-1 text-2xl font-black text-white">{usageText()}</div>
              <div className="mt-2 text-sm text-slate-400">{activePlan.limit}</div>
              {subscription.currentPeriodEnd && (
                <div className="mt-2 text-xs font-semibold text-slate-500">
                  Дуусах: {new Date(subscription.currentPeriodEnd).toLocaleDateString('mn-MN')}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowPlanPicker(true)}
              className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 text-sm font-black text-slate-200 transition-colors hover:bg-white/[0.1]"
            >
              Эрх солих
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-4 text-sm text-slate-400">
              {subscription ? 'Шинэ эрх сонговол одоогийн эрх шууд шинэчлэгдэнэ.' : 'AI туслагчийг ашиглах эрхээ сонгоно уу.'}
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {aiPlans.map((plan) => {
                const active = subscription?.plan === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => choosePlan(plan.id)}
                    disabled={loading || active}
                    className={`rounded-2xl border p-4 text-left transition-all hover:bg-white/[0.09] disabled:cursor-not-allowed disabled:opacity-80 ${
                      active ? 'border-emerald-300/60 bg-emerald-300/15 ring-1 ring-emerald-300/20' : plan.tone
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-base font-black text-white">{plan.id}</span>
                      {active && <span className="rounded-full bg-emerald-300 px-2 py-0.5 text-xs font-black text-emerald-950">Одоогийн</span>}
                    </div>
                    <div className="mt-2 text-sm font-semibold">{plan.price}</div>
                    <div className="mt-1 text-xs text-slate-400">{plan.limit}</div>
                  </button>
                );
              })}
            </div>
            {subscription && (
              <button
                type="button"
                onClick={() => setShowPlanPicker(false)}
                className="mt-4 text-sm font-bold text-slate-400 transition-colors hover:text-white"
              >
                Буцах
              </button>
            )}
          </div>
        )}
      </div>

      {activeSubscription && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className={`${surface} p-6`}>
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-300/12 text-cyan-200 ring-1 ring-cyan-300/20">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Арилжааны шинжилгээ</h3>
                <p className="text-sm text-slate-400">Сүүлийн 50 хаагдсан арилжааг шинжилнэ</p>
              </div>
            </div>
            <button
              onClick={analyzeTrades}
              disabled={analyzing}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 font-black text-cyan-950 transition-colors hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-950 border-t-transparent" />
                  Шинжилж байна...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Шинжилгээ эхлүүлэх
                </>
              )}
            </button>
          </div>

          <div className={`${surface} p-6`}>
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-300/12 text-emerald-200 ring-1 ring-emerald-300/20">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Чартын шинжилгээ</h3>
                <p className="text-sm text-slate-400">Chart screenshot эсвэл image URL шинжилнэ</p>
              </div>
            </div>
            <button
              onClick={() => setShowChartForm(true)}
              disabled={chartAnalyzing}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 font-black text-slate-950 transition-colors hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              Чарт шинжилгээ
            </button>
          </div>
        </div>
      )}

      <div className={`${surface} p-6`}>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
          <MessageSquare className="h-5 w-5" />
          Шинжилгээний түүх
        </h2>

        {analyses.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            <Brain className="mx-auto mb-4 h-12 w-12 text-slate-500" />
            <p>Одоогоор шинжилгээ байхгүй байна</p>
            <p className="text-sm">AI шинжилгээ хийснээр энд харагдана</p>
          </div>
        ) : (
          <div className="space-y-3">
            {analyses.map((analysis) => (
              <button
                key={analysis.id}
                type="button"
                className={`${innerSurface} w-full p-4 text-left transition-colors hover:bg-white/[0.06]`}
                onClick={() => setSelectedAnalysis(analysis)}
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {analysis.type === 'TRADE_ANALYSIS' ? (
                      <TrendingUp className="h-4 w-4 text-cyan-300" />
                    ) : (
                      <BarChart3 className="h-4 w-4 text-emerald-300" />
                    )}
                    <span className="text-sm font-medium text-white">{analysis.title}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Clock className="h-3 w-3" />
                    {new Date(analysis.createdAt).toLocaleDateString('mn-MN')}
                  </div>
                </div>
                <p className="line-clamp-2 text-sm text-slate-400">
                  {(analysis.content || '').substring(0, 150)}...
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {showChartForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form onSubmit={analyzeChart} className="w-full max-w-xl rounded-2xl border border-white/10 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-300/12 text-emerald-200 ring-1 ring-emerald-300/20">
                  <ImagePlus className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Чартын шинжилгээ</h3>
              </div>
              <button type="button" onClick={() => setShowChartForm(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-300">Чарт зураг</span>
                <div className="flex items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.04] p-4">
                  <Upload className="h-5 w-5 text-slate-400" />
                  <input type="file" accept="image/*" onChange={handleChartFile} className="text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-400 file:px-3 file:py-2 file:text-sm file:font-black file:text-slate-950" />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-300">Image URL</span>
                <input
                  value={chartForm.imageUrl.startsWith('data:') ? 'Зураг upload хийгдсэн' : chartForm.imageUrl}
                  onChange={(event) => setChartForm((current) => ({ ...current, imageUrl: event.target.value }))}
                  disabled={chartForm.imageUrl.startsWith('data:')}
                  placeholder="https://..."
                  className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300/50 disabled:border-emerald-300/20 disabled:bg-emerald-300/10 disabled:text-emerald-100"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                {renderPicker({ id: 'pair', label: 'Pair', value: chartForm.pair, options: forexPairs, accent: 'emerald' })}
                {renderPicker({ id: 'timeframe', label: 'Timeframe', value: chartForm.timeframe, options: timeframes, accent: 'cyan' })}
              </div>
            </div>

            <div className="grid gap-3 border-t border-white/10 p-5 sm:grid-cols-2">
              <button type="button" onClick={() => setShowChartForm(false)} className="rounded-xl border border-white/10 bg-white/[0.04] py-3 text-sm font-bold text-slate-300 transition-colors hover:bg-white/[0.08]">
                Болих
              </button>
              <button type="submit" disabled={chartAnalyzing} className="rounded-xl bg-emerald-400 py-3 text-sm font-black text-slate-950 transition-colors hover:bg-emerald-300 disabled:opacity-50">
                {chartAnalyzing ? 'Шинжилж байна...' : 'AI шинжилгээ авах'}
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedAnalysis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-slate-950 shadow-2xl">
            <div className="border-b border-white/10 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">{selectedAnalysis.title}</h3>
                <button onClick={() => setSelectedAnalysis(null)} className="text-slate-400 transition-colors hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                {selectedAnalysis.content}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
