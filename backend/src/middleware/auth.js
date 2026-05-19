// smart-inventory/backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

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
      select: { id: true, email: true, username: true, balance: true, riskPerTrade: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Хэрэглэгч олдсонгүй.' });
    }

    req.user = user;
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

module.exports = { protect };
