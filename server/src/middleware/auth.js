import { verifyAccessToken } from '../utils/jwt.js';

export function requireAuth(secret) {
  return (req, res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const token = header.slice(7);
    try {
      const decoded = verifyAccessToken(token, secret);
      req.user = { id: decoded.sub, role: decoded.role, email: decoded.email };
      next();
    } catch {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  };
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}

/** Admins may edit any tenant; tenants may only PATCH their own profile (`:id` must match JWT sub). */
export function requireAdminOrTenantSelf(idParam = 'id') {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (req.user.role === 'admin') return next();
    if (req.user.role === 'tenant' && req.params[idParam] === req.user.id) return next();
    return res.status(403).json({ message: 'Forbidden' });
  };
}
