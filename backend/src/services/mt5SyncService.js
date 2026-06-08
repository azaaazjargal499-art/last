const prisma = require('../config/database');
const { normalizeSymbol, parseTradeDate } = require('../utils/mt5');

const finiteNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const buildPnlPercent = (pnl, balance) => {
  const accountBalance = Number(balance);
  return accountBalance > 0 ? Number(((Number(pnl || 0) / accountBalance) * 100).toFixed(2)) : null;
};

const getPositionTicket = (position) => String(position.identifier || position.position_id || position.ticket);
const getDealPositionTicket = (deal) => String(deal.position_id || deal.order || deal.ticket);

const weightedPrice = (deals) => {
  const totalVolume = deals.reduce((sum, deal) => sum + finiteNumber(deal.volume), 0);
  if (totalVolume <= 0) return finiteNumber(deals[0]?.price);
  const total = deals.reduce((sum, deal) => sum + finiteNumber(deal.price) * finiteNumber(deal.volume), 0);
  return Number((total / totalVolume).toFixed(5));
};

const positionToTrade = ({ userId, broker, brokerAccountId, position, balance }) => {
  const openedAt = parseTradeDate(position.time) || new Date();
  const pnl = finiteNumber(position.profit, 0);
  const ticket = getPositionTicket(position);

  return {
    userId,
    broker,
    brokerAccountId,
    mt5Ticket: ticket,
    mt5OrderId: String(position.ticket),
    pair: normalizeSymbol(position.symbol),
    direction: position.type === 'SELL' ? 'SELL' : 'BUY',
    entryPrice: finiteNumber(position.price_open),
    exitPrice: null,
    currentPrice: finiteNumber(position.price_current),
    stopLoss: finiteNumber(position.sl) || null,
    takeProfit: finiteNumber(position.tp) || null,
    lotSize: finiteNumber(position.volume),
    openedAt,
    closedAt: null,
    status: 'OPEN',
    pnl,
    pnlPercent: buildPnlPercent(pnl, balance),
    commission: 0,
    swap: 0,
    syncedAt: new Date(),
  };
};

const groupClosedDeals = (deals) => {
  const tradeDeals = deals
    .filter((deal) => deal.type === 'BUY' || deal.type === 'SELL')
    .filter((deal) => finiteNumber(deal.volume) > 0)
    .sort((a, b) => (parseTradeDate(a.time)?.getTime() || 0) - (parseTradeDate(b.time)?.getTime() || 0));

  const grouped = new Map();
  for (const deal of tradeDeals) {
    const key = getDealPositionTicket(deal);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(deal);
  }

  return Array.from(grouped.entries())
    .map(([ticket, items]) => {
      const entryDeals = items.filter((deal) => Number(deal.entry) === 0);
      const exitDeals = items.filter((deal) => Number(deal.entry) !== 0);
      const firstEntry = entryDeals[0] || items[0];
      const lastDeal = items[items.length - 1];
      const closedAt = parseTradeDate((exitDeals[exitDeals.length - 1] || lastDeal).time) || new Date();

      const pnl = items.reduce((sum, deal) => sum + finiteNumber(deal.profit, 0), 0);
      const commission = items.reduce((sum, deal) => sum + finiteNumber(deal.commission, 0), 0);
      const swap = items.reduce((sum, deal) => sum + finiteNumber(deal.swap, 0), 0);
      const entryVolume = entryDeals.reduce((sum, deal) => sum + finiteNumber(deal.volume), 0);
      const exitVolume = exitDeals.reduce((sum, deal) => sum + finiteNumber(deal.volume), 0);

      const hasExit = exitDeals.length > 0 || Math.abs(pnl) > 0;
      if (!hasExit) return null;

      return {
        ticket,
        order: String(firstEntry.order || firstEntry.ticket),
        symbol: firstEntry.symbol || lastDeal.symbol,
        direction: firstEntry.type === 'SELL' ? 'SELL' : 'BUY',
        entryPrice: weightedPrice(entryDeals.length ? entryDeals : [firstEntry]),
        exitPrice: weightedPrice(exitDeals.length ? exitDeals : [lastDeal]),
        lotSize: Number((entryVolume || exitVolume || finiteNumber(firstEntry.volume)).toFixed(2)),
        openedAt: parseTradeDate(firstEntry.time) || closedAt,
        closedAt,
        pnl,
        commission,
        swap,
      };
    })
    .filter(Boolean);
};

const closedGroupToTrade = ({ userId, broker, brokerAccountId, group, balance }) => ({
  userId,
  broker,
  brokerAccountId,
  mt5Ticket: group.ticket,
  mt5OrderId: group.order,
  pair: normalizeSymbol(group.symbol),
  direction: group.direction,
  entryPrice: group.entryPrice,
  exitPrice: group.exitPrice,
  currentPrice: group.exitPrice,
  lotSize: group.lotSize,
  stopLoss: null,
  takeProfit: null,
  openedAt: group.openedAt,
  closedAt: group.closedAt,
  status: 'CLOSED',
  pnl: Number(group.pnl.toFixed(2)),
  pnlPercent: buildPnlPercent(group.pnl + group.commission + group.swap, balance),
  commission: Number(group.commission.toFixed(2)),
  swap: Number(group.swap.toFixed(2)),
  syncedAt: new Date(),
});

const upsertTrade = async (tx, data) => {
  const existing = await tx.trade.findFirst({
    where: { mt5Ticket: data.mt5Ticket },
    select: { id: true, userId: true },
  });

  if (existing && existing.userId !== data.userId) return { skipped: true };
  if (existing) {
    await tx.trade.update({ where: { id: existing.id }, data });
    return { updated: true };
  }

  await tx.trade.create({ data });
  return { created: true };
};

const saveSyncedTrades = async ({ userId, broker, brokerAccountId, positions = [], deals = [], balance }) => {
  const seenOpenTickets = new Set(positions.map(getPositionTicket));
  const closedGroups = groupClosedDeals(deals).filter((group) => !seenOpenTickets.has(group.ticket));
  const groupedClosedTickets = closedGroups.map((group) => group.ticket);
  const syncTime = new Date();

  return prisma.$transaction(async (tx) => {
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const position of positions) {
      const result = await upsertTrade(tx, positionToTrade({ userId, broker, brokerAccountId, position, balance }));
      if (result.created) inserted += 1;
      else if (result.updated) updated += 1;
      else skipped += 1;
    }

    const staleOpenResult = await tx.trade.updateMany({
      where: {
        userId,
        brokerAccountId,
        status: 'OPEN',
        mt5Ticket: { notIn: Array.from(seenOpenTickets) },
      },
      data: {
        status: 'CLOSED',
        closedAt: syncTime,
        syncedAt: syncTime,
      },
    });

    if (groupedClosedTickets.length > 0) {
      await tx.trade.deleteMany({
        where: {
          userId,
          brokerAccountId,
          status: 'CLOSED',
          mt5Ticket: { notIn: groupedClosedTickets },
        },
      });
    }

    for (const group of closedGroups) {
      const result = await upsertTrade(tx, closedGroupToTrade({ userId, broker, brokerAccountId, group, balance }));
      if (result.created) inserted += 1;
      else if (result.updated) updated += 1;
      else skipped += 1;
    }

    return {
      inserted,
      updated,
      skipped,
      closed: staleOpenResult.count,
      positionsCount: positions.length,
      dealsCount: deals.length,
      groupedClosedCount: closedGroups.length,
    };
  }, { timeout: 30000, maxWait: 10000 });
};

module.exports = { saveSyncedTrades };
