// smart-inventory/backend/src/controllers/alertController.js
const prisma = require('../config/database');

const getAlerts = async (req, res, next) => {
  try {
    const alerts = await prisma.alert.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ alerts });
  } catch (error) { next(error); }
};

const createAlert = async (req, res, next) => {
  try {
    const { pair, alertType, targetPrice, message } = req.body;
    const alert = await prisma.alert.create({
      data: {
        userId: req.user.id,
        pair, alertType,
        targetPrice: parseFloat(targetPrice),
        message: message || null,
      },
    });
    res.status(201).json({ message: 'Alert үүслээ!', alert });
  } catch (error) { next(error); }
};

const updateAlert = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.alert.findFirst({ where: { id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Alert олдсонгүй.' });

    const alert = await prisma.alert.update({
      where: { id },
      data: {
        isActive: req.body.isActive,
        targetPrice: req.body.targetPrice ? parseFloat(req.body.targetPrice) : undefined,
        message: req.body.message,
      },
    });
    res.json({ message: 'Alert шинэчлэгдлээ', alert });
  } catch (error) { next(error); }
};

const deleteAlert = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.alert.findFirst({ where: { id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Alert олдсонгүй.' });
    await prisma.alert.delete({ where: { id } });
    res.json({ message: 'Alert устгагдлаа.' });
  } catch (error) { next(error); }
};

// Үнэ шалгах (WebSocket эсвэл polling-д ашиглагдана)
const checkAlerts = async (req, res, next) => {
  try {
    const { prices } = req.body; // { "EUR/USD": 1.0850, ... }

    const activeAlerts = await prisma.alert.findMany({
      where: { userId: req.user.id, isActive: true, isTriggered: false },
    });

    const triggered = [];
    for (const alert of activeAlerts) {
      const currentPrice = prices[alert.pair];
      if (!currentPrice) continue;

      let shouldTrigger = false;
      if (alert.alertType === 'PRICE_ABOVE' && currentPrice >= alert.targetPrice) shouldTrigger = true;
      if (alert.alertType === 'PRICE_BELOW' && currentPrice <= alert.targetPrice) shouldTrigger = true;

      if (shouldTrigger) {
        await prisma.alert.update({
          where: { id: alert.id },
          data: { isTriggered: true, triggeredAt: new Date(), currentPrice },
        });
        triggered.push({ ...alert, currentPrice });
      }
    }

    res.json({ checked: activeAlerts.length, triggered: triggered.length, triggeredAlerts: triggered });
  } catch (error) { next(error); }
};

module.exports = { getAlerts, createAlert, updateAlert, deleteAlert, checkAlerts };
