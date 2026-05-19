// smart-inventory/frontend/src/pages/Trades.jsx
import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { mn } from 'date-fns/locale';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { strategyService, tradeService } from '@/services/index';
import { FOREX_PAIRS, formatPnL } from '@/utils/formatters';

const inputCls = 'h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 text-sm font-medium text-slate-950 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100';
const labelCls = 'mb-1.5 block text-xs font-bold text-slate-500';
const dateTimeRow = 'grid grid-cols-2 gap-2.5';
const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const pad2 = (value) => String(value).padStart(2, '0');

const toLocalDateTimeParts = (value) => {
  if (!value) return { date: '', time: '' };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: '', time: '' };
  return {
    date: `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`,
    time: `${pad2(date.getHours())}:${pad2(date.getMinutes())}`,
  };
};

const combineDateTime = (date, time) => {
  if (!date || !time) return null;
  return `${date}T${time}:00`;
};

const getTradeDate = (trade) => new Date(trade.closedAt || trade.openedAt);

const compactMoney = (value) => {
  if (!value) return '$0';
  const abs = Math.abs(value);
  const sign = value > 0 ? '+' : '-';
  if (abs >= 1000000) return `${sign}$${(abs / 1000000).toFixed(1)}M`;
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(0)}`;
};

const buildCalendarDays = (month) => {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
  return eachDayOfInterval({ start, end });
};

export default function Trades() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState({ status: '', pair: '' });
  const [viewMonth, setViewMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const { register, handleSubmit, reset, setValue } = useForm({
    defaultValues: {
      pair: FOREX_PAIRS[0],
      direction: 'BUY',
      openedAtDate: '',
      openedAtTime: '',
      closedAtDate: '',
      closedAtTime: '',
      commission: 0,
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['trades', filter],
    queryFn: () => tradeService.getAll({ ...filter, limit: 500, sortBy: 'openedAt', order: 'asc' }),
  });

  const { data: strategiesData } = useQuery({
    queryKey: ['strategies'],
    queryFn: strategyService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: (values) => (editing ? tradeService.update(editing.id, values) : tradeService.create(values)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trades'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(editing ? 'Арилжаа шинэчлэгдлээ!' : 'Арилжаа бүртгэгдлээ!');
      closeForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: tradeService.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trades'] });
      toast.success('Арилжаа устгагдлаа');
    },
  });

  const trades = data?.trades || [];

  const monthTrades = useMemo(
    () => trades.filter((trade) => isSameMonth(getTradeDate(trade), viewMonth)),
    [trades, viewMonth],
  );

  const monthStats = useMemo(() => {
    const totalPnL = monthTrades.reduce((sum, trade) => sum + Number(trade.pnl || 0), 0);
    const wins = monthTrades.filter((trade) => Number(trade.pnl || 0) > 0).length;
    return {
      totalPnL,
      totalTrades: monthTrades.length,
      winRate: monthTrades.length ? Math.round((wins / monthTrades.length) * 100) : 0,
    };
  }, [monthTrades]);

  const calendarDays = useMemo(() => buildCalendarDays(viewMonth), [viewMonth]);

  const selectedTrades = useMemo(
    () => trades.filter((trade) => isSameDay(getTradeDate(trade), selectedDate)),
    [trades, selectedDate],
  );

  const weekStats = useMemo(() => {
    const weeks = [];
    for (let index = 0; index < calendarDays.length; index += 7) {
      const weekDays = calendarDays.slice(index, index + 7);
      const weekTrades = monthTrades.filter((trade) => weekDays.some((day) => isSameDay(getTradeDate(trade), day)));
      weeks.push({
        label: `Week ${weeks.length + 1}`,
        pnl: weekTrades.reduce((sum, trade) => sum + Number(trade.pnl || 0), 0),
        trades: weekTrades.length,
      });
    }
    return weeks;
  }, [calendarDays, monthTrades]);

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    reset({
      pair: FOREX_PAIRS[0],
      direction: 'BUY',
      openedAtDate: '',
      openedAtTime: '',
      closedAtDate: '',
      closedAtTime: '',
      commission: 0,
    });
  };

  const openCreate = (date = selectedDate) => {
    setEditing(null);
    setShowForm(true);
    reset({
      pair: FOREX_PAIRS[0],
      direction: 'BUY',
      openedAtDate: format(date, 'yyyy-MM-dd'),
      openedAtTime: '09:00',
      closedAtDate: '',
      closedAtTime: '',
      commission: 0,
    });
  };

  const openEdit = (trade) => {
    setEditing(trade);
    setShowForm(true);
    Object.entries(trade).forEach(([key, value]) => value !== null && setValue(key, value));
    const openedParts = toLocalDateTimeParts(trade.openedAt);
    const closedParts = toLocalDateTimeParts(trade.closedAt);
    setValue('openedAtDate', openedParts.date);
    setValue('openedAtTime', openedParts.time);
    setValue('closedAtDate', closedParts.date);
    setValue('closedAtTime', closedParts.time);
  };

  const submitTrade = (values) => {
    const payload = {
      ...values,
      openedAt: combineDateTime(values.openedAtDate, values.openedAtTime),
      closedAt: combineDateTime(values.closedAtDate, values.closedAtTime),
    };
    delete payload.openedAtDate;
    delete payload.openedAtTime;
    delete payload.closedAtDate;
    delete payload.closedAtTime;
    createMutation.mutate(payload);
  };

  const monthPositive = monthStats.totalPnL >= 0;

  return (
    <div className="space-y-6 animate-slide-up">
      <section className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="relative border-b border-white/10 p-5 sm:p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(16,185,129,0.18),transparent_32%),radial-gradient(circle_at_85%_20%,rgba(59,130,246,0.16),transparent_30%)]" />
          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-200">
                Trading calendar
              </div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-white">Арилжааны календарь</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Өдөр, долоо хоног, сарын P&L-ээ нэг дэлгэц дээр өнгөөр нь ялгаж харна.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[460px]">
              <HeroStat label="Monthly P&L" value={formatPnL(monthStats.totalPnL)} positive={monthPositive} />
              <HeroStat label="Trades" value={monthStats.totalTrades} />
              <HeroStat label="Win rate" value={`${monthStats.winRate}%`} />
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setViewMonth((month) => subMonths(month, 1))}
                className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-slate-200 hover:bg-white/[0.1]"
                title="Өмнөх сар"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="min-w-44 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-center text-sm font-extrabold capitalize text-white">
                {format(viewMonth, 'LLLL yyyy', { locale: mn })}
              </div>
              <button
                onClick={() => setViewMonth((month) => addMonths(month, 1))}
                className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-slate-200 hover:bg-white/[0.1]"
                title="Дараагийн сар"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setViewMonth(new Date());
                  setSelectedDate(new Date());
                }}
                className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-white/[0.1]"
              >
                Өнөөдөр
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select
                value={filter.status}
                onChange={(event) => setFilter((current) => ({ ...current, status: event.target.value }))}
                className="rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-slate-200 outline-none hover:bg-slate-950/60"
              >
                <option value="">Бүх статус</option>
                <option value="OPEN">Нээлттэй</option>
                <option value="CLOSED">Хаагдсан</option>
              </select>
              <select
                value={filter.pair}
                onChange={(event) => setFilter((current) => ({ ...current, pair: event.target.value }))}
                className="rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-slate-200 outline-none hover:bg-slate-950/60"
              >
                <option value="">Бүх пар</option>
                {FOREX_PAIRS.map((pair) => <option key={pair} value={pair}>{pair}</option>)}
              </select>
              <button className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-slate-300 hover:bg-white/[0.1]" title="Шүүлтүүр">
                <SlidersHorizontal className="h-4 w-4" />
              </button>
              <button
                onClick={() => openCreate()}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-extrabold text-slate-950 shadow-lg shadow-emerald-950/30 hover:bg-emerald-300"
              >
                <Plus className="h-4 w-4" />
                Арилжаа нэмэх
              </button>
            </div>
          </div>

          <div className="grid grid-cols-[minmax(820px,1fr)_128px] gap-3 overflow-x-auto pb-1">
            <div className="grid grid-cols-7 gap-3">
              {dayLabels.map((day) => (
                <div key={day} className="rounded-2xl border border-white/10 bg-white/[0.06] py-3 text-center text-xs font-extrabold text-slate-300">
                  {day}
                </div>
              ))}

              {calendarDays.map((day) => {
                const dayTrades = trades.filter((trade) => isSameDay(getTradeDate(trade), day));
                const pnl = dayTrades.reduce((sum, trade) => sum + Number(trade.pnl || 0), 0);
                const hasTrades = dayTrades.length > 0;
                const positive = pnl >= 0;
                const active = isSameDay(day, selectedDate);
                const inMonth = isSameMonth(day, viewMonth);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    onDoubleClick={() => openCreate(day)}
                    className={`group relative flex min-h-32 flex-col overflow-hidden rounded-2xl border p-3 text-left transition-all duration-200 ${
                      hasTrades
                        ? positive
                          ? 'border-emerald-300/50 bg-emerald-400/[0.13] shadow-[0_0_0_1px_rgba(52,211,153,0.12),0_18px_40px_rgba(16,185,129,0.08)]'
                          : 'border-rose-300/50 bg-rose-400/[0.13] shadow-[0_0_0_1px_rgba(251,113,133,0.12),0_18px_40px_rgba(225,29,72,0.08)]'
                        : inMonth
                          ? 'border-white/10 bg-white/[0.045] hover:border-white/20 hover:bg-white/[0.075]'
                          : 'border-white/[0.05] bg-white/[0.018]'
                    } ${active ? 'ring-2 ring-cyan-300/70' : ''}`}
                  >
                    <div className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_42%)]" />
                    <div className="relative z-10 flex h-8 items-start justify-between">
                      <span className={`inline-flex h-7 min-w-7 items-center justify-center rounded-lg text-sm font-extrabold leading-none ${active ? 'bg-cyan-300 text-cyan-950' : inMonth ? 'text-slate-200' : 'text-slate-600'}`}>
                        {format(day, 'dd')}
                      </span>
                      {hasTrades && (
                        <div className={`grid h-7 w-7 place-items-center rounded-lg ${positive ? 'bg-emerald-300/20 text-emerald-200' : 'bg-rose-300/20 text-rose-200'}`}>
                          <CalendarDays className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>

                    {hasTrades && (
                      <div className="relative z-10 mt-auto pt-4">
                        <div className={`font-mono text-[19px] font-black leading-none tracking-tight ${positive ? 'text-emerald-200' : 'text-rose-200'}`}>
                          {compactMoney(pnl)}
                        </div>
                        <div className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-[11px] font-extrabold leading-none ${positive ? 'bg-emerald-300 text-emerald-950' : 'bg-rose-300 text-rose-950'}`}>
                          {dayTrades.length} trades
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-[52px]">
              <div className="grid gap-3">
                {weekStats.map((week) => {
                  const positive = week.pnl >= 0;
                  return (
                    <div key={week.label} className="flex min-h-32 flex-col justify-center rounded-2xl border border-white/10 bg-white/[0.055] p-4 shadow-sm">
                      <div className="text-xs font-extrabold text-slate-400">{week.label}</div>
                      <div className={`mt-2 font-mono text-xl font-black ${positive ? 'text-emerald-300' : 'text-rose-300'}`}>{compactMoney(week.pnl)}</div>
                      <div className="mt-3 w-fit rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-slate-300">{week.trades} trades</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {isLoading && <div className="py-10 text-center text-sm text-slate-400">Ачааллаж байна...</div>}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <section className="rounded-[24px] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/10 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-white">Сонгосон өдрийн арилжаа</h2>
              <p className="text-xs font-semibold text-slate-400">{format(selectedDate, 'yyyy.MM.dd')}</p>
            </div>
            <button
              onClick={() => openCreate(selectedDate)}
              className="rounded-xl border border-emerald-300/30 bg-emerald-300/10 px-3 py-2 text-xs font-extrabold text-emerald-200 hover:bg-emerald-300/15"
            >
              Нэмэх
            </button>
          </div>

          {selectedTrades.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 py-12 text-center text-sm text-slate-400">
              Энэ өдөр арилжаа бүртгэгдээгүй байна.
            </div>
          ) : (
            <div className="space-y-3">
              {selectedTrades.map((trade) => (
                <div key={trade.id} className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/35 p-4 md:grid-cols-[1fr_auto]">
                  <div className="grid gap-3 md:grid-cols-5">
                    <div>
                      <div className="font-mono text-sm font-black text-white">{trade.pair}</div>
                      <div className={`mt-1 w-fit rounded-full px-2 py-0.5 text-[10px] font-black ${trade.direction === 'BUY' ? 'bg-emerald-300 text-emerald-950' : 'bg-rose-300 text-rose-950'}`}>
                        {trade.direction}
                      </div>
                    </div>
                    <Metric label="Entry" value={trade.entryPrice} />
                    <Metric label="Exit" value={trade.exitPrice || '-'} />
                    <Metric label="Lot" value={trade.lotSize} />
                    <div>
                      <div className="text-xs font-semibold text-slate-500">P&L</div>
                      <div className={`mt-1 font-mono text-sm font-black ${Number(trade.pnl || 0) >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {trade.pnl !== null ? formatPnL(trade.pnl) : '-'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 justify-self-end">
                    <button onClick={() => openEdit(trade)} className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-white/10 hover:text-white" title="Засах">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => deleteMutation.mutate(trade.id)} className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-rose-400/10 hover:text-rose-300" title="Устгах">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[24px] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/10 backdrop-blur-xl">
          <h2 className="font-display text-lg font-bold text-white">Сарын товч</h2>
          <div className="mt-4 space-y-3">
            <SummaryRow label="Нийт P&L" value={formatPnL(monthStats.totalPnL)} positive={monthPositive} />
            <SummaryRow label="Арилжаа" value={monthStats.totalTrades} />
            <SummaryRow label="Win rate" value={`${monthStats.winRate}%`} />
          </div>
        </section>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-md sm:p-5">
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white text-slate-900 shadow-2xl ring-1 ring-white/30 animate-slide-up">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">Trade journal</p>
                <h2 className="font-display text-xl font-black">{editing ? 'Арилжаа засах' : 'Арилжаа нэмэх'}</h2>
              </div>
              <button onClick={closeForm} className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(submitTrade)} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
              <div className="grid gap-3.5 md:grid-cols-2">
                <Field label="Валютын пар *">
                  <select {...register('pair', { required: true })} className={inputCls}>
                    {FOREX_PAIRS.map((pair) => <option key={pair} value={pair}>{pair}</option>)}
                  </select>
                </Field>
                <Field label="Чиглэл *">
                  <select {...register('direction', { required: true })} className={inputCls}>
                    <option value="BUY">BUY (Авах)</option>
                    <option value="SELL">SELL (Зарах)</option>
                  </select>
                </Field>
                <Field label="Оролтын үнэ *">
                  <input {...register('entryPrice', { required: true })} type="number" step="0.00001" placeholder="1.08500" className={inputCls} />
                </Field>
                <Field label="Гаралтын үнэ">
                  <input {...register('exitPrice')} type="number" step="0.00001" placeholder="1.09000" className={inputCls} />
                </Field>
                <Field label="Stop Loss">
                  <input {...register('stopLoss')} type="number" step="0.00001" className={inputCls} />
                </Field>
                <Field label="Take Profit">
                  <input {...register('takeProfit')} type="number" step="0.00001" className={inputCls} />
                </Field>
                <Field label="Лот хэмжээ *">
                  <input {...register('lotSize', { required: true })} type="number" step="0.01" placeholder="0.10" className={inputCls} />
                </Field>
                <Field label="Комисс (USD)">
                  <input {...register('commission')} type="number" step="0.01" defaultValue={0} className={inputCls} />
                </Field>
                <Field label="Нээсэн огноо *">
                  <div className={dateTimeRow}>
                    <input {...register('openedAtDate', { required: true })} type="date" className={inputCls} />
                    <input {...register('openedAtTime', { required: true })} type="time" className={inputCls} />
                  </div>
                </Field>
                <Field label="Хаасан огноо">
                  <div className={dateTimeRow}>
                    <input {...register('closedAtDate')} type="date" className={inputCls} />
                    <input {...register('closedAtTime')} type="time" className={inputCls} />
                  </div>
                </Field>
                <Field label="Стратеги" className="md:col-span-2">
                  <select {...register('strategyId')} className={inputCls}>
                    <option value="">- Стратеги сонгох -</option>
                    {strategiesData?.strategies?.map((strategy) => <option key={strategy.id} value={strategy.id}>{strategy.name}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="Тэмдэглэл">
                <textarea {...register('notes')} rows={3} placeholder="Арилжааны шалтгаан, дүн шинжилгээ..." className={`${inputCls} h-auto min-h-24 resize-none py-3 leading-6`} />
              </Field>
              </div>

              <div className="grid shrink-0 gap-3 border-t border-slate-200 bg-slate-50/80 px-5 py-4 sm:grid-cols-2 sm:px-6">
                <button type="button" onClick={closeForm} className="rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
                  Болих
                </button>
                <button type="submit" disabled={createMutation.isPending} className="rounded-xl bg-slate-950 py-3 text-sm font-bold text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800 disabled:opacity-50">
                  {createMutation.isPending ? 'Хадгалж байна...' : editing ? 'Хадгалах' : 'Нэмэх'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function HeroStat({ label, value, positive }) {
  const valueClass = positive === undefined ? 'text-white' : positive ? 'text-emerald-200' : 'text-rose-200';
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
      <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-2 font-mono text-xl font-black ${valueClass}`}>{value}</div>
    </div>
  );
}

function Field({ label, children, className = '' }) {
  return (
    <div className={className}>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className="mt-1 font-mono text-sm font-bold text-slate-300">{value}</div>
    </div>
  );
}

function SummaryRow({ label, value, positive }) {
  const valueClass = positive === undefined ? 'text-white' : positive ? 'text-emerald-300' : 'text-rose-300';
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3">
      <span className="text-sm font-semibold text-slate-400">{label}</span>
      <span className={`font-mono text-sm font-black ${valueClass}`}>{value}</span>
    </div>
  );
}
