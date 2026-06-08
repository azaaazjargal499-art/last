// smart-inventory/frontend/src/pages/RiskManagement.jsx
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Calculator, TrendingUp } from 'lucide-react';
import { riskService } from '@/services/index';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, getUserPairs, getUserRiskRewardPresets } from '@/utils/formatters';

const inputCls = 'w-full bg-[var(--bg-base)] border border-[var(--border)] text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary-500 disabled:opacity-70';

const growthModes = [
  { id: 'daily', label: 'Өдөр', title: 'Өдрийн өсөлт', presets: [0.5, 1, 1.5, 2], periods: [1, 5, 10, 20, 60], unit: 'өдөр' },
  { id: 'monthly', label: 'Сар', title: 'Сарын өсөлт', presets: [3, 6, 8, 10], periods: [1, 2, 3, 6, 12], unit: 'сар' },
  { id: 'yearly', label: 'Жил', title: 'Жилийн өсөлт', presets: [25, 50, 80, 100], periods: [1, 2, 3, 5], unit: 'жил' },
];

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const lotDecimals = (step) => {
  const [, decimals = ''] = String(step || 0.01).split('.');
  return decimals.length;
};

const floorToStep = (value, step = 0.01) => {
  const decimals = lotDecimals(step);
  return Number((Math.floor((value + Number.EPSILON) / step) * step).toFixed(decimals));
};

const formatLot = (value, fallback = '-') => {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return fallback;
  return Number(value).toFixed(4).replace(/\.?0+$/, '');
};

const getRiskPerOneLot = (result) => {
  const actualRisk = toNumber(result?.actualRiskAmount);
  const executableLot = toNumber(result?.executableLotSize || result?.brokerLotSize || result?.minLot);
  return actualRisk > 0 && executableLot > 0 ? actualRisk / executableLot : 0;
};

const buildGrowthProjection = ({ balance, mode, percent, result, view }) => {
  const config = growthModes.find((item) => item.id === mode) || growthModes[1];
  const rr = toNumber(result?.riskRewardRatio, 1);
  const riskPerOneLot = getRiskPerOneLot(result);
  const minLot = toNumber(result?.minLot, 0.01);
  const lotStep = toNumber(result?.lotStep, 0.01);
  const setupPercent = toNumber(result?.potentialRewardPercent);
  const effectivePercent = view === 'setup' && setupPercent > 0 ? setupPercent : toNumber(percent);
  const rate = Math.max(effectivePercent, 0) / 100;
  const canModelLot = Boolean(result && riskPerOneLot > 0);

  return config.periods.map((period) => {
    const projectedBalance = balance * Math.pow(1 + rate, period);
    const profit = projectedBalance - balance;
    const periodProfit = projectedBalance * rate;
    const setupRiskAmount = projectedBalance * (toNumber(result?.actualRiskPercent) / 100);
    const plannedRiskAmount = rr > 0 ? periodProfit / rr : 0;
    const riskAmount = canModelLot ? (view === 'setup' ? setupRiskAmount : plannedRiskAmount) : null;
    const exactLot = canModelLot && riskAmount > 0 ? riskAmount / riskPerOneLot : null;
    const brokerLot = exactLot !== null && exactLot >= minLot ? floorToStep(exactLot, lotStep) : null;
    const displayLot = exactLot !== null ? (brokerLot || minLot) : null;
    const displayRiskAmount = displayLot ? displayLot * riskPerOneLot : null;

    return {
      period,
      unit: config.unit,
      projectedBalance,
      profit,
      profitPercent: balance > 0 ? (profit / balance) * 100 : 0,
      displayLot,
      displayRiskAmount,
      displayRiskPercent: projectedBalance > 0 && displayRiskAmount ? (displayRiskAmount / projectedBalance) * 100 : null,
      isBelowMinimumLot: exactLot !== null && exactLot < minLot,
      hasLotModel: canModelLot,
      periodProfit,
    };
  });
};

export default function RiskManagement() {
  const { user } = useAuthStore();
  const [result, setResult] = useState(null);
  const [calcError, setCalcError] = useState('');
  const [growthMode, setGrowthMode] = useState('monthly');
  const [growthPercent, setGrowthPercent] = useState(6);
  const [growthView, setGrowthView] = useState('plan');

  const riskRewardOptions = getUserRiskRewardPresets(user);

  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      pair: getUserPairs(user)[0],
      direction: 'BUY',
      riskPercent: user?.riskPerTrade || 2,
      riskRewardRatio: riskRewardOptions[0],
    },
  });

  const selectedPair = watch('pair');

  const { data: pairData } = useQuery({
    queryKey: ['risk-pairs'],
    queryFn: riskService.getPairs,
  });

  const pairOptions = useMemo(() => {
    if (pairData?.pairs?.length) return pairData.pairs;
    return getUserPairs(user).map((pair) => ({ pair, requiresQuoteToUsdRate: false }));
  }, [pairData, user]);

  const selectedPairMeta = pairOptions.find((item) => item.pair === selectedPair);
  const currentBalance = pairData?.currentBalance ?? user?.balance ?? 10000;
  const selectedGrowthMode = growthModes.find((item) => item.id === growthMode) || growthModes[1];
  const setupGrowthPercent = toNumber(result?.potentialRewardPercent);
  const activeGrowthPercent = growthView === 'setup' && setupGrowthPercent > 0 ? setupGrowthPercent : toNumber(growthPercent);
  const growthProjection = useMemo(
    () => buildGrowthProjection({
      balance: currentBalance,
      mode: growthMode,
      percent: growthPercent,
      result,
      view: growthView,
    }),
    [currentBalance, growthMode, growthPercent, growthView, result],
  );
  const finalProjection = growthProjection[growthProjection.length - 1];

  useEffect(() => {
    if (pairOptions.length && !pairOptions.some((item) => item.pair === selectedPair)) {
      setValue('pair', pairOptions[0].pair);
    }
  }, [pairOptions, selectedPair, setValue]);

  const calcMutation = useMutation({
    mutationFn: riskService.calculate,
    onSuccess: (data) => {
      setResult(data);
      setCalcError('');
    },
    onError: (error) => {
      setResult(null);
      setCalcError(error?.response?.data?.error || 'Risk calculation failed.');
      setGrowthView('plan');
    },
  });

  const submit = (values) => {
    setCalcError('');
    calcMutation.mutate({
      ...values,
      accountBalance: currentBalance,
    });
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Эрсдэлийн хяналт</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Позици тооцоолол болон өөрийн өсөлтийн төлөвлөгөөг нэг дор харна.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="card">
          <div className="mb-5 flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary-400" />
            <h3 className="font-display font-semibold text-white">Позици тооцоолол</h3>
          </div>

          <form onSubmit={handleSubmit(submit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Арилжааны хослол">
                <select {...register('pair')} className={inputCls}>
                  {pairOptions.map((item) => <option key={item.pair} value={item.pair}>{item.pair}</option>)}
                </select>
              </Field>

              <Field label="Одоогийн баланс (USD)">
                <input value={currentBalance.toFixed(2)} readOnly disabled className={inputCls} />
              </Field>

              <Field label="Чиглэл">
                <select {...register('direction')} className={inputCls}>
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                </select>
              </Field>

              <Field label="Эрсдэл %">
                <input {...register('riskPercent')} type="number" step="0.1" min="0.1" max="10" className={inputCls} />
              </Field>

              <Field label="Оролтын үнэ">
                <input {...register('entryPrice')} type="number" step="0.00001" className={inputCls} />
              </Field>

              <Field label="Stop loss">
                <input {...register('stopLoss')} type="number" step="0.00001" className={inputCls} />
              </Field>

              <Field label="Risk / Reward">
                <select {...register('riskRewardRatio')} className={inputCls}>
                  {riskRewardOptions.map((preset) => <option key={preset} value={preset}>1:{preset}</option>)}
                </select>
              </Field>

              {selectedPairMeta?.requiresQuoteToUsdRate && (
                <Field label="Quote currency USD ханш">
                  <input {...register('quoteToUsdRate')} type="number" step="0.00001" placeholder="Ж: GBPUSD = 1.2700" className={inputCls} />
                </Field>
              )}

              <Field label="Шалгах lot size">
                <input {...register('lotSize')} type="number" step="0.01" className={inputCls} />
              </Field>
            </div>

            {calcError && (
              <div className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-300">
                {calcError}
              </div>
            )}

            <button
              type="submit"
              disabled={calcMutation.isPending}
              className="w-full rounded-lg bg-primary-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-60"
            >
              Тооцоолох
            </button>
          </form>

          {result && (
            <div className="mt-5 space-y-3 animate-slide-up">
              {result.warning && (
                <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 p-3 text-sm leading-6 text-amber-100">
                  {result.warning}
                </div>
              )}

              <div className="risk-result-panel rounded-xl p-4">
                <div className="mb-3 text-sm font-semibold text-white">Тооцооллын үр дүн</div>
                <ResultRow label="Баланс" value={formatCurrency(result.accountBalance)} color="text-white" />
                <ResultRow label="Зорьсон risk" value={`${formatCurrency(result.targetRiskAmount)} (${result.targetRiskPercent}%)`} color="risk-value-warn" />
                <ResultRow label="Stop зай" value={`${result.stopDistance} price / ${result.pipsAtRisk} pips`} color="text-[var(--text-secondary)]" />
                <ResultRow label="Take profit" value={result.takeProfitPrice ?? '-'} color="risk-value-profit font-bold" />
                <ResultRow label="Potential reward" value={result.potentialRewardAmount ? `${formatCurrency(result.potentialRewardAmount)} (${result.potentialRewardPercent}%)` : '-'} color="risk-value-profit font-bold" />
                <ResultRow
                  label="Арилжаанд тавих lot"
                  value={result.brokerLotSize ? `${formatLot(result.brokerLotSize)} lot` : `${formatLot(result.minLot)} lot min`}
                  color={result.brokerLotSize ? 'risk-value-lot font-bold' : 'risk-value-warn font-bold'}
                />
                <ResultRow
                  label={result.brokerLotSize ? 'Бодит risk' : 'Minimum lot risk'}
                  value={`${formatCurrency(result.actualRiskAmount)} (${result.actualRiskPercent}%)`}
                  color={result.isActualRiskOverTarget ? 'risk-value-warn font-bold' : 'risk-value-profit font-bold'}
                />
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-300" />
              <h3 className="font-display font-semibold text-white">Баланс өсөлтийн зураглал</h3>
            </div>
            <div className="text-right text-xs text-[var(--text-muted)]">
              {growthView === 'setup' ? `${selectedGrowthMode.label} бүр Setup TP` : selectedGrowthMode.title}: <span className="font-mono text-green-300">{activeGrowthPercent.toFixed(1)}%</span>
            </div>
          </div>

          <div className="mb-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setGrowthView('plan')}
              className={`rounded-lg border px-3 py-2 text-sm font-bold transition ${
                growthView === 'plan'
                  ? 'risk-tab-active'
                  : 'border-white/15 bg-white/[0.04] text-white hover:bg-white/[0.08]'
              }`}
            >
              Төлөвлөгөө
            </button>
            <button
              type="button"
              onClick={() => result && setGrowthView('setup')}
              disabled={!result}
              className={`rounded-lg border px-3 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-45 ${
                growthView === 'setup'
                  ? 'border-primary-300 bg-primary-400 text-slate-950'
                  : 'border-white/15 bg-white/[0.04] text-white hover:bg-white/[0.08]'
              }`}
            >
              Setup TP
            </button>
          </div>

          <div className="mb-4 grid grid-cols-3 gap-2">
            {growthModes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => {
                  setGrowthMode(mode.id);
                  setGrowthPercent(mode.presets[1]);
                }}
                className={`rounded-lg border px-3 py-2 text-sm font-bold transition ${
                  growthMode === mode.id
                    ? 'risk-tab-active'
                    : 'border-white/15 bg-white/[0.04] text-white hover:bg-white/[0.08]'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {growthView === 'setup' && result ? (
            <div className="mb-4 rounded-lg border border-green-300/20 bg-green-300/10 px-3 py-2 text-sm text-green-100">
              Одоогийн setup TP авбал {formatCurrency(result.potentialRewardAmount)} ({result.potentialRewardPercent}%) ашигтай. Энэ нь тусдаа зураглал.
            </div>
          ) : (
            <div className="mb-4 grid grid-cols-[1fr_110px] gap-2">
              <div className="grid grid-cols-2 gap-2">
                {selectedGrowthMode.presets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setGrowthPercent(preset)}
                    className={`rounded-lg border px-2 py-2 text-sm font-bold transition ${
                      Number(growthPercent) === preset
                        ? 'border-primary-300 bg-primary-400 text-slate-950'
                        : 'border-white/15 bg-white/[0.04] text-white hover:bg-white/[0.08]'
                    }`}
                  >
                    {preset}%
                  </button>
                ))}
              </div>

              <input
                value={growthPercent}
                onChange={(event) => setGrowthPercent(event.target.value)}
                type="number"
                step="0.1"
                min="0"
                max={growthMode === 'yearly' ? 300 : growthMode === 'monthly' ? 50 : 10}
                className={inputCls}
                aria-label={selectedGrowthMode.title}
              />
            </div>
          )}

          <div className="mb-4 grid grid-cols-3 gap-2">
            <MiniStat label="Одоо" value={formatCurrency(currentBalance)} />
            <MiniStat label={`${finalProjection?.period || 0} ${selectedGrowthMode.unit}`} value={formatCurrency(finalProjection?.projectedBalance || currentBalance)} />
            <MiniStat label="Өсөлт" value={`${finalProjection?.profitPercent.toFixed(1) || 0}%`} positive />
          </div>

          {!result && (
            <div className="mb-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-[var(--text-secondary)]">
              Entry/SL тооцоолсны дараа төлөвлөгөөнд хүрэхэд хэрэгтэй broker lot энд гарна.
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-white/10">
            <div className="grid grid-cols-[72px_1fr_1fr] bg-white/[0.04] px-3 py-2 text-xs font-semibold text-[var(--text-muted)]">
              <span>Хугацаа</span>
              <span>Баланс</span>
              <span className="text-right">Risk / Lot</span>
            </div>
            {growthProjection.map((row) => (
              <div key={`${row.period}-${row.unit}`} className="grid grid-cols-[72px_1fr_1fr] items-center border-t border-white/10 px-3 py-2.5 text-sm">
                <span className="font-semibold text-white">{row.period} {row.unit}</span>
                <div>
                  <div className="font-mono font-bold text-white">{formatCurrency(row.projectedBalance)}</div>
                  <div className="text-xs font-semibold text-green-300">
                    +{formatCurrency(row.profit)} ({row.profitPercent.toFixed(1)}%)
                  </div>
                </div>
                <div className="text-right">
                  {row.hasLotModel ? (
                    <>
                      <div className={`font-mono font-bold ${row.isBelowMinimumLot ? 'text-amber-300' : 'text-primary-300'}`}>
                        {formatLot(row.displayLot)} lot{row.isBelowMinimumLot ? ' min' : ''}
                      </div>
                      <div className="text-xs font-mono text-amber-200">
                        {formatCurrency(row.displayRiskAmount)} ({row.displayRiskPercent.toFixed(1)}%)
                      </div>
                    </>
                  ) : (
                    <span className="text-xs text-[var(--text-muted)]">тооцоолсны дараа</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {result && growthProjection.some((row) => row.isBelowMinimumLot) && (
            <div className="mt-3 rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs leading-5 text-amber-100">
              Зарим шатанд зорьсон risk-д таарах lot broker minimum-аас бага байна. Тийм үед хүснэгт 0.01 lot min болон бодит risk %-ийг харуулна.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-[var(--text-secondary)]">{label}</label>
      {children}
    </div>
  );
}

function ResultRow({ label, value, color }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1 text-sm">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className={`text-right font-mono ${color}`}>{value}</span>
    </div>
  );
}

function MiniStat({ label, value, positive = false }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
      <div className="text-[11px] font-semibold text-[var(--text-muted)]">{label}</div>
      <div className={`mt-1 font-mono text-sm font-bold ${positive ? 'text-green-300' : 'text-white'}`}>{value}</div>
    </div>
  );
}
