// smart-inventory/backend/src/utils/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed өгөгдөл оруулж байна...');

  // Demo хэрэглэгч
  const hashedPass = await bcrypt.hash('demo1234', 12);
  const user = await prisma.user.upsert({
    where: { email: 'demo@smartinventory.mn' },
    update: {},
    create: {
      email: 'demo@smartinventory.mn',
      username: 'demo_trader',
      password: hashedPass,
      balance: 10000,
      riskPerTrade: 2,
    },
  });
  console.log('✅ Demo хэрэглэгч:', user.email);

  // Стратегиуд
  const strategy1 = await prisma.strategy.create({
    data: {
      userId: user.id,
      name: 'Price Action Breakout',
      description: 'Дэмжлэг/эсэргүүцлийн шугамаас гарах үед орох стратеги',
      timeframe: 'H1',
      pairs: ['EUR/USD', 'GBP/USD', 'USD/JPY'],
      rules: '1. Дэмжлэгийн шугам тодорхой байх\n2. Хэмжээ нэмэгдэж байх\n3. Candlestick баталгаажилт авах',
    },
  });

  const strategy2 = await prisma.strategy.create({
    data: {
      userId: user.id,
      name: 'EMA Crossover',
      description: '21 EMA болон 50 EMA огтлолцох үед орох',
      timeframe: 'H4',
      pairs: ['EUR/USD', 'USD/CHF'],
      rules: '1. 21 EMA 50 EMA-г дээрээс огтлох\n2. RSI 50-аас дээш\n3. Trending зах зээл',
    },
  });

  // Demo арилжаанууд
  const trades = [
    { pair: 'EUR/USD', direction: 'BUY',  entryPrice: 1.08200, exitPrice: 1.08650, lotSize: 0.10, stopLoss: 1.07900, takeProfit: 1.09000, openedAt: new Date('2025-01-05T09:00:00'), closedAt: new Date('2025-01-05T14:30:00'), pnl: 45.00, pnlPercent: 0.45, status: 'CLOSED', strategyId: strategy1.id },
    { pair: 'GBP/USD', direction: 'SELL', entryPrice: 1.27100, exitPrice: 1.26800, lotSize: 0.05, stopLoss: 1.27400, takeProfit: 1.26400, openedAt: new Date('2025-01-07T11:00:00'), closedAt: new Date('2025-01-07T16:00:00'), pnl: 15.00, pnlPercent: 0.15, status: 'CLOSED', strategyId: strategy2.id },
    { pair: 'USD/JPY', direction: 'BUY',  entryPrice: 148.500, exitPrice: 147.900, lotSize: 0.10, stopLoss: 148.000, takeProfit: 149.500, openedAt: new Date('2025-01-10T08:00:00'), closedAt: new Date('2025-01-10T12:00:00'), pnl: -60.00, pnlPercent: -0.60, status: 'CLOSED', strategyId: strategy1.id },
    { pair: 'EUR/USD', direction: 'BUY',  entryPrice: 1.08900, exitPrice: 1.09400, lotSize: 0.10, stopLoss: 1.08600, takeProfit: 1.09800, openedAt: new Date('2025-02-03T09:30:00'), closedAt: new Date('2025-02-03T17:00:00'), pnl: 50.00, pnlPercent: 0.50, status: 'CLOSED', strategyId: strategy1.id },
    { pair: 'XAU/USD', direction: 'BUY',  entryPrice: 2020.00, exitPrice: 2035.00, lotSize: 0.02, stopLoss: 2010.00, takeProfit: 2045.00, openedAt: new Date('2025-02-10T10:00:00'), closedAt: new Date('2025-02-11T09:00:00'), pnl: 30.00, pnlPercent: 0.30, status: 'CLOSED', strategyId: strategy2.id },
    { pair: 'GBP/JPY', direction: 'SELL', entryPrice: 188.500, exitPrice: null, lotSize: 0.05, stopLoss: 189.200, takeProfit: 186.000, openedAt: new Date('2025-03-01T08:00:00'), closedAt: null, pnl: null, pnlPercent: null, status: 'OPEN', strategyId: strategy1.id },
  ];

  for (const trade of trades) {
    await prisma.trade.create({ data: { userId: user.id, ...trade } });
  }
  console.log(`✅ ${trades.length} Demo арилжаа нэмэгдлээ`);

  // Alertууд
  await prisma.alert.createMany({
    data: [
      { userId: user.id, pair: 'EUR/USD', alertType: 'PRICE_ABOVE', targetPrice: 1.09500, message: 'Эсэргүүцлийн шугамд хүрлээ', isActive: true },
      { userId: user.id, pair: 'GBP/USD', alertType: 'PRICE_BELOW', targetPrice: 1.26000, message: 'Дэмжлэгийн шугамд хүрлээ', isActive: true },
      { userId: user.id, pair: 'XAU/USD', alertType: 'PRICE_ABOVE', targetPrice: 2050.00, message: 'Алтны resistance', isActive: true },
    ],
  });
  console.log('✅ 3 Demo alert нэмэгдлээ');

  console.log('\n🎉 Seed амжилттай дууслаа!');
  console.log('📧 Email: demo@smartinventory.mn');
  console.log('🔑 Нууц үг: demo1234');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
