const prisma = require('../config/database');
const { withEffectiveRole } = require('../middleware/auth');

const currentMonthStart = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

const overview = async (req, res, next) => {
  try {
    const [users, trades, activeSubscriptions, aiAnalyses, newUsersThisMonth, subscriptionsByPlan] = await Promise.all([
      prisma.user.count(),
      prisma.trade.count(),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.aIAnalysis.count(),
      prisma.user.count({ where: { createdAt: { gte: currentMonthStart() } } }),
      prisma.subscription.groupBy({
        by: ['plan'],
        _count: { _all: true },
        where: { status: 'ACTIVE' },
      }),
    ]);

    res.json({
      totals: { users, trades, activeSubscriptions, aiAnalyses, newUsersThisMonth },
      subscriptionsByPlan: subscriptionsByPlan.map(row => ({
        plan: row.plan,
        count: row._count._all,
      })),
    });
  } catch (error) {
    next(error);
  }
};

const listUsers = async (req, res, next) => {
  try {
    const search = String(req.query.search || '').trim();
    const users = await prisma.user.findMany({
      where: search
        ? {
            OR: [
              { email: { contains: search, mode: 'insensitive' } },
              { username: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        balance: true,
        createdAt: true,
        subscription: true,
        _count: {
          select: {
            trades: true,
            alerts: true,
            strategies: true,
            aiAnalyses: true,
          },
        },
      },
    });

    res.json({ users: users.map(withEffectiveRole) });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { role, plan, status } = req.body;

    if (role && !['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Зөв role сонгоно уу.' });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: role ? { role } : {},
      select: { id: true, email: true, username: true, role: true },
    });

    if (plan || status) {
      if (!['BASIC', 'PRO', 'PREMIUM'].includes(plan)) {
        return res.status(400).json({ error: 'Зөв plan сонгоно уу: BASIC, PRO, PREMIUM.' });
      }
      if (status && !['ACTIVE', 'CANCELLED', 'PAST_DUE', 'UNPAID'].includes(status)) {
        return res.status(400).json({ error: 'Зөв subscription status сонгоно уу.' });
      }

      await prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          plan,
          status: status || 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        update: {
          plan,
          status: status || 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }

    res.json({ message: 'Хэрэглэгчийн тохиргоо шинэчлэгдлээ.', user: withEffectiveRole(user) });
  } catch (error) {
    next(error);
  }
};

module.exports = { overview, listUsers, updateUser };
