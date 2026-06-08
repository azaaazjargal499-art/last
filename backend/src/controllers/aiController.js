// smart-inventory/backend/src/controllers/aiController.js
const prisma = require('../config/database');

const PLAN_DETAILS = {
  BASIC: { limit: 10 },
  PRO: { limit: 50 },
  PREMIUM: { limit: null },
};

const normalizePlan = (plan) => String(plan || '').trim().toUpperCase();
const money = (value) => `${Number(value || 0).toFixed(2)} USD`;

const getUsageWindowStart = (subscription) => subscription.currentPeriodStart || new Date(new Date().getFullYear(), new Date().getMonth(), 1);

const getUsage = async (userId, subscription) => {
  const used = await prisma.aIAnalysis.count({
    where: {
      userId,
      createdAt: { gte: getUsageWindowStart(subscription) },
    },
  });
  const limit = PLAN_DETAILS[subscription.plan]?.limit ?? null;

  return {
    usageLimit: limit,
    usageUsed: used,
    usageRemaining: limit === null ? null : Math.max(limit - used, 0),
  };
};

const ensureCanAnalyze = async (userId) => {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription || subscription.status !== 'ACTIVE') {
    const error = new Error('AI шинжилгээ хийхийн тулд AI эрх сонгоно уу.');
    error.statusCode = 403;
    throw error;
  }

  const usage = await getUsage(userId, subscription);
  if (usage.usageLimit !== null && usage.usageUsed >= usage.usageLimit) {
    const error = new Error(`${subscription.plan} эрхийн сарын ${usage.usageLimit} шинжилгээний лимит дууссан байна.`);
    error.statusCode = 403;
    throw error;
  }

  return { subscription, usage };
};

const isProviderUnavailable = (error) => [401, 403, 429, 500, 502, 503, 504].includes(error.statusCode);

const buildTradeFallbackAnalysis = (trades, patternSummary) => {
  const totalTrades = trades.length;
  const wins = trades.filter((trade) => (trade.pnl || 0) > 0);
  const losses = trades.filter((trade) => (trade.pnl || 0) < 0);
  const totalPnl = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  const avgWin = wins.length ? wins.reduce((sum, trade) => sum + (trade.pnl || 0), 0) / wins.length : 0;
  const avgLoss = losses.length ? losses.reduce((sum, trade) => sum + Math.abs(trade.pnl || 0), 0) / losses.length : 0;
  const winRate = totalTrades ? (wins.length / totalTrades) * 100 : 0;

  const byPair = trades.reduce((acc, trade) => {
    acc[trade.pair] = acc[trade.pair] || { count: 0, pnl: 0 };
    acc[trade.pair].count += 1;
    acc[trade.pair].pnl += trade.pnl || 0;
    return acc;
  }, {});

  const pairRows = Object.entries(byPair)
    .sort((a, b) => b[1].pnl - a[1].pnl)
    .slice(0, 5)
    .map(([pair, stats]) => `- ${pair}: ${stats.count} арилжаа, нийт ${money(stats.pnl)}`)
    .join('\n') || '- Валютын парын мэдээлэл хангалтгүй байна.';

  const riskNote = avgLoss > avgWin && wins.length
    ? 'Дундаж алдагдал дундаж ашгаас өндөр байна. Stop loss болон position size-аа багасгаж, ашигтай setup дээр reward/risk харьцаагаа сайжруулах шаардлагатай.'
    : 'Дундаж ашиг алдагдлаас боломжийн түвшинд байна. Энэ давуу талаа хадгалахын тулд ижил setup-үүдээ тогтвортой давтах хэрэгтэй.';

  return `AI шинжилгээ (local fallback)

Гадаад AI provider түр ажиллахгүй байгаа тул таны арилжааны дата дээр суурилсан автомат шинжилгээ үүсгэлээ.

1. Ерөнхий үнэлгээ
- Нийт шинжилсэн арилжаа: ${totalTrades}
- Win rate: ${winRate.toFixed(1)}%
- Нийт ашиг/алдагдал: ${money(totalPnl)}
- Дундаж ашиг: ${money(avgWin)}
- Дундаж алдагдал: ${money(avgLoss)}

2. Давуу тал ба сул тал
${totalPnl >= 0
  ? '- Нийт үр дүн эерэг байна. Давуу setup-үүдээ тэмдэглэж, давтамжтай ашиглах боломжтой.'
  : '- Нийт үр дүн сөрөг байна. Алдагдалтай setup, цаг, pair-уудаа түр багасгаж шалгах хэрэгтэй.'}
- ${riskNote}

3. Pair-ийн товч зураглал
${pairRows}

4. Цагийн хэв маяг
${patternSummary}

5. Сайжруулах санал
- Орсон шалтгаан, screenshot, exit reason-оо арилжаа бүр дээр тогтмол бөглө.
- Нэг өдөрт авах арилжааны дээд тоог тогтоо.
- Loss streak 2-3 хүрвэл тухайн өдөр арилжаагаа зогсоох дүрэм нэм.
- Хамгийн ашигтай pair болон session дээрээ төвлөрч, сул хэсгээ тусад нь backtest хий.

6. Дараагийн алхам
GROQ_API_KEY valid болсон үед энэ хэсэг илүү дэлгэрэнгүй natural-language AI шинжилгээгээр автоматаар солигдон ажиллана.`;
};

const buildChartFallbackAnalysis = ({ pair, timeframe }) => `Чартын шинжилгээ (local fallback)

Гадаад AI vision provider түр ажиллахгүй байгаа тул зурагнаас candle/pattern автоматаар уншиж чадсангүй. Гэхдээ таны оруулсан мэдээлэл дээр үндэслэн дараах checklist-ийг ашиглаарай.

- Pair: ${pair || 'Тодорхойгүй'}
- Timeframe: ${timeframe || 'Тодорхойгүй'}

Шалгах дараалал:
1. Зах зээлийн чиглэл: higher high / higher low эсвэл lower high / lower low байгаа эсэх.
2. Гол түвшин: хамгийн ойрын support/resistance дээр price rejection гарсан эсэх.
3. Entry баталгаа: candle close, volume/impulse, break-and-retest зэрэг нэгээс олон confirmation шаардах.
4. Stop loss: бүтцийн цаана байрлуулах, санамсаргүй богино SL тавихгүй байх.
5. Take profit: хамгийн ойрын liquidity эсвэл өмнөх swing түвшинтэй тааруулах.
6. Эрсдэл: нэг арилжаанд нийт balance-ийн 1-2%-иас их эрсдэл авахгүй байх.

GROQ_API_KEY valid болсон үед зурагнаас шууд vision analysis авч хадгална.`;

const buildChatFallback = ({ message, hasImage }) => `AI provider одоогоор холбогдоогүй байна.

${hasImage ? 'Зураг ирсэн боловч GROQ_API_KEY тохируулаагүй тул chart-ыг шууд харж шинжилж чадсангүй.' : 'Chart зураг илгээгээгүй байна.'}

Түр зөвлөмж:
- Одоохондоо шинэ оролт бүү яар. WAIT / NO TRADE.
- Дээд timeframe дээр чиглэлээ шалга.
- Entry хийхээс өмнө liquidity sweep, break/retest эсвэл candle close баталгаажуул.
- SL-ээ хамгийн ойрын structure-ийн цаана тавь.
- Нэг арилжаанд balance-ийн 1-2%-иас их эрсдэл авахгүй.

Таны асуулт: ${message || 'хоосон'}`;

const STRATEGY_STACK = [
  'CRT',
  'SMC',
  'QM',
  'Head & Shoulders',
  'ICT',
  'Key Level',
  'Fibonacci Golden Zone',
  'POI',
  'Candle Pattern',
  'Breakout',
  'Chart Pattern',
  'IDM',
  'Liquidity Sweep',
];

const buildFallbackSignal = ({ message, hasImage }) => ({
  bias: 'WAIT',
  probability: 35,
  entryZone: 'Тодорхойгүй',
  stopLoss: 'Тодорхойгүй',
  takeProfits: ['Тодорхойгүй'],
  invalidation: 'Chart-ыг AI vision-р уншиж чадаагүй.',
  summary: hasImage
    ? 'Зураг ирсэн боловч provider ажиллаагүй тул зураг дээр шууд annotation хийж чадсангүй.'
    : 'Chart зураг илгээгээгүй байна.',
  strategies: [
    { name: 'Key Level', verdict: 'neutral', note: 'Дээд timeframe key level шалгах шаардлагатай.' },
    { name: 'Liquidity Sweep', verdict: 'neutral', note: 'Sweep баталгаагүй.' },
  ],
  reasons: [
    'Provider fallback ажилласан.',
    'Оролт хийхээс өмнө candle close баталгаажуул.',
    'SL-ээ structure-ийн цаана байрлуул.',
  ],
  riskNote: 'Нэг арилжаанд balance-ийн 1-2%-иас их эрсдэл авахгүй.',
  annotations: [],
  text: buildChatFallback({ message, hasImage }),
});

const signalToText = (signal) => {
  if (!signal || typeof signal !== 'object') return '';
  const tp = Array.isArray(signal.takeProfits) ? signal.takeProfits.join(', ') : signal.takeProfits;
  const strategies = Array.isArray(signal.strategies)
    ? signal.strategies.map((item) => `- ${item.name}: ${item.verdict}${item.note ? ` — ${item.note}` : ''}`).join('\n')
    : '';
  const reasons = Array.isArray(signal.reasons)
    ? signal.reasons.map((item) => `- ${item}`).join('\n')
    : '';

  return `Bias: ${signal.bias || 'WAIT'} (${signal.probability || 0}%)
Entry zone: ${signal.entryZone || '-'}
Stop loss: ${signal.stopLoss || '-'}
Take profit: ${tp || '-'}

Яагаад:
${reasons}

Strategy checklist:
${strategies}

Эрсдэл: ${signal.riskNote || 'Эрсдэлээ заавал хязгаарла.'}`;
};

const safeParseSignal = (rawContent) => {
  try {
    const parsed = JSON.parse(rawContent);
    return parsed?.signal ? parsed.signal : parsed;
  } catch {
    const match = String(rawContent || '').match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      const parsed = JSON.parse(match[0]);
      return parsed?.signal ? parsed.signal : parsed;
    } catch {
      return null;
    }
  }
};

// Initialize Groq client
let groq = null;
if (process.env.GROQ_API_KEY) {
  groq = {
    chat: {
      completions: {
        create: async (options) => {
          const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(options),
          });

          if (!response.ok) {
            const error = new Error(
              response.status === 401
                ? 'AI API key буруу эсвэл хугацаа дууссан байна. GROQ_API_KEY-ээ шинэчлэнэ үү.'
                : `AI үйлчилгээний алдаа: ${response.status} ${response.statusText}`
            );
            error.statusCode = response.status === 401 ? 503 : response.status;
            throw error;
          }

          return await response.json();
        }
      }
    }
  };
}

// ─── GET /api/ai/subscription ───────────────────────────────────────
const getSubscription = async (req, res, next) => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.user.id },
    });

    if (!subscription) {
      return res.json({ subscription: null });
    }

    const usage = await getUsage(req.user.id, subscription);
    res.json({ subscription: { ...subscription, ...usage } });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/ai/subscription ──────────────────────────────────────
const createSubscription = async (req, res, next) => {
  try {
    const plan = normalizePlan(req.body.plan);

    if (!PLAN_DETAILS.hasOwnProperty(plan)) {
      return res.status(400).json({ error: 'Зөв AI эрх сонгоно уу: BASIC, PRO эсвэл PREMIUM.' });
    }

    const existing = await prisma.subscription.findUnique({
      where: { userId: req.user.id },
    });

    if (existing) {
      const subscription = await prisma.subscription.update({
        where: { userId: req.user.id },
        data: {
          plan,
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      const usage = await getUsage(req.user.id, subscription);

      return res.json({
        message: 'AI эрх шинэчлэгдлээ.',
        subscription: { ...subscription, ...usage },
      });
    }

    const subscription = await prisma.subscription.create({
      data: {
        userId: req.user.id,
        plan,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    const usage = await getUsage(req.user.id, subscription);

    res.status(201).json({
      message: 'AI эрх идэвхжлээ.',
      subscription: { ...subscription, ...usage },
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/ai/analyze-trades ────────────────────────────────────
const analyzeTrades = async (req, res, next) => {
  try {
    await ensureCanAnalyze(req.user.id);

    // Get user's recent trades
    const trades = await prisma.trade.findMany({
      where: { userId: req.user.id, status: 'CLOSED' },
      orderBy: { closedAt: 'desc' },
      take: 50,
      include: { strategy: { select: { name: true } } },
    });

    if (trades.length === 0) {
      return res.status(400).json({ error: 'Шинжлэх арилжаа байхгүй байна.' });
    }

    // Prepare data for AI analysis
    const tradeData = trades.map(t => ({
      pair: t.pair,
      direction: t.direction,
      entryPrice: t.entryPrice,
      exitPrice: t.exitPrice,
      pnl: t.pnl,
      pnlPercent: t.pnlPercent,
      strategy: t.strategy?.name,
      openedAt: t.openedAt,
      closedAt: t.closedAt,
    }));

    const sessions = trades.reduce((acc, trade) => {
      const date = new Date(trade.openedAt);
      const dow = date.toLocaleDateString('en-US', { weekday: 'long' });
      const hour = date.getHours();
      const session = hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening';
      const key = `${dow} ${session}`;
      acc[key] = acc[key] || { pnl: 0, count: 0 };
      acc[key].pnl += trade.pnl || 0;
      acc[key].count += 1;
      return acc;
    }, {});

    const sessionPatterns = Object.entries(sessions)
      .map(([label, stats]) => ({ label, pnl: stats.pnl, count: stats.count }))
      .sort((a, b) => a.pnl - b.pnl);

    const worstSession = sessionPatterns[0];
    const bestSession = sessionPatterns[sessionPatterns.length - 1];
    const patternSummary = `Таны арилжаануудын хамгийн муу хугацаа нь ${worstSession?.label || 'тодорхойгүй'} (${worstSession?.count || 0} арилжаа, ${worstSession?.pnl?.toFixed(2) || 0} USD) бөгөөд хамгийн сайн хугацаа нь ${bestSession?.label || 'тодорхойгүй'} (${bestSession?.count || 0} арилжаа, ${bestSession?.pnl?.toFixed(2) || 0} USD) байна.`;

    let analysis;
    let provider = 'GROQ';

    if (!groq) {
      provider = 'LOCAL';
      analysis = buildTradeFallbackAnalysis(trades, patternSummary);
    } else {
      try {
        const completion = await groq.chat.completions.create({
          model: "llama3-8b-8192",
          messages: [
            {
              role: "system",
              content: `Та Forex арилжааны мэргэжилтэн AI туслаг юм. Хэрэглэгчийн арилжааны түүхийг шинжилж, дэлгэрэнгүй зөвлөгөө өгнө үү.

Зөвлөгөөний бүтэц:
1. Ерөнхий үнэлгээ - амжилттай/амжилтгүй байдал
2. Давуу тал ба сул тал
3. Стратегийн шинжилгээ
4. Эрсдэлийн үнэлгээ
5. Сайжруулах санал
6. Ирээдүйн зөвлөгөө

Монгол хэлээр хариулна уу.`
            },
            {
              role: "user",
              content: `Миний сүүлийн 50 арилжааны мэдээлэл: ${JSON.stringify(tradeData, null, 2)}

Тодорхойлсон хэв маяг: ${patternSummary}

Эдгээр арилжааг шинжилж, дэлгэрэнгүй зөвлөгөө өгөөч.`
            }
          ],
          max_tokens: 2000,
        });

        analysis = completion.choices[0].message.content;
      } catch (error) {
        if (!isProviderUnavailable(error)) throw error;
        provider = 'LOCAL';
        analysis = buildTradeFallbackAnalysis(trades, patternSummary);
      }
    }

    // Save analysis to database
    const aiAnalysis = await prisma.aIAnalysis.create({
      data: {
        userId: req.user.id,
        type: 'TRADE_ANALYSIS',
        title: 'Арилжааны түүхийн шинжилгээ',
        content: analysis,
        tradeIds: trades.map(t => t.id),
      },
    });

    res.json({
      analysis: aiAnalysis,
      content: analysis,
      provider,
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/ai/analyze-chart ─────────────────────────────────────
const analyzeChart = async (req, res, next) => {
  try {
    await ensureCanAnalyze(req.user.id);

    const { imageUrl, pair, timeframe } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Зураг оруулна уу.' });
    }

    let analysis;
    let provider = 'GROQ';

    if (!groq) {
      provider = 'LOCAL';
      analysis = buildChartFallbackAnalysis({ pair, timeframe });
    } else {
      try {
        const completion = await groq.chat.completions.create({
          model: "llava-v1.5-7b-4096-preview",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Та Forex чартын мэргэжилтэн AI юм. Зургийг шинжилж, арилжааны боломжуудыг тодорхойлно уу.

Валютын пар: ${pair || 'Тодорхойгүй'}
Timeframe: ${timeframe || 'Тодорхойгүй'}

Дараах зүйлсийг шинжилнэ үү:
1. Одоогийн чиглэл ба хүч
2. Техник үзүүлэлтүүд (RSI, MACD, боллингер зурвас гэх мэт)
3. Дэмжлэг/эсэргүүцлийн түвшин
4. Арилжааны боломжууд (BUY/SELL)
5. Entry/Stop Loss/Take Profit санал
6. Эрсдэлийн үнэлгээ

Монгол хэлээр дэлгэрэнгүй хариулна уу.`
                },
                {
                  type: "image_url",
                  image_url: {
                    url: imageUrl,
                  },
                },
              ],
            },
          ],
          max_tokens: 2000,
        });

        analysis = completion.choices[0].message.content;
      } catch (error) {
        if (!isProviderUnavailable(error)) throw error;
        provider = 'LOCAL';
        analysis = buildChartFallbackAnalysis({ pair, timeframe });
      }
    }

    // Parse recommendations from analysis (simplified)
    const recommendations = {
      direction: analysis.includes('BUY') && !analysis.includes('SELL') ? 'BUY' :
                 analysis.includes('SELL') && !analysis.includes('BUY') ? 'SELL' : 'HOLD',
      confidence: analysis.includes('өндөр') ? 'HIGH' : analysis.includes('дунд') ? 'MEDIUM' : 'LOW',
    };

    // Save analysis to database
    const aiAnalysis = await prisma.aIAnalysis.create({
      data: {
        userId: req.user.id,
        type: 'CHART_ANALYSIS',
        title: `${pair || 'Forex'} чартын шинжилгээ`,
        content: analysis,
        imageUrl,
        recommendations,
      },
    });

    res.json({
      analysis: aiAnalysis,
      content: analysis,
      recommendations,
      provider,
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/ai/chat ───────────────────────────────────────────────
const chat = async (req, res, next) => {
  try {
    const { message = '', imageUrl = '', pair = '', timeframe = '' } = req.body;
    const cleanMessage = String(message || '').trim();
    const cleanImageUrl = String(imageUrl || '').trim();

    if (!cleanMessage && !cleanImageUrl) {
      return res.status(400).json({ error: 'Асуулт эсвэл chart зураг оруулна уу.' });
    }

    let content;
    let signal;
    let provider = 'GROQ';

    if (!groq) {
      provider = 'LOCAL';
      signal = buildFallbackSignal({ message: cleanMessage, hasImage: Boolean(cleanImageUrl) });
      content = signal.text;
    } else {
      try {
        const userContent = [
          {
            type: 'text',
            text: `Хэрэглэгчийн асуулт: ${cleanMessage || 'Chart зураг дээр signal шинжилгээ хий.'}

Pair: ${pair || 'тодорхойгүй'}
Timeframe: ${timeframe || 'тодорхойгүй'}
Strategy stack: ${STRATEGY_STACK.join(', ')}

Chart дээрх setup-ийг эдгээр strategy-гаар шүүж, response-оо зөвхөн JSON object хэлбэрээр буцаа.`,
          },
        ];

        if (cleanImageUrl) {
          userContent.push({
            type: 'image_url',
            image_url: { url: cleanImageUrl },
          });
        }

        const completion = await groq.chat.completions.create({
          model: process.env.GROQ_VISION_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct',
          messages: [
            {
              role: 'system',
              content: `Чи forex/crypto chart дээр CRT, SMC, QM, Head & Shoulders, ICT, Key Level, Fibonacci Golden Zone, POI, Candle Pattern, Breakout, Chart Pattern, IDM, Liquidity Sweep аргачлалаар signal scenario гаргадаг AI.

Зорилго:
- Chart зураг дээр trend, market structure, key level, liquidity, POI, order block/FVG байж болох zone, Fibonacci golden zone, breakout/retest, candle confirmation, chart pattern, IDM/BOS/CHoCH, sweep зэргийг үнэл.
- BUY / SELL / WAIT bias өг. Setup хангалтгүй бол WAIT.
- BUY setup: stopLoss нь entryZone-оос ЗААВАЛ доод price-д байна, chart annotation дээр entryZone-оос доор (larger y) зурагдана. takeProfits нь entryZone-оос дээш price-д байна, annotation дээр entryZone-оос дээр (smaller y) зурагдана.
- SELL setup: stopLoss нь entryZone-оос ЗААВАЛ дээд price-д байна, annotation дээр entryZone-оос дээр (smaller y) зурагдана. takeProfits нь entryZone-оос доош price-д байна, annotation дээр entryZone-оос доор (larger y) зурагдана.
- Хэрэв price bullish entry/POI zone-оо доош хүчтэй эвдээд reclaim хийгээгүй байвал BUY гэж бүү өг. WAIT эсвэл SELL scenario гэж үнэл.
- Хэрэв price bearish entry/POI zone-оо дээш хүчтэй эвдээд reclaim хийгээгүй байвал SELL гэж бүү өг. WAIT эсвэл BUY scenario гэж үнэл.
- Probability нь "явах магадлал" биш, strategy checklist confidence юм. 30-85 хооронд бодитой өг. 90+ бараг бүү өг.
- Баталгаатай ашиг амлахгүй. Зөвхөн chart-based scenario.
- Текст бүгд Монгол хэлээр, богино тодорхой.

ЗӨВХӨН valid JSON буцаа. Markdown бүү хэрэглэ.
Schema:
{
  "bias": "BUY" | "SELL" | "WAIT",
  "probability": number,
  "entryZone": "text",
  "stopLoss": "text",
  "takeProfits": ["text"],
  "invalidation": "text",
  "summary": "1-2 sentence Mongolian summary",
  "strategies": [{"name":"SMC","verdict":"bullish|bearish|neutral","note":"short Mongolian note"}],
  "reasons": ["3-5 short Mongolian bullets"],
  "riskNote": "short Mongolian risk note",
  "annotations": [
    {"type":"zone","label":"ENTRY","color":"#3b82f6","x":0.65,"y":0.30,"w":0.18,"h":0.35},
    {"type":"line","label":"SL","color":"#ef4444","x1":0.62,"y1":0.22,"x2":0.90,"y2":0.22},
    {"type":"line","label":"TP1","color":"#10b981","x1":0.62,"y1":0.55,"x2":0.90,"y2":0.55},
    {"type":"label","label":"Liquidity sweep","color":"#f59e0b","x":0.45,"y":0.18}
  ]
}

Annotation coordinates must be normalized 0-1 relative to the image. Use approximate visible positions only.`,
            },
            {
              role: 'user',
              content: userContent,
            },
          ],
          temperature: 0.25,
          max_tokens: 1400,
          response_format: { type: 'json_object' },
        });

        const rawContent = completion.choices?.[0]?.message?.content || '';
        signal = safeParseSignal(rawContent);
        content = signalToText(signal) || rawContent || 'AI хариу хоосон ирлээ.';
      } catch (error) {
        if (!isProviderUnavailable(error)) throw error;
        provider = 'LOCAL';
        signal = buildFallbackSignal({ message: cleanMessage, hasImage: Boolean(cleanImageUrl) });
        content = signal.text;
      }
    }

    res.json({ content, signal, provider });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/ai/analyses ───────────────────────────────────────────
const getAnalyses = async (req, res, next) => {
  try {
    const analyses = await prisma.aIAnalysis.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ analyses });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSubscription,
  createSubscription,
  analyzeTrades,
  analyzeChart,
  chat,
  getAnalyses,
};
