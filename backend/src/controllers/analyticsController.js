// smart-inventory/backend/src/controllers/analyticsController.js
const prisma = require('../config/database');

// ─── GET /api/analytics/dashboard ─────────────────────────────────
const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [allTrades, closedTrades, openTrades] = await Promise.all([
      prisma.trade.findMany({ where: { userId } }),
      prisma.trade.findMany({ where: { userId, status: 'CLOSED' } }),
      prisma.trade.findMany({ where: { userId, status: 'OPEN' } }),
    ]);

    const winTrades = closedTrades.filter(t => t.pnl > 0);
    const lossTrades = closedTrades.filter(t => t.pnl <= 0);
    const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const winRate = closedTrades.length > 0
      ? (winTrades.length / closedTrades.length * 100).toFixed(1)
      : 0;

    const avgWin = winTrades.length > 0
      ? winTrades.reduce((s, t) => s + t.pnl, 0) / winTrades.length
      : 0;
    const avgLoss = lossTrades.length > 0
      ? Math.abs(lossTrades.reduce((s, t) => s + t.pnl, 0) / lossTrades.length)
      : 0;

    // Risk:Reward ratio
    const rr = avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : 0;

    res.json({
      summary: {
        totalTrades: allTrades.length,
        openTrades: openTrades.length,
        closedTrades: closedTrades.length,
        totalPnL: parseFloat(totalPnL.toFixed(2)),
        winRate: parseFloat(winRate),
        winTrades: winTrades.length,
        lossTrades: lossTrades.length,
        avgWin: parseFloat(avgWin.toFixed(2)),
        avgLoss: parseFloat(avgLoss.toFixed(2)),
        riskRewardRatio: parseFloat(rr),
        currentBalance: req.user.balance + totalPnL,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/analytics/monthly ───────────────────────────────────
const getMonthlyPnL = async (req, res, next) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    const trades = await prisma.trade.findMany({
      where: {
        userId: req.user.id,
        status: 'CLOSED',
        closedAt: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`),
        },
      },
      select: { pnl: true, closedAt: true },
    });

    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      name: new Date(2024, i).toLocaleString('mn-MN', { month: 'short' }),
      pnl: 0,
      trades: 0,
    }));

    trades.forEach(t => {
      const month = new Date(t.closedAt).getMonth();
      months[month].pnl += t.pnl || 0;
      months[month].trades += 1;
    });

    months.forEach(m => { m.pnl = parseFloat(m.pnl.toFixed(2)); });

    res.json({ year, data: months });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/analytics/pairs ─────────────────────────────────────
const getPairPerformance = async (req, res, next) => {
  try {
    const trades = await prisma.trade.findMany({
      where: { userId: req.user.id, status: 'CLOSED' },
      select: { pair: true, pnl: true, direction: true },
    });

    const pairMap = {};
    trades.forEach(t => {
      if (!pairMap[t.pair]) {
        pairMap[t.pair] = { pair: t.pair, totalPnL: 0, trades: 0, wins: 0 };
      }
      pairMap[t.pair].totalPnL += t.pnl || 0;
      pairMap[t.pair].trades += 1;
      if (t.pnl > 0) pairMap[t.pair].wins += 1;
    });

    const pairs = Object.values(pairMap).map(p => ({
      ...p,
      totalPnL: parseFloat(p.totalPnL.toFixed(2)),
      winRate: parseFloat(((p.wins / p.trades) * 100).toFixed(1)),
    })).sort((a, b) => b.totalPnL - a.totalPnL);

    res.json({ pairs });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/analytics/hourly ────────────────────────────────────
const getHourlyPerformance = async (req, res, next) => {
  try {
    const trades = await prisma.trade.findMany({
      where: { userId: req.user.id, status: 'CLOSED' },
      select: { pnl: true, openedAt: true },
    });

    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      label: `${String(i).padStart(2, '0')}:00`,
      pnl: 0,
      trades: 0,
    }));

    trades.forEach(t => {
      const h = new Date(t.openedAt).getHours();
      hours[h].pnl += t.pnl || 0;
      hours[h].trades += 1;
    });

    hours.forEach(h => { h.pnl = parseFloat(h.pnl.toFixed(2)); });

    res.json({ data: hours });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/analytics/equity-curve ─────────────────────────────
const getEquityCurve = async (req, res, next) => {
  try {
    const trades = await prisma.trade.findMany({
      where: { userId: req.user.id, status: 'CLOSED' },
      select: { pnl: true, closedAt: true },
      orderBy: { closedAt: 'asc' },
    });

    let balance = req.user.balance;
    const curve = [{ date: 'Start', balance }];

    trades.forEach(t => {
      balance += t.pnl || 0;
      curve.push({
        date: new Date(t.closedAt).toLocaleDateString('mn-MN'),
        balance: parseFloat(balance.toFixed(2)),
      });
    });

    res.json({ data: curve });
  } catch (error) {
    next(error);
  }
};

const getDrawdown = async (req, res, next) => {
  try {
    const trades = await prisma.trade.findMany({
      where: { userId: req.user.id, status: 'CLOSED' },
      select: { pnl: true, closedAt: true },
      orderBy: { closedAt: 'asc' },
    });

    let balance = req.user.balance;
    let peak = balance;
    const drawdown = [];
    trades.forEach((trade) => {
      balance += trade.pnl || 0;
      peak = Math.max(peak, balance);
      const dd = peak > 0 ? parseFloat(((balance - peak) / peak * 100).toFixed(2)) : 0;
      drawdown.push({ date: new Date(trade.closedAt).toLocaleDateString('mn-MN'), balance: parseFloat(balance.toFixed(2)), drawdown: dd });
    });

    res.json({ data: drawdown });
  } catch (error) {
    next(error);
  }
};

const getStreaks = async (req, res, next) => {
  try {
    const trades = await prisma.trade.findMany({
      where: { userId: req.user.id, status: 'CLOSED' },
      select: { pnl: true, openedAt: true, closedAt: true },
      orderBy: { closedAt: 'asc' },
    });

    let bestWinStreak = 0;
    let bestLossStreak = 0;
    let currentWinStreak = 0;
    let currentLossStreak = 0;
    let dailyMap = {};
    let hourlyMap = {};

    trades.forEach((trade) => {
      const pnl = trade.pnl || 0;
      if (pnl > 0) {
        currentWinStreak += 1;
        bestWinStreak = Math.max(bestWinStreak, currentWinStreak);
        currentLossStreak = 0;
      } else {
        currentLossStreak += 1;
        bestLossStreak = Math.max(bestLossStreak, currentLossStreak);
        currentWinStreak = 0;
      }

      const day = new Date(trade.closedAt).toLocaleDateString('mn-MN');
      dailyMap[day] = (dailyMap[day] || 0) + pnl;

      const hour = new Date(trade.openedAt).getHours();
      hourlyMap[hour] = (hourlyMap[hour] || 0) + pnl;
    });

    const daily = Object.entries(dailyMap).map(([day, pnl]) => ({ day, pnl }));
    const hourly = Object.entries(hourlyMap).map(([hour, pnl]) => ({ hour: Number(hour), pnl }));
    const bestDay = daily.reduce((prev, curr) => (!prev || curr.pnl > prev.pnl ? curr : prev), null);
    const worstDay = daily.reduce((prev, curr) => (!prev || curr.pnl < prev.pnl ? curr : prev), null);
    const bestHour = hourly.reduce((prev, curr) => (!prev || curr.pnl > prev.pnl ? curr : prev), null);
    const worstHour = hourly.reduce((prev, curr) => (!prev || curr.pnl < prev.pnl ? curr : prev), null);

    res.json({
      bestWinStreak,
      bestLossStreak,
      bestDay,
      worstDay,
      bestHour,
      worstHour,
      daily,
      hourly,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard, getMonthlyPnL, getPairPerformance, getHourlyPerformance, getEquityCurve, getDrawdown, getStreaks };
