import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, Cable, RefreshCw, ShieldCheck, TrendingUp, Unplug } from 'lucide-react';
import toast from 'react-hot-toast';
import { brokerService, tradeService } from '@/services/index';
import { formatCurrency, formatDateTime, formatPnL } from '@/utils/formatters';

const brokers = ['XM', 'Exness', 'IC Markets', 'FBS', 'Pepperstone', 'ForexMN', 'Other'];
const inputCls = 'h-12 w-full rounded-xl border border-white/10 bg-slate-950/35 px-4 text-sm font-bold text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300/50 focus:ring-4 focus:ring-emerald-300/10';

export default function Broker() {
  const qc = useQueryClient();
  const isSyncingRef = useRef(false);
  const [form, setForm] = useState({ broker: 'XM', accountNumber: '', password: '', server: '' });
  const [liveSync, setLiveSync] = useState({ active: false, last: null, error: null });
  const [tradeTab, setTradeTab] = useState('OPEN');

  const { data, isLoading } = useQuery({
    queryKey: ['broker-status'],
    queryFn: brokerService.status,
    refetchInterval: 2000,
  });
  const connection = data?.connection;

  const { data: tradesData } = useQuery({
    queryKey: ['trades', 'broker-live'],
    queryFn: () => tradeService.getAll({ source: 'broker', limit: 100, sortBy: 'syncedAt', order: 'desc' }),
    enabled: Boolean(connection),
    refetchInterval: 2000,
  });

  const refreshTradingData = () => {
    qc.invalidateQueries({ queryKey: ['broker-status'] });
    qc.invalidateQueries({ queryKey: ['trades'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
    qc.invalidateQueries({ queryKey: ['equity'] });
    qc.invalidateQueries({ queryKey: ['monthly'] });
  };

  useEffect(() => {
    if (!connection) return undefined;

    const syncSilently = async () => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;
      setLiveSync((current) => ({ ...current, active: true, error: null }));
      try {
        await brokerService.sync();
        setLiveSync({ active: false, last: new Date().toISOString(), error: null });
        refreshTradingData();
      } catch (error) {
        setLiveSync({
          active: false,
          last: new Date().toISOString(),
          error: error?.response?.data?.error || 'MT5 terminal-оос мэдээлэл авч чадсангүй.',
        });
      } finally {
        isSyncingRef.current = false;
      }
    };

    syncSilently();
    const timer = window.setInterval(syncSilently, 2000);
    return () => window.clearInterval(timer);
  }, [connection?.id]);

  const connectMutation = useMutation({
    mutationFn: brokerService.connect,
    onSuccess: (result) => {
      toast.success(`MT5 холбогдлоо. ${result.sync?.inserted || 0} шинэ trade орлоо.`);
      setForm((current) => ({ ...current, password: '' }));
      refreshTradingData();
    },
    onError: (error) => toast.error(error?.response?.data?.error || 'Broker холболт амжилтгүй боллоо.'),
  });

  const syncMutation = useMutation({
    mutationFn: brokerService.sync,
    onSuccess: (result) => {
      toast.success(`Sync дууслаа: ${result.sync?.positionsCount || 0} positions, ${result.sync?.dealsCount || 0} deals.`);
      refreshTradingData();
    },
    onError: (error) => toast.error(error?.response?.data?.error || 'Sync хийж чадсангүй.'),
  });

  const disconnectMutation = useMutation({
    mutationFn: brokerService.disconnect,
    onSuccess: () => {
      toast.success('Broker салгагдлаа.');
      refreshTradingData();
    },
    onError: (error) => toast.error(error?.response?.data?.error || 'Broker салгаж чадсангүй.'),
  });

  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const trades = tradesData?.trades || [];
  const openTrades = trades.filter((trade) => trade.status === 'OPEN');
  const closedTrades = trades.filter((trade) => trade.status === 'CLOSED');

  return (
    <div className="animate-slide-up space-y-6">
      <section className="rounded-3xl border border-white/10 bg-white/[0.055] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-black text-emerald-200">
              <Cable className="h-4 w-4" />
              MT5 broker sync
            </div>
            <h1 className="mt-4 font-display text-4xl font-black text-white">Broker холболт</h1>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-400">
              Account холбогдсон үед энэ хэсэг MT5 terminal-аас balance, equity, open trade, synced trade мэдээллийг автоматаар шинэчилнэ.
            </p>
          </div>
          <StatusCard connection={connection} isLoading={isLoading} liveSync={liveSync} />
        </div>
      </section>

      {connection ? (
        <ConnectedView
          connection={connection}
          trades={trades}
          openTrades={openTrades}
          closedTrades={closedTrades}
          tradeTab={tradeTab}
          setTradeTab={setTradeTab}
          liveSync={liveSync}
          syncPending={syncMutation.isPending}
          disconnectPending={disconnectMutation.isPending}
          onSync={() => syncMutation.mutate()}
          onDisconnect={() => disconnectMutation.mutate()}
        />
      ) : (
        <ConnectView
          form={form}
          updateForm={updateForm}
          connectPending={connectMutation.isPending}
          onConnect={() => connectMutation.mutate(form)}
        />
      )}
    </div>
  );
}

function ConnectedView({ connection, trades, openTrades, closedTrades, tradeTab, setTradeTab, liveSync, syncPending, disconnectPending, onSync, onDisconnect }) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Balance" value={`${formatCurrency(connection.accountBalance || 0)} ${connection.accountCurrency || 'USD'}`} tone="emerald" />
        <MetricCard label="Equity" value={`${formatCurrency(connection.accountEquity ?? connection.accountBalance ?? 0)} ${connection.accountCurrency || 'USD'}`} tone="cyan" />
        <MetricCard label="Open trades" value={openTrades.length} tone="amber" />
        <MetricCard label="Closed trades" value={closedTrades.length} tone="slate" />
        <MetricCard label="Live sync" value={liveSync.active ? 'SYNCING' : 'ON'} sub={liveSync.last ? formatDateTime(liveSync.last) : 'Waiting...'} tone={liveSync.error ? 'rose' : 'emerald'} />
      </section>

      {liveSync.error && (
        <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm font-bold text-amber-100">
          {liveSync.error}
        </div>
      )}

      <section className="rounded-3xl border border-white/10 bg-white/[0.055] p-6 shadow-xl shadow-black/10 backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black text-white">
              <Activity className="h-5 w-5 text-emerald-300" />
              Live MT5 account
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-400">
              {connection.broker} · {connection.maskedAccountNumber} · {connection.server}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onSync}
              disabled={syncPending}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-black text-white transition hover:bg-white/[0.1] disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${syncPending ? 'animate-spin' : ''}`} />
              Sync now
            </button>
            <button
              type="button"
              onClick={onDisconnect}
              disabled={disconnectPending}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-300/20 bg-rose-300/10 px-5 py-3 text-sm font-black text-rose-200 transition hover:bg-rose-300/15 disabled:opacity-50"
            >
              <Unplug className="h-4 w-4" />
              Disconnect
            </button>
          </div>
        </div>

        <TradeTable
          openTrades={openTrades}
          closedTrades={closedTrades}
          activeTab={tradeTab}
          onTabChange={setTradeTab}
        />
      </section>
    </div>
  );
}

function ConnectView({ form, updateForm, connectPending, onConnect }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.055] p-6 shadow-xl shadow-black/10 backdrop-blur-xl">
      <h2 className="flex items-center gap-2 text-xl font-black text-white">
        <ShieldCheck className="h-5 w-5 text-emerald-300" />
        MT5 account connect
      </h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">
        Broker account-аа нэг удаа холбоно. Password database болон browser storage-д хадгалахгүй.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Broker">
          <select value={form.broker} onChange={(e) => updateForm('broker', e.target.value)} className={inputCls}>
            {brokers.map((item) => <option key={item}>{item}</option>)}
          </select>
        </Field>
        <Field label="Account number">
          <input value={form.accountNumber} onChange={(e) => updateForm('accountNumber', e.target.value)} className={inputCls} placeholder="12345678" />
        </Field>
        <Field label="MT5 password">
          <input value={form.password} onChange={(e) => updateForm('password', e.target.value)} type="password" className={inputCls} placeholder="••••••••" />
        </Field>
        <Field label="Server">
          <input value={form.server} onChange={(e) => updateForm('server', e.target.value)} className={inputCls} placeholder="XMGlobal-MT5 2" />
        </Field>
      </div>

      <button
        type="button"
        onClick={onConnect}
        disabled={connectPending}
        className="mt-5 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
      >
        {connectPending ? 'Connecting...' : 'Connect account'}
      </button>
    </section>
  );
}

function StatusCard({ connection, isLoading, liveSync }) {
  return (
    <div className={`rounded-2xl border px-5 py-4 ${connection ? 'border-emerald-300/25 bg-emerald-300/10' : 'border-white/10 bg-slate-950/35'}`}>
      <div className="text-xs font-black uppercase tracking-wide text-slate-400">Status</div>
      <div className="mt-1 text-xl font-black text-white">{isLoading ? '...' : connection ? connection.status : 'Not connected'}</div>
      {connection && (
        <div className="mt-3 grid gap-2 text-xs font-semibold text-slate-400">
          <div>{connection.broker} · {connection.maskedAccountNumber} · {connection.server}</div>
          <div className="font-mono text-lg font-black text-emerald-200">
            {formatCurrency(connection.accountBalance || 0)} {connection.accountCurrency || 'USD'}
          </div>
          {connection.accountEquity != null && <div>Equity: {formatCurrency(connection.accountEquity)}</div>}
          <div>{liveSync?.active ? 'Real-time syncing...' : `Last sync: ${connection.lastSyncedAt ? formatDateTime(connection.lastSyncedAt) : '-'}`}</div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, sub, tone = 'slate' }) {
  const color = {
    emerald: 'text-emerald-200',
    cyan: 'text-cyan-200',
    amber: 'text-amber-200',
    rose: 'text-rose-200',
    slate: 'text-white',
  }[tone];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-5 shadow-xl shadow-black/10">
      <div className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-2 font-mono text-2xl font-black ${color}`}>{value}</div>
      {sub && <div className="mt-1 text-xs font-bold text-slate-500">{sub}</div>}
    </div>
  );
}

function TradeTable({ openTrades, closedTrades, activeTab, onTabChange }) {
  const trades = activeTab === 'OPEN' ? openTrades : closedTrades;
  const tabs = [
    { id: 'OPEN', label: 'Open trades', count: openTrades.length },
    { id: 'CLOSED', label: 'Closed trades', count: closedTrades.length },
  ];

  const activeEmptyText = activeTab === 'OPEN'
    ? 'MT5 дээр trade open хийхэд энд автоматаар гарч ирнэ.'
    : 'Хаагдсан MT5 trade одоогоор алга.';

  const titleText = activeTab === 'OPEN'
    ? 'Одоо нээлттэй арилжаанууд'
    : 'Хаагдсан арилжаанууд';

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/20">
      <div className="flex flex-col gap-3 border-b border-white/10 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-black text-white">{titleText}</div>
          <div className="mt-0.5 text-xs font-bold text-slate-500">Pair, lot, entry, current/exit, P&L тус тусдаа харагдана.</div>
        </div>
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-slate-950/35 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`rounded-xl px-3 py-2 text-xs font-black transition ${
                activeTab === tab.id
                  ? 'bg-emerald-400 text-slate-950'
                  : 'text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {tab.label} <span className="ml-1 opacity-80">{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {!trades.length ? (
        <div className="m-3 rounded-2xl border border-dashed border-white/10 py-12 text-center text-sm font-bold text-slate-400">
          {activeEmptyText}
        </div>
      ) : (
        <div className="max-h-[420px] overflow-auto">
          <TradeRows trades={trades} />
        </div>
      )}
    </div>
  );
}

function TradeRows({ trades }) {
  if (!trades.length) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-white/10 py-12 text-center text-sm font-bold text-slate-400">
        MT5 дээр trade open хийхэд энд автоматаар гарч ирнэ.
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="sticky top-0 z-10 bg-slate-950 text-left text-xs font-black uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Pair</th>
              <th className="px-4 py-3">Direction</th>
              <th className="px-4 py-3">Lot</th>
              <th className="px-4 py-3">Entry</th>
              <th className="px-4 py-3">Current / Exit</th>
              <th className="px-4 py-3">P&L</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Synced</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {trades.map((trade) => (
              <tr key={trade.id} className="bg-white/[0.025] transition hover:bg-white/[0.055]">
                <td className="px-4 py-3 font-mono font-black text-white">{trade.pair}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-black ${trade.direction === 'BUY' ? 'bg-emerald-300/15 text-emerald-200' : 'bg-rose-300/15 text-rose-200'}`}>
                    {trade.direction}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono font-bold text-slate-200">{trade.lotSize}</td>
                <td className="px-4 py-3 font-mono font-bold text-slate-300">{trade.entryPrice}</td>
                <td className="px-4 py-3 font-mono font-bold text-slate-300">{trade.exitPrice || trade.currentPrice || '-'}</td>
                <td className={`px-4 py-3 font-mono font-black ${trade.pnl >= 0 ? 'text-emerald-200' : 'text-rose-200'}`}>
                  {trade.pnl != null ? formatPnL(trade.pnl) : '-'}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-black ${trade.status === 'OPEN' ? 'bg-blue-300/15 text-blue-200' : 'bg-slate-300/10 text-slate-300'}`}>
                    {trade.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs font-bold text-slate-500">{trade.syncedAt ? formatDateTime(trade.syncedAt) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-300">{label}</span>
      {children}
    </label>
  );
}
