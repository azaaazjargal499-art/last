// smart-inventory/backend/src/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { errorHandler, notFound } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// ─── Routes ───────────────────────────────────────────────────────
const authRoutes      = require('./routes/auth');
const tradeRoutes     = require('./routes/trades');
const alertRoutes     = require('./routes/alerts');
const riskRoutes      = require('./routes/risk');
const analyticsRoutes = require('./routes/analytics');
const strategyRoutes  = require('./routes/strategies');
const aiRoutes        = require('./routes/ai');

const app = express();

// ─── Security Middleware ───────────────────────────────────────────
app.use(helmet());
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:3000', 'http://localhost:3001'];
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// ─── Rate Limiting ─────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100,
  message: { error: 'Хэт олон хүсэлт илгээлээ. 15 минутын дараа дахин оролдоно уу.' },
});
app.use('/api/', limiter);

// ─── Body Parsing ──────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const uploadsFolder = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsFolder));

app.use(morgan('dev'));

// ─── Health Check ──────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Smart Inventory API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ────────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/trades',     tradeRoutes);
app.use('/api/alerts',     alertRoutes);
app.use('/api/risk',       riskRoutes);
app.use('/api/analytics',  analyticsRoutes);
app.use('/api/strategies', strategyRoutes);
app.use('/api/ai',         aiRoutes);

// ─── Error Handling ────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ──────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`🚀 Smart Inventory API running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;
