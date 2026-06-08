import { useEffect, useRef, useState } from 'react';
import { BarChart3, Brain, Download, Send, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/api';
import { getUserPairs, TIMEFRAMES } from '@/utils/formatters';
import { useAuthStore } from '@/store/authStore';

const defaultMessages = [
  {
    role: 'assistant',
    content: 'Chart screenshot оруулаад асуултаа бичээрэй. Би strategy checklist, BUY/SELL/WAIT bias, probability, entry, SL, TP, annotation зураг гаргаж өгнө.',
  },
];

const biasStyle = {
  BUY: {
    wrap: 'border-emerald-300/30 bg-emerald-300/10',
    badge: 'bg-emerald-400 text-emerald-950',
    text: 'text-emerald-300',
    bar: 'from-emerald-400 to-cyan-300',
  },
  SELL: {
    wrap: 'border-rose-300/30 bg-rose-300/10',
    badge: 'bg-rose-400 text-rose-950',
    text: 'text-rose-300',
    bar: 'from-rose-400 to-orange-300',
  },
  WAIT: {
    wrap: 'border-amber-300/30 bg-amber-300/10',
    badge: 'bg-amber-300 text-amber-950',
    text: 'text-amber-300',
    bar: 'from-amber-300 to-slate-300',
  },
};

const strategyTone = {
  bullish: 'border-emerald-300/20 bg-emerald-300/10 text-emerald-200',
  bearish: 'border-rose-300/20 bg-rose-300/10 text-rose-200',
  neutral: 'border-slate-300/15 bg-white/[0.06] text-slate-300',
};

const loadImage = (src) => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = reject;
  image.src = src;
});

const resizeImage = async (file) => {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const image = await loadImage(dataUrl);
  const maxWidth = 1600;
  const scale = Math.min(1, maxWidth / image.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.86);
};

const drawAnnotatedImage = async (src, signal) => {
  if (!src || !signal) return null;

  const image = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);

  const rawAnnotations = Array.isArray(signal.annotations) ? signal.annotations : [];
  const entryZone = rawAnnotations.find((item) => (
    item.type === 'zone' && String(item.label || '').toUpperCase().includes('ENTRY')
  ));
  const entryTop = entryZone ? Number(entryZone.y || 0.38) : 0.38;
  const entryBottom = entryZone ? Number(entryZone.y || 0.38) + Number(entryZone.h || 0.16) : 0.54;
  const bias = String(signal.bias || 'WAIT').toUpperCase();
  const clamp01 = (value) => Math.min(Math.max(Number(value) || 0, 0.04), 0.94);
  const sideOffset = 0.075;
  const normalizeLevelY = (item) => {
    const label = String(item.label || '').toUpperCase();
    const currentY = Number(item.y1 ?? item.y2 ?? item.y ?? 0.5);

    if (bias === 'BUY') {
      if (label.includes('SL')) return clamp01(Math.max(currentY, entryBottom + sideOffset));
      if (label.includes('TP')) return clamp01(Math.min(currentY, entryTop - sideOffset));
    }

    if (bias === 'SELL') {
      if (label.includes('SL')) return clamp01(Math.min(currentY, entryTop - sideOffset));
      if (label.includes('TP')) return clamp01(Math.max(currentY, entryBottom + sideOffset));
    }

    return clamp01(currentY);
  };
  const annotations = rawAnnotations.map((item) => {
    if (item.type !== 'line') return item;
    const label = String(item.label || '').toUpperCase();
    if (!label.includes('SL') && !label.includes('TP')) return item;
    const y = normalizeLevelY(item);
    return { ...item, y1: y, y2: y };
  });
  ctx.lineWidth = Math.max(2, Math.round(canvas.width * 0.002));
  ctx.font = `700 ${Math.max(18, Math.round(canvas.width * 0.017))}px Arial`;

  const drawLabel = (text, x, y, color = '#2563eb') => {
    const paddingX = 10;
    const paddingY = 7;
    const metrics = ctx.measureText(text);
    const width = metrics.width + paddingX * 2;
    const height = Math.max(26, Math.round(canvas.width * 0.028));
    const px = Math.min(Math.max(x, 0), canvas.width - width - 2);
    const py = Math.min(Math.max(y - height, 2), canvas.height - height - 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.94;
    ctx.fillRect(px, py, width, height);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, px + paddingX, py + height - paddingY);
  };

  annotations.forEach((item) => {
    const color = item.color || '#2563eb';
    ctx.strokeStyle = color;
    ctx.fillStyle = color;

    if (item.type === 'zone') {
      const x = Number(item.x || 0) * canvas.width;
      const y = Number(item.y || 0) * canvas.height;
      const w = Number(item.w || 0.12) * canvas.width;
      const h = Number(item.h || 0.12) * canvas.height;
      ctx.globalAlpha = 0.18;
      ctx.fillRect(x, y, w, h);
      ctx.globalAlpha = 1;
      ctx.strokeRect(x, y, w, h);
      drawLabel(item.label || 'ZONE', x + 6, y + 4, color);
      return;
    }

    if (item.type === 'line') {
      const x1 = Number(item.x1 || 0) * canvas.width;
      const y1 = Number(item.y1 || 0) * canvas.height;
      const x2 = Number(item.x2 || 1) * canvas.width;
      const y2 = Number(item.y2 || item.y1 || 0) * canvas.height;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      drawLabel(item.label || 'LEVEL', x2 - canvas.width * 0.11, y2 - 8, color);
      return;
    }

    const x = Number(item.x || 0.5) * canvas.width;
    const y = Number(item.y || 0.5) * canvas.height;
    drawLabel(item.label || 'NOTE', x, y, color);
  });

  const style = biasStyle[signal.bias] || biasStyle.WAIT;
  const badgeColor = signal.bias === 'BUY' ? '#10b981' : signal.bias === 'SELL' ? '#ef4444' : '#f59e0b';
  drawLabel(`${signal.bias || 'WAIT'} ${Math.round(Number(signal.probability || 0))}%`, canvas.width * 0.025, canvas.height * 0.075, badgeColor);
  drawLabel(`ENTRY ${signal.entryZone || '-'}`, canvas.width * 0.025, canvas.height * 0.13, '#2563eb');
  drawLabel(`SL ${signal.stopLoss || '-'}`, canvas.width * 0.025, canvas.height * 0.185, '#ef4444');
  drawLabel(`TP ${(signal.takeProfits || []).join(' / ') || '-'}`, canvas.width * 0.025, canvas.height * 0.24, '#10b981');

  return canvas.toDataURL('image/png');
};

function SignalCard({ signal }) {
  if (!signal) return null;
  const bias = signal.bias || 'WAIT';
  const style = biasStyle[bias] || biasStyle.WAIT;
  const probability = Math.min(Math.max(Number(signal.probability || 0), 0), 100);

  return (
    <div className={`mb-3 rounded-2xl border p-3 ${style.wrap}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-black ${style.badge}`}>{bias}</span>
          <span className={`font-mono text-xl font-black ${style.text}`}>{probability}%</span>
        </div>
        <span className="text-xs font-bold text-slate-400">strategy confidence</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full bg-gradient-to-r ${style.bar}`} style={{ width: `${probability}%` }} />
      </div>
      <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
        <div className="rounded-xl bg-white/[0.06] p-2">
          <div className="font-black text-blue-200">Entry</div>
          <div className="mt-1 font-semibold text-slate-200">{signal.entryZone || '-'}</div>
        </div>
        <div className="rounded-xl bg-white/[0.06] p-2">
          <div className="font-black text-rose-200">SL</div>
          <div className="mt-1 font-semibold text-slate-200">{signal.stopLoss || '-'}</div>
        </div>
        <div className="rounded-xl bg-white/[0.06] p-2">
          <div className="font-black text-emerald-200">TP</div>
          <div className="mt-1 font-semibold text-slate-200">{(signal.takeProfits || []).join(' / ') || '-'}</div>
        </div>
      </div>
      {signal.strategies?.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {signal.strategies.slice(0, 8).map((item, index) => (
            <span key={`${item.name}-${index}`} className={`rounded-full border px-2 py-1 text-[11px] font-black ${strategyTone[item.verdict] || strategyTone.neutral}`}>
              {item.name}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function AIAssistantChat({ compact = false, onClose, initialImage, initialPair, initialTimeframe, initialPrompt }) {
  const { user } = useAuthStore();
  const pairs = getUserPairs(user);
  const [messages, setMessages] = useState(defaultMessages);
  const [input, setInput] = useState('');
  const [pair, setPair] = useState(pairs[0] || 'XAU/USD');
  const [timeframe, setTimeframe] = useState('H1');
  const [imagePayload, setImagePayload] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef(null);
  const initialAppliedRef = useRef(false);

  useEffect(() => {
    if (initialAppliedRef.current || !initialImage) return;
    initialAppliedRef.current = true;
    setImagePayload({ data: initialImage, name: 'TradingView chart capture' });
    if (initialPair) setPair(initialPair);
    if (initialTimeframe) setTimeframe(initialTimeframe);
    setInput(initialPrompt || 'Энэ chart дээр entry санаа, BUY/SELL/WAIT bias, SL/TP богино тодорхой гарга.');
  }, [initialImage, initialPair, initialPrompt, initialTimeframe]);

  const handleImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const resized = await resizeImage(file);
      setImagePayload({ data: resized, name: file.name });
    } catch {
      toast.error('Зураг уншихад алдаа гарлаа.');
    }
  };

  const sendMessage = async (event) => {
    event?.preventDefault();
    const cleanInput = input.trim();
    if (!cleanInput && !imagePayload?.data) {
      toast.error('Асуулт эсвэл chart зураг оруулна уу.');
      return;
    }

    const userMessage = {
      role: 'user',
      content: cleanInput || 'Энэ chart дээр signal шинжилгээ хий.',
      image: imagePayload?.data,
      imageName: imagePayload?.name,
    };

    setMessages((current) => [...current, userMessage]);
    setInput('');
    setImagePayload(null);
    setIsSending(true);

    try {
      const response = await api.post('/ai/chat', {
        message: userMessage.content,
        imageUrl: userMessage.image || '',
        pair,
        timeframe,
      });

      const signal = response.data?.signal;
      const annotatedImage = userMessage.image && signal ? await drawAnnotatedImage(userMessage.image, signal) : null;

      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: response.data?.content || 'AI хариу хоосон ирлээ.',
          provider: response.data?.provider,
          signal,
          annotatedImage,
        },
      ]);
    } catch (error) {
      toast.error(error.response?.data?.error || 'AI чат ажиллахад алдаа гарлаа.');
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: 'Уучлаарай, AI хариу авахад алдаа гарлаа. Дахиад нэг оролдоорой.',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className={`ai-chat-panel flex min-h-0 flex-col overflow-hidden rounded-[24px] border border-white/10 bg-slate-950 shadow-2xl shadow-black/30 ${compact ? 'h-full w-[min(92vw,440px)]' : 'h-[calc(100dvh-8rem)]'}`}>
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/25">
            <Brain className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="truncate font-display text-base font-black text-white">AI Signal Chat</div>
            <div className="truncate text-xs font-semibold text-slate-400">SMC / ICT / CRT / Liquidity strategy</div>
          </div>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-white/10 hover:text-white" aria-label="AI chat хаах">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-2 border-b border-white/10 p-3">
        <select value={pair} onChange={(event) => setPair(event.target.value)} className="h-10 rounded-xl border border-white/10 bg-white/[0.06] px-3 text-sm font-bold text-white outline-none">
          {pairs.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select value={timeframe} onChange={(event) => setTimeframe(event.target.value)} className="h-10 rounded-xl border border-white/10 bg-white/[0.06] px-3 text-sm font-bold text-white outline-none">
          {TIMEFRAMES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 sm:p-4">
        {messages.map((message, index) => {
          const isUser = message.role === 'user';
          return (
            <div key={`${message.role}-${index}`} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[94%] rounded-2xl border px-3.5 py-3 text-sm leading-6 ${isUser ? 'border-blue-400/30 bg-blue-600 text-white' : 'border-white/10 bg-white/[0.06] text-slate-200'}`}>
                {message.image && (
                  <img src={message.image} alt={message.imageName || 'Uploaded chart'} className="mb-3 max-h-44 w-full rounded-xl object-cover" />
                )}
                <SignalCard signal={message.signal} />
                {message.annotatedImage && (
                  <div className="mb-3 overflow-hidden rounded-2xl border border-white/10 bg-white">
                    <img src={message.annotatedImage} alt="AI annotated chart" className="w-full" />
                    <a href={message.annotatedImage} download="ai-chart-analysis.png" className="flex items-center justify-center gap-2 border-t border-slate-200 bg-slate-950 px-3 py-2 text-xs font-black text-white hover:bg-slate-800">
                      <Download className="h-4 w-4" />
                      Annotated зураг татах
                    </a>
                  </div>
                )}
                <div className="whitespace-pre-line">{message.content}</div>
                {message.provider === 'LOCAL' && (
                  <div className="mt-2 rounded-lg bg-amber-300/10 px-2 py-1 text-xs font-bold text-amber-200">
                    Local fallback
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {isSending && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-3.5 py-3 text-sm font-semibold text-slate-300">
              AI strategy checklist ажиллуулж байна...
            </div>
          </div>
        )}
      </div>

      {imagePayload && (
        <div className="shrink-0 border-t border-white/10 px-3 py-2">
          <div className="flex items-center gap-3 rounded-2xl border border-blue-300/25 bg-blue-300/10 p-2">
            <img src={imagePayload.data} alt="Chart preview" className="h-14 w-20 rounded-xl object-cover" />
            <div className="min-w-0 flex-1 truncate text-xs font-bold text-blue-100">{imagePayload.name}</div>
            <button type="button" onClick={() => setImagePayload(null)} className="grid h-8 w-8 place-items-center rounded-lg text-blue-100 hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={sendMessage} className="shrink-0 border-t border-white/10 p-3">
        <div className="flex items-end gap-2">
          <button type="button" onClick={() => fileInputRef.current?.click()} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-slate-300 hover:bg-white/[0.1]" title="Chart зураг оруулах">
            <Upload className="h-5 w-5" />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={1}
            placeholder="Ж: энэ setup дээр buy юу sell үү?"
            className="max-h-28 min-h-11 flex-1 resize-none rounded-xl border border-white/10 bg-white/[0.06] px-3 py-3 text-sm font-semibold text-white outline-none placeholder:text-slate-500 focus:border-blue-300/50"
          />
          <button type="submit" disabled={isSending} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 disabled:opacity-50" title="Илгээх">
            <Send className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-2 flex items-center gap-2 text-[11px] font-semibold text-slate-500">
          <BarChart3 className="h-3.5 w-3.5" />
          CRT, SMC, QM, ICT, Fib, POI, IDM, Liquidity sweep checklist.
        </div>
      </form>
    </div>
  );
}
