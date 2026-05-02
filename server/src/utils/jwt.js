import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export function signAccessToken(payload, secret, expiresIn = '15m') {
  return jwt.sign(payload, secret, { expiresIn });
}

export function signRefreshToken(payload, secret, expiresIn = '7d') {
  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyAccessToken(token, secret) {
  return jwt.verify(token, secret);
}

export function verifyRefreshToken(token, secret) {
  return jwt.verify(token, secret);
}

export function randomRefreshToken() {
  return crypto.randomBytes(48).toString('hex');
}
