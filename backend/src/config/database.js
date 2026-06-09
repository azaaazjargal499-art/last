// smart-inventory/backend/src/config/database.js
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  prisma.$connect()
    .then(() => logger.info('PostgreSQL connected via Prisma'))
    .catch((err) => {
      logger.error('Database connection failed:', err);
      logger.warn('Database is unavailable, but the API will keep running in development.');
    });
} else {
  logger.info('Prisma client initialized; database connection will open on demand.');
}

module.exports = prisma;
