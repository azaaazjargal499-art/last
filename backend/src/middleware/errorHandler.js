// smart-inventory/backend/src/middleware/errorHandler.js
const logger = require('../utils/logger');

const isDatabaseUnavailable = (err) => (
  err?.code === 'P1001'
  || err?.name === 'PrismaClientInitializationError'
  || /Can't reach database server/i.test(err?.message || '')
);

const notFound = (req, res, next) => {
  const error = new Error(`Route олдсонгүй: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const databaseUnavailable = isDatabaseUnavailable(err);
  const statusCode = databaseUnavailable
    ? 503
    : err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);

  logger.error({
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
  });

  if (databaseUnavailable) {
    return res.status(statusCode).json({
      error: 'Database холбогдоогүй байна. PostgreSQL ажиллаж байгаа эсэх эсвэл backend/.env DATABASE_URL зөв эсэхийг шалгана уу.',
      code: 'DATABASE_UNAVAILABLE',
    });
  }

  res.status(statusCode).json({
    error: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
