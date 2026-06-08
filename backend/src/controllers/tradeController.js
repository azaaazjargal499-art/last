// smart-inventory/backend/src/controllers/tradeController.js
const fs = require('fs/promises');
const path = require('path');
const prisma = require('../config/database');
const { calculatePnL, validateTradePrices } = require('../utils/helpers');

const uploadsPath = path.join(__dirname, '../../uploads');
const saveImageData = async (imageData, imageFilename, req) => {
  if (!imageData) return null;
  const match = imageData.match(/^data:(image\/[^;]+);base64,(.+)$/);
  if (!match) return null;
  const [, mimeType, encoded] = match;
  const ext = path.extname(imageFilename || '') || mimeType.split('/').pop();
  const safeExt = ext.replace(/[^a-z0-9]+/gi, '').toLowerCase() || 'png';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;
  await fs.mkdir(uploadsPath, { recursive: true });
  const filePath = path.join(uploadsPath, fileName);
  await fs.writeFile(filePath, Buffer.from(encoded, 'base64'));
  return `/uploads/${fileName}`;
};

// ─── GET /api/trades ───────────────────────────────────────────────
const getTrades = async (req, res, next) => {
  try {
    const { status, pair, source, page = 1, limit = 20, sortBy = 'openedAt', order = 'desc' } = req.query;

    const where = {
      userId: req.user.id,
      ...(status && { status }),
      ...(pair && { pair: { contains: pair } }),
      ...(source === 'broker' && { mt5Ticket: { not: null } }),
    };

    const [trades, total] = await Promise.all([
      prisma.trade.findMany({
        where,
        include: { strategy: { select: { id: true, name: true } } },
        orderBy: { [sortBy]: order },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.trade.count({ where }),
    ]);

    res.json({
      trades,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/trades ──────────────────────────────────────────────
const parseDateValue = (value) => {
  if (!value) return null;
  if (typeof value !== 'string') return value;

  const trimmed = value.trim();
  if (trimmed === '') return null;

  const localDatePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
  const normalized = localDatePattern.test(trimmed) ? `${trimmed}:00` : trimmed;

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
};

const notifyTradeWebhook = async (trade, user) => {
  const message = `📈 *Шинэ арилжаа бүртгэгдлээ!*
*Хэрэглэгч:* ${user.username}
*Пар:* ${trade.pair}
*Чиглэл:* ${trade.direction}
*P&L:* ${trade.pnl !== null ? `${trade.pnl >= 0 ? '+' : '-'}$${Math.abs(trade.pnl).toFixed(2)}` : '---'}
*Стратеги:* ${trade.strategy?.name || 'Тодорхойгүй'}
*Оролт:* ${trade.entryReason || 'Тайлбар алга'}
`; 

  const telegramUrl = process.env.TELEGRAM_WEBHOOK_URL;
  const discordUrl = process.env.DISCORD_WEBHOOK_URL;
  const body = { content: message };

  if (telegramUrl) {
    await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    }).catch(() => null);
  }

  if (discordUrl) {
    await fetch(discordUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => null);
  }
};

const createTrade = async (req, res, next) => {
  try {
    const {
      pair, direction, entryPrice, exitPrice,
      lotSize, stopLoss, takeProfit,
      openedAt, closedAt, strategyId, notes, entryReason, imageUrl, imageData, imageFilename, commission = 0,
    } = req.body;

    let pnl = null;
    let pnlPercent = null;
    let status = exitPrice ? 'CLOSED' : 'OPEN';

    const priceError = validateTradePrices({ pair, entryPrice, exitPrice });
    if (priceError) return res.status(400).json({ error: priceError });

    if (exitPrice) {
      const result = calculatePnL({
        pair, direction, entryPrice: parseFloat(entryPrice),
        exitPrice: parseFloat(exitPrice), lotSize: parseFloat(lotSize),
      });
      pnl = result.pnl - parseFloat(commission);
      pnlPercent = (pnl / req.user.balance) * 100;
    }

    const savedImageUrl = imageData
      ? await saveImageData(imageData, imageFilename, req)
      : null;

    const trade = await prisma.trade.create({
      data: {
        userId: req.user.id,
        pair, direction,
        entryPrice: parseFloat(entryPrice),
        exitPrice: exitPrice ? parseFloat(exitPrice) : null,
        lotSize: parseFloat(lotSize),
        stopLoss: stopLoss ? parseFloat(stopLoss) : null,
        takeProfit: takeProfit ? parseFloat(takeProfit) : null,
        imageUrl: savedImageUrl || imageUrl || null,
        entryReason: entryReason || null,
        openedAt: parseDateValue(openedAt),
        closedAt: parseDateValue(closedAt),
        status, pnl, pnlPercent,
        commission: parseFloat(commission),
        strategyId: strategyId || null,
        notes: notes || null,
      },
      include: { strategy: { select: { id: true, name: true } } },
    });

    if (process.env.TELEGRAM_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL) {
      notifyTradeWebhook(trade, req.user).catch(() => null);
    }

    res.status(201).json({ message: 'Арилжаа бүртгэгдлээ!', trade });
  } catch (error) {
    next(error);
  }
};

// ─── PUT /api/trades/:id ───────────────────────────────────────────
const updateTrade = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.trade.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!existing) return res.status(404).json({ error: 'Арилжаа олдсонгүй.' });

    const updateData = { ...req.body };
    const nextPair = updateData.pair || existing.pair;
    const nextEntryPrice = updateData.entryPrice !== undefined ? updateData.entryPrice : existing.entryPrice;
    const nextExitPrice = updateData.exitPrice !== undefined ? updateData.exitPrice : existing.exitPrice;

    const priceError = validateTradePrices({
      pair: nextPair,
      entryPrice: nextEntryPrice,
      exitPrice: nextExitPrice,
    });
    if (priceError) return res.status(400).json({ error: priceError });

    // PnL дахин тооцох
    if (updateData.exitPrice) {
      const result = calculatePnL({
        pair: nextPair,
        direction: updateData.direction || existing.direction,
        entryPrice: parseFloat(nextEntryPrice),
        exitPrice: parseFloat(updateData.exitPrice),
        lotSize: parseFloat(updateData.lotSize || existing.lotSize),
      });
      updateData.pnl = result.pnl - parseFloat(updateData.commission || existing.commission);
      updateData.pnlPercent = (updateData.pnl / req.user.balance) * 100;
      updateData.status = 'CLOSED';
    }

    const allowedFields = [
      'pair', 'direction', 'entryPrice', 'exitPrice', 'lotSize',
      'stopLoss', 'takeProfit', 'openedAt', 'closedAt', 'status',
      'pnl', 'pnlPercent', 'commission', 'notes', 'strategyId',
      'entryReason', 'imageUrl',
    ];

    const data = {};
    if (updateData.imageData) {
      data.imageUrl = await saveImageData(updateData.imageData, updateData.imageFilename, req);
    }
    allowedFields.forEach((field) => {
      if (field === 'imageData' || field === 'imageFilename') return;
      if (updateData[field] === undefined) return;
      if (updateData[field] === '') {
        if (['strategyId', 'exitPrice', 'stopLoss', 'takeProfit', 'closedAt', 'entryReason', 'imageUrl'].includes(field)) {
          data[field] = null;
        }
        return;
      }

      if (['entryPrice', 'exitPrice', 'lotSize', 'stopLoss', 'takeProfit', 'commission'].includes(field)) {
        const parsed = parseFloat(updateData[field]);
        data[field] = Number.isNaN(parsed) ? null : parsed;
        return;
      }

      if (['openedAt', 'closedAt'].includes(field)) {
        data[field] = parseDateValue(updateData[field]);
        return;
      }

      data[field] = updateData[field];
    });

    const trade = await prisma.trade.update({
      where: { id },
      data,
      include: { strategy: { select: { id: true, name: true } } },
    });

    res.json({ message: 'Арилжаа шинэчлэгдлээ!', trade });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/trades/:id ────────────────────────────────────────
const deleteTrade = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.trade.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!existing) return res.status(404).json({ error: 'Арилжаа олдсонгүй.' });

    await prisma.trade.delete({ where: { id } });
    res.json({ message: 'Арилжаа устгагдлаа.' });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/trades/:id ───────────────────────────────────────────
const getTradeById = async (req, res, next) => {
  try {
    const trade = await prisma.trade.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { strategy: true },
    });
    if (!trade) return res.status(404).json({ error: 'Арилжаа олдсонгүй.' });
    res.json(trade);
  } catch (error) {
    next(error);
  }
};

module.exports = { getTrades, createTrade, updateTrade, deleteTrade, getTradeById };
