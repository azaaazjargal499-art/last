// smart-inventory/backend/src/controllers/strategyController.js
const prisma = require('../config/database');

const getStrategies = async (req, res, next) => {
  try {
    const strategies = await prisma.strategy.findMany({
      where: { userId: req.user.id },
      include: {
        _count: { select: { trades: true } },
        trades: {
          where: { status: 'CLOSED' },
          select: { pnl: true },
        },
      },
    });

    const result = strategies.map(s => {
      const closedTrades = s.trades;
      const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const wins = closedTrades.filter(t => t.pnl > 0).length;
      return {
        id: s.id, name: s.name, description: s.description,
        rules: s.rules, timeframe: s.timeframe, pairs: s.pairs,
        tradeCount: s._count.trades,
        closedTradeCount: closedTrades.length,
        totalPnL: parseFloat(totalPnL.toFixed(2)),
        winRate: closedTrades.length > 0
          ? parseFloat(((wins / closedTrades.length) * 100).toFixed(1))
          : 0,
        createdAt: s.createdAt,
      };
    });

    res.json({ strategies: result });
  } catch (error) { next(error); }
};

const createStrategy = async (req, res, next) => {
  try {
    const { name, description, rules, timeframe, pairs } = req.body;
    const strategy = await prisma.strategy.create({
      data: {
        userId: req.user.id,
        name, description, rules, timeframe,
        pairs: pairs || [],
      },
    });
    res.status(201).json({ message: 'Стратеги үүслээ!', strategy });
  } catch (error) { next(error); }
};

const updateStrategy = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.strategy.findFirst({ where: { id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Стратеги олдсонгүй.' });

    const strategy = await prisma.strategy.update({
      where: { id },
      data: req.body,
    });
    res.json({ message: 'Стратеги шинэчлэгдлээ', strategy });
  } catch (error) { next(error); }
};

const deleteStrategy = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.strategy.findFirst({ where: { id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Стратеги олдсонгүй.' });
    await prisma.strategy.delete({ where: { id } });
    res.json({ message: 'Стратеги устгагдлаа.' });
  } catch (error) { next(error); }
};

module.exports = { getStrategies, createStrategy, updateStrategy, deleteStrategy };
