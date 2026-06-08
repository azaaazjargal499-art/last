require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { errorHandler, notFound } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const authRoutes = require('./routes/auth');
const tradeRoutes = require('./routes/trades');
const alertRoutes = require('./routes/alerts');
const riskRoutes = require('./routes/risk');
const analyticsRoutes = require('./routes/analytics');
const strategyRoutes = require('./routes/strategies');
const aiRoutes = require('./routes/ai');
const adminRoutes = require('./routes/admin');
const lessonRoutes = require('./routes/lessons');
const marketRoutes = require('./routes/market');
const brokerRoutes = require('./routes/broker');
const eaRoutes = require('./routes/ea');

const app = express();

app.use(helmet());

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()).filter(Boolean)
  : [process.env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:3001'].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  credentials: true,
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 2000,
  skip: (req) => process.env.NODE_ENV !== 'production' && req.method === 'GET',
  message: { error: 'Хэт олон хүсэлт илгээлээ. 15 минутын дараа дахин оролдоно уу.' },
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const uploadsFolder = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsFolder));

app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Smart Inventory API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Smart Inventory API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/strategies', strategyRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/broker', brokerRoutes);
app.use('/api/ea', eaRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`Smart Inventory API running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use. Stop the existing backend process or set a different PORT in .env.`);
    process.exit(1);
  }

  throw error;
});

module.exports = app;
