// smart-inventory/backend/src/controllers/authController.js
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { withEffectiveRole } = require('../middleware/auth');
const { sendPasswordResetCode } = require('../utils/mailer');

// ─── Token үүсгэх ─────────────────────────────────────────────────
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const DEFAULT_FRONTEND_URL = 'http://localhost:3001';
const DEFAULT_SELECTED_PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'EUR/GBP', 'EUR/JPY', 'XAU/USD', 'XAG/USD'];
const DEFAULT_RISK_REWARD_PRESETS = [2, 3];
const AVAILABLE_RISK_REWARD_PRESETS = new Set([1, 1.5, 2, 2.5, 3, 4, 5]);
const AVAILABLE_PAIRS = new Set([
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF',
  'AUD/USD', 'USD/CAD', 'NZD/USD', 'EUR/GBP',
  'EUR/JPY', 'GBP/JPY', 'XAU/USD', 'XAG/USD',
]);
const passwordResetCodes = new Map();
const PASSWORD_RESET_CODE_TTL_MS = 10 * 60 * 1000;

const createPasswordResetCode = () => String(crypto.randomInt(100000, 1000000));

const getPasswordResetKey = (email, username) => (
  `${String(email).trim().toLowerCase()}::${String(username).trim().toLowerCase()}`
);

const hashResetCode = (code) => (
  crypto.createHash('sha256').update(String(code)).digest('hex')
);

const normalizeOrigin = (value) => {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const isLocalOrigin = (value) => {
  const origin = normalizeOrigin(value);
  if (!origin) return false;

  try {
    const { hostname } = new URL(origin);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  } catch {
    return false;
  }
};

const getAllowedFrontendOrigins = () => [
  process.env.FRONTEND_URL,
  ...(process.env.CORS_ORIGIN || '').split(','),
  'http://localhost:3000',
  DEFAULT_FRONTEND_URL,
]
  .map((origin) => origin?.trim())
  .filter(Boolean);

const getFrontendUrl = (req, preferredUrl) => {
  const allowedOrigins = getAllowedFrontendOrigins();
  const candidates = [
    preferredUrl,
    req.get('referer') ? normalizeOrigin(req.get('referer')) : null,
    process.env.FRONTEND_URL,
    DEFAULT_FRONTEND_URL,
  ];

  return candidates.find((url) => url && allowedOrigins.includes(normalizeOrigin(url))) || DEFAULT_FRONTEND_URL;
};

const getBackendUrl = (req) => {
  const requestUrl = `${req.protocol}://${req.get('host')}`;
  return isLocalOrigin(requestUrl) ? requestUrl : process.env.BACKEND_URL || requestUrl;
};

const normalizeSelectedPairs = (pairs) => {
  if (!Array.isArray(pairs)) return DEFAULT_SELECTED_PAIRS;
  const normalized = pairs
    .map((pair) => String(pair).trim().toUpperCase())
    .filter((pair, index, list) => AVAILABLE_PAIRS.has(pair) && list.indexOf(pair) === index);

  return normalized.length ? normalized : DEFAULT_SELECTED_PAIRS;
};

const normalizeRiskRewardPresets = (presets) => {
  if (!Array.isArray(presets)) return DEFAULT_RISK_REWARD_PRESETS;
  const normalized = presets
    .map((value) => Number(value))
    .filter((value, index, list) => AVAILABLE_RISK_REWARD_PRESETS.has(value) && list.indexOf(value) === index)
    .sort((a, b) => a - b);

  return normalized.length ? normalized : DEFAULT_RISK_REWARD_PRESETS;
};

const buildUniqueUsername = async (email, name) => {
  const base = (name || email.split('@')[0] || 'google_user')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 24) || 'google_user';

  let username = base;
  let suffix = 1;

  while (await prisma.user.findUnique({ where: { username } })) {
    username = `${base}_${suffix}`;
    suffix += 1;
  }

  return username;
};

// ─── POST /api/auth/register ───────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { email, username, password, balance = 10000 } = req.body;

    // Давхардал шалгах
    const exists = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (exists) {
      return res.status(409).json({ error: 'Email эсвэл хэрэглэгчийн нэр аль хэдийн бүртгэлтэй байна.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { email, username, password: hashedPassword, balance: parseFloat(balance) },
      select: { id: true, email: true, username: true, role: true, balance: true, riskPerTrade: true, selectedPairs: true, riskRewardPresets: true, createdAt: true },
    });

    res.status(201).json({
      message: 'Бүртгэл амжилттай!',
      user: withEffectiveRole(user),
      token: generateToken(user.id),
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/auth/login ──────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Email эсвэл нууц үг буруу байна.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Email эсвэл нууц үг буруу байна.' });
    }

    const { password: _, ...userData } = user;

    res.json({
      message: 'Амжилттай нэвтэрлээ!',
      user: withEffectiveRole(userData),
      token: generateToken(user.id),
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/request-reset-code
const requestResetCode = async (req, res, next) => {
  try {
    const { email, username } = req.body;

    if (!email || !username) {
      return res.status(400).json({ error: 'Email болон хэрэглэгчийн нэр оруулна уу.' });
    }

    const user = await prisma.user.findFirst({
      where: {
        email: String(email).trim(),
        username: String(username).trim(),
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Email болон хэрэглэгчийн нэр таарахгүй байна.' });
    }

    const code = createPasswordResetCode();
    passwordResetCodes.set(getPasswordResetKey(email, username), {
      codeHash: hashResetCode(code),
      expiresAt: Date.now() + PASSWORD_RESET_CODE_TTL_MS,
    });

    await sendPasswordResetCode({ to: user.email, code });

    res.json({ message: 'Нууц үг сэргээх код email рүү илгээгдлээ.' });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const { email, username, code, password } = req.body;

    if (!email || !username || !code || !password || password.length < 6) {
      return res.status(400).json({ error: 'Email, хэрэглэгчийн нэр, code, 6-аас дээш тэмдэгттэй шинэ нууц үг оруулна уу.' });
    }

    const resetKey = getPasswordResetKey(email, username);
    const resetRecord = passwordResetCodes.get(resetKey);

    if (!resetRecord || resetRecord.expiresAt < Date.now()) {
      passwordResetCodes.delete(resetKey);
      return res.status(400).json({ error: 'Код хүчингүй эсвэл хугацаа дууссан байна.' });
    }

    if (resetRecord.codeHash !== hashResetCode(code)) {
      return res.status(400).json({ error: 'Код буруу байна.' });
    }

    const user = await prisma.user.findFirst({
      where: {
        email: String(email).trim(),
        username: String(username).trim(),
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Email болон хэрэглэгчийн нэр таарахгүй байна.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });
    passwordResetCodes.delete(resetKey);

    res.json({ message: 'Нууц үг амжилттай шинэчлэгдлээ.' });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/auth/google ─────────────────────────────────────────
const googleStart = (req, res) => {
  const { GOOGLE_CLIENT_ID } = process.env;

  if (!GOOGLE_CLIENT_ID) {
    return res.status(503).json({ error: 'Google OAuth client ID тохируулагдаагүй байна.' });
  }

  const redirectUri = `${getBackendUrl(req)}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'select_account',
    state: getFrontendUrl(req, req.query.frontend_url),
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
};

// ─── GET /api/auth/google/callback ────────────────────────────────
const googleCallback = async (req, res, next) => {
  try {
    const { code, error } = req.query;
    const frontendUrl = getFrontendUrl(req, req.query.state);

    if (error) {
      return res.redirect(`${frontendUrl}/auth?google_error=${encodeURIComponent(error)}`);
    }

    if (!code) {
      return res.redirect(`${frontendUrl}/auth?google_error=${encodeURIComponent('Google authorization code олдсонгүй.')}`);
    }

    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return res.redirect(`${frontendUrl}/auth?google_error=${encodeURIComponent('Google OAuth тохиргоо дутуу байна.')}`);
    }

    const redirectUri = `${getBackendUrl(req)}/api/auth/google/callback`;
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      return res.redirect(`${frontendUrl}/auth?google_error=${encodeURIComponent('Google token авахад алдаа гарлаа.')}`);
    }

    const tokenData = await tokenResponse.json();
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!profileResponse.ok) {
      return res.redirect(`${frontendUrl}/auth?google_error=${encodeURIComponent('Google профайл авахад алдаа гарлаа.')}`);
    }

    const profile = await profileResponse.json();
    if (!profile.email) {
      return res.redirect(`${frontendUrl}/auth?google_error=${encodeURIComponent('Google email олдсонгүй.')}`);
    }

    let user = await prisma.user.findUnique({ where: { email: profile.email } });

    if (!user) {
      const username = await buildUniqueUsername(profile.email, profile.name);
      const randomPassword = await bcrypt.hash(`${profile.sub}-${Date.now()}-${process.env.JWT_SECRET}`, 12);

      user = await prisma.user.create({
        data: {
          email: profile.email,
          username,
          password: randomPassword,
          balance: 10000,
        },
      });
    }

    const token = generateToken(user.id);
    res.redirect(`${frontendUrl}/auth?token=${encodeURIComponent(token)}`);
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/auth/me ──────────────────────────────────────────────
const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, email: true, username: true, role: true,
        balance: true, riskPerTrade: true, selectedPairs: true, riskRewardPresets: true, createdAt: true,
        _count: { select: { trades: true, alerts: true, strategies: true } },
      },
    });
    res.json(withEffectiveRole(user));
  } catch (error) {
    next(error);
  }
};

// ─── PUT /api/auth/profile ─────────────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const { balance, riskPerTrade, selectedPairs, riskRewardPresets } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(balance !== undefined && { balance: parseFloat(balance) }),
        ...(riskPerTrade !== undefined && { riskPerTrade: parseFloat(riskPerTrade) }),
        ...(selectedPairs !== undefined && { selectedPairs: normalizeSelectedPairs(selectedPairs) }),
        ...(riskRewardPresets !== undefined && { riskRewardPresets: normalizeRiskRewardPresets(riskRewardPresets) }),
      },
      select: { id: true, email: true, username: true, role: true, balance: true, riskPerTrade: true, selectedPairs: true, riskRewardPresets: true },
    });

    res.json({ message: 'Профайл шинэчлэгдлээ', user: withEffectiveRole(user) });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, requestResetCode, resetPassword, googleStart, googleCallback, getProfile, updateProfile };
