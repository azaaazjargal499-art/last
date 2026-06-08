const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

const getAdminEmails = () => (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(email => email.trim().toLowerCase())
  .filter(Boolean);

const withEffectiveRole = (user) => {
  if (!user) return user;
  const isConfiguredAdmin = getAdminEmails().includes(user.email.toLowerCase());
  return { ...user, role: isConfiguredAdmin ? 'ADMIN' : user.role };
};

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Нэвтрэх шаардлагатай. Token олдсонгүй.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, username: true, role: true, balance: true, riskPerTrade: true, selectedPairs: true, riskRewardPresets: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Хэрэглэгч олдсонгүй.' });
    }

    req.user = withEffectiveRole(user);
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token буруу байна.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token хугацаа дууссан. Дахин нэвтэрнэ үү.' });
    }
    next(error);
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin эрх шаардлагатай.' });
  }
  next();
};

module.exports = { protect, requireAdmin, withEffectiveRole };
