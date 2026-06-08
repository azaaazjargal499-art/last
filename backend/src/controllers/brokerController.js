const prisma = require('../config/database');
const { saveSyncedTrades } = require('../services/mt5SyncService');
const { createApiToken, hashApiToken, maskAccount, normalizeServer, parseTradeDate, normalizeSymbol } = require('../utils/mt5');

const allowedBrokers = ['XM', 'Exness', 'IC Markets', 'FBS', 'Pepperstone', 'ForexMN', 'Other'];

const getBridgeUrl = () => (process.env.MT5_BRIDGE_URL || '').replace(/\/$/, '');

const getActiveConnection = async (req, res, next) => {
  try {
    const connection = await prisma.brokerConnection.findFirst({
      where: { userId: req.user.id, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ connected: Boolean(connection), connection });
  } catch (error) {
    next(error);
  }
};

const connectBroker = async (req, res, next) => {
  try {
    const { broker, accountNumber, password, server } = req.body;

    if (!allowedBrokers.includes(broker) || !String(accountNumber || '').match(/^\d{4,}$/) || !password || !server) {
      return res.status(400).json({ connected: false, error: 'Broker, account number, password эсвэл server дутуу байна.' });
    }

    const bridgeUrl = getBridgeUrl();
    if (!bridgeUrl) {
      return res.status(503).json({ connected: false, error: 'MT5_BRIDGE_URL тохируулаагүй байна.' });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 180000);

    try {
      const response = await fetch(`${bridgeUrl}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ accountNumber: Number(accountNumber), password, server, days: 30 }),
      });

      const data = await response.json().catch(() => ({}));
      const account = data.account;
      if (!response.ok || data.success !== true || !account) {
        await disconnectUserConnections(req.user.id);
        return res.status(response.status === 200 ? 401 : response.status).json({
          connected: false,
          error: data.message || data.error || 'Account number, password эсвэл server буруу байна.',
          code: data.code,
        });
      }

      const login = String(account.login || '');
      if (login !== String(accountNumber) || normalizeServer(account.server || server) !== normalizeServer(server)) {
        await disconnectUserConnections(req.user.id);
        return res.status(409).json({
          connected: false,
          code: 'ACCOUNT_MISMATCH',
          error: `MT5 bridge өөр account дээр attach хийсэн байна. MT5 desktop дээр ${server} / ${accountNumber} account-аараа login хийгээд дахин оролдоно уу.`,
        });
      }

      await disconnectUserConnections(req.user.id);

      const connection = await prisma.brokerConnection.create({
        data: {
          userId: req.user.id,
          broker,
          maskedAccountNumber: maskAccount(accountNumber),
          server,
          accountLogin: login,
          accountName: account.name || null,
          accountBalance: account.balance ?? null,
          accountEquity: account.equity ?? null,
          accountCurrency: account.currency || null,
          accountLeverage: account.leverage ?? null,
          isActive: true,
          lastSyncedAt: new Date(),
          status: 'CONNECTED',
        },
      });

      const sync = await saveSyncedTrades({
        userId: req.user.id,
        broker,
        brokerAccountId: connection.id,
        positions: data.positions || [],
        deals: data.deals || [],
        balance: account.balance || req.user.balance,
      });

      res.json({
        connected: true,
        connection,
        sync,
        accountInfo: account,
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    next(error);
  }
};

const syncBroker = async (req, res, next) => {
  try {
    const bridgeUrl = getBridgeUrl();
    if (!bridgeUrl) return res.status(503).json({ error: 'MT5_BRIDGE_URL тохируулаагүй байна.' });

    const connection = await prisma.brokerConnection.findFirst({
      where: { userId: req.user.id, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    if (!connection) return res.status(404).json({ error: 'Идэвхтэй broker connection олдсонгүй.' });

    const response = await fetch(`${bridgeUrl}/snapshot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days: 2 }),
    });

    const data = await response.json().catch(() => ({}));
    const account = data.account;
    if (!response.ok || data.success !== true || !account?.login) {
      return res.status(response.status === 200 ? 502 : response.status).json({ error: data.message || data.error || 'MT5 snapshot sync амжилтгүй.' });
    }

    const login = String(account.login);
    const loginMatches = connection.accountLogin ? connection.accountLogin === login : connection.maskedAccountNumber === maskAccount(login);
    if (!loginMatches) {
      await prisma.brokerConnection.update({
        where: { id: connection.id },
        data: { status: 'ERROR', lastPingAt: new Date() },
      });
      return res.status(409).json({ error: `MT5 terminal дээр ${login} account байна. Site дээр ${connection.maskedAccountNumber} active байна.` });
    }

    const updatedConnection = await prisma.brokerConnection.update({
      where: { id: connection.id },
      data: {
        accountLogin: login,
        accountName: account.name || null,
        accountBalance: account.balance ?? null,
        accountEquity: account.equity ?? null,
        accountCurrency: account.currency || null,
        accountLeverage: account.leverage ?? null,
        status: 'CONNECTED',
        lastSyncedAt: new Date(),
        lastPingAt: new Date(),
      },
    });

    const sync = await saveSyncedTrades({
      userId: req.user.id,
      broker: updatedConnection.broker,
      brokerAccountId: updatedConnection.id,
      positions: data.positions || [],
      deals: data.deals || [],
      balance: account.balance || req.user.balance,
    });

    res.json({ success: true, connection: updatedConnection, sync, accountInfo: account });
  } catch (error) {
    next(error);
  }
};

const createEaToken = async (req, res, next) => {
  try {
    const token = createApiToken();
    const hash = hashApiToken(token);

    await disconnectUserConnections(req.user.id);

    const connection = await prisma.brokerConnection.create({
      data: {
        userId: req.user.id,
        broker: 'MT5 Expert Advisor',
        maskedAccountNumber: 'EA token',
        server: 'MT5 EA',
        apiTokenHash: hash,
        connectionType: 'MT5_EA',
        isActive: true,
        status: 'WAITING',
      },
    });

    res.status(201).json({
      token,
      connection,
      endpoint: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/ea/trade`,
      message: 'Token-г MT5 EA input дээр нэг удаа хуулж оруулна. Token дахин харагдахгүй.',
    });
  } catch (error) {
    next(error);
  }
};

const receiveEaTrade = async (req, res, next) => {
  try {
    const event = req.body || {};
    if (!event.token || !event.ticket || !event.symbol || !['BUY', 'SELL'].includes(event.type)) {
      return res.status(400).json({ success: false, error: 'Invalid trade event.' });
    }

    const connection = await prisma.brokerConnection.findUnique({
      where: { apiTokenHash: hashApiToken(event.token) },
      select: { id: true, userId: true, broker: true, user: { select: { balance: true } } },
    });

    if (!connection) return res.status(401).json({ success: false, error: 'Invalid token.' });

    const mt5Ticket = String(event.ticket);
    const existing = await prisma.trade.findFirst({
      where: { mt5Ticket },
      select: { id: true, userId: true, exitPrice: true, closedAt: true },
    });
    if (existing && existing.userId !== connection.userId) {
      return res.status(409).json({ success: false, error: 'Ticket already belongs to another account.' });
    }

    const openedAt = parseTradeDate(event.openedAt) || new Date();
    const isClosed = event.eventType === 'CLOSE';
    const closedAt = isClosed ? parseTradeDate(event.closedAt) || new Date() : null;
    const pnl = Number(event.profit || 0);
    const balance = connection.user?.balance || 0;
    const data = {
      userId: connection.userId,
      broker: connection.broker,
      brokerAccountId: connection.id,
      mt5Ticket,
      mt5OrderId: String(event.orderId || event.ticket),
      pair: normalizeSymbol(event.symbol),
      direction: event.type,
      entryPrice: Number(event.entryPrice || event.currentPrice || 0),
      exitPrice: isClosed ? Number(event.currentPrice || event.entryPrice || 0) : null,
      currentPrice: Number(event.currentPrice || event.entryPrice || 0),
      stopLoss: Number(event.stopLoss || 0) || null,
      takeProfit: Number(event.takeProfit || 0) || null,
      lotSize: Number(event.volume || 0),
      openedAt,
      closedAt,
      status: isClosed ? 'CLOSED' : 'OPEN',
      pnl,
      pnlPercent: balance > 0 ? Number(((pnl / balance) * 100).toFixed(2)) : null,
      commission: Number(event.commission || 0),
      swap: Number(event.swap || 0),
      syncedAt: new Date(),
    };

    if (existing) {
      await prisma.trade.update({ where: { id: existing.id }, data });
    } else {
      await prisma.trade.create({ data });
    }

    await prisma.brokerConnection.update({
      where: { id: connection.id },
      data: { status: 'CONNECTED', lastPingAt: new Date(), lastSyncedAt: new Date() },
    });

    res.json({ success: true, action: existing ? 'updated' : 'created', ticket: event.ticket });
  } catch (error) {
    next(error);
  }
};

const disconnectBroker = async (req, res, next) => {
  try {
    await disconnectUserConnections(req.user.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

const disconnectUserConnections = (userId) => prisma.brokerConnection.updateMany({
  where: { userId, isActive: true },
  data: { isActive: false, status: 'DISCONNECTED', lastPingAt: new Date() },
});

module.exports = {
  connectBroker,
  createEaToken,
  disconnectBroker,
  getActiveConnection,
  receiveEaTrade,
  syncBroker,
};
