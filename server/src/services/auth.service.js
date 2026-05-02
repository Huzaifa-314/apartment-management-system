import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { signAccessToken, randomRefreshToken } from '../utils/jwt.js';
import { serializeUser } from '../utils/serialize.js';

const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '15m';
const REFRESH_DAYS = parseInt(process.env.JWT_REFRESH_DAYS || '7', 10);

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
}

export async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export async function loginUser({ email, password }, jwtSecret) {
  const normalizedEmail = String(email ?? '')
    .toLowerCase()
    .trim();
  const user = await User.findOne({ email: normalizedEmail }).select('+password');
  if (!user) return null;
  const ok = await comparePassword(password, user.password);
  if (!ok) return null;

  const accessToken = signAccessToken(
    { sub: user._id.toString(), role: user.role, email: user.email },
    jwtSecret,
    ACCESS_EXPIRES
  );

  const rawRefresh = randomRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000);
  await RefreshToken.create({
    userId: user._id,
    token: rawRefresh,
    expiresAt,
  });

  return {
    user: serializeUser(user),
    accessToken,
    refreshToken: rawRefresh,
  };
}

export async function refreshTokens(rawRefresh, jwtSecret) {
  const doc = await RefreshToken.findOne({ token: rawRefresh });
  if (!doc || doc.expiresAt < new Date()) {
    if (doc) await RefreshToken.deleteOne({ _id: doc._id });
    return null;
  }
  const user = await User.findById(doc.userId);
  if (!user) return null;

  const accessToken = signAccessToken(
    { sub: user._id.toString(), role: user.role, email: user.email },
    jwtSecret,
    ACCESS_EXPIRES
  );

  const newRaw = randomRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000);
  await RefreshToken.deleteOne({ _id: doc._id });
  await RefreshToken.create({
    userId: user._id,
    token: newRaw,
    expiresAt,
  });

  return {
    accessToken,
    refreshToken: newRaw,
    user: serializeUser(user),
  };
}

export async function logoutUser(rawRefresh) {
  if (rawRefresh) await RefreshToken.deleteMany({ token: rawRefresh });
}

export async function registerUser({ name, email, password, role, phone }, jwtSecret) {
  const normalizedEmail = String(email ?? '')
    .toLowerCase()
    .trim();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    const err = new Error('Email already in use');
    err.status = 409;
    throw err;
  }

  const hashed = await hashPassword(password);
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashed,
    role,
    phone: phone?.trim() || '',
  });

  const accessToken = signAccessToken(
    { sub: user._id.toString(), role: user.role, email: user.email },
    jwtSecret,
    ACCESS_EXPIRES
  );

  const rawRefresh = randomRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000);
  await RefreshToken.create({ userId: user._id, token: rawRefresh, expiresAt });

  return { user: serializeUser(user), accessToken, refreshToken: rawRefresh };
}
