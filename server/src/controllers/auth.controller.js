import { User } from '../models/User.js';
import { TenantProfile } from '../models/TenantProfile.js';
import { loginUser, refreshTokens, logoutUser, registerUser } from '../services/auth.service.js';
import { serializeUser, serializeTenant } from '../utils/serialize.js';

export function createAuthController(env) {
  const jwtSecret = env.JWT_SECRET;

  return {
    async login(req, res, next) {
      try {
        const { email, password } = req.body;
        if (!email || !password) {
          return res.status(400).json({ message: 'Email and password required' });
        }
        const result = await loginUser({ email, password }, jwtSecret);
        if (!result) {
          return res.status(401).json({ message: 'Invalid email or password' });
        }
        res.json(result);
      } catch (e) {
        next(e);
      }
    },

    async register(req, res, next) {
      try {
        const { name, email, password, confirmPassword, role, phone } = req.body;
        if (!name || !email || !password || !confirmPassword || !role) {
          return res.status(400).json({ message: 'name, email, password, confirmPassword and role are required' });
        }
        if (!['admin', 'tenant'].includes(role)) {
          return res.status(400).json({ message: 'role must be admin or tenant' });
        }
        if (password.length < 8) {
          return res.status(400).json({ message: 'Password must be at least 8 characters' });
        }
        if (password !== confirmPassword) {
          return res.status(400).json({ message: 'Passwords do not match' });
        }
        const result = await registerUser({ name, email, password, role, phone }, jwtSecret);
        res.status(201).json(result);
      } catch (e) {
        if (e.status === 409) return res.status(409).json({ message: e.message });
        next(e);
      }
    },

    async refresh(req, res, next) {
      try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
          return res.status(400).json({ message: 'refreshToken required' });
        }
        const result = await refreshTokens(refreshToken, jwtSecret);
        if (!result) {
          return res.status(401).json({ message: 'Invalid refresh token' });
        }
        res.json(result);
      } catch (e) {
        next(e);
      }
    },

    async logout(req, res, next) {
      try {
        const { refreshToken } = req.body;
        await logoutUser(refreshToken);
        res.json({ ok: true });
      } catch (e) {
        next(e);
      }
    },

    async me(req, res, next) {
      try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.role === 'tenant') {
          const profile = await TenantProfile.findOne({ userId: user._id });
          const tenant = await serializeTenant(user, profile);
          return res.json({ user: tenant });
        }
        res.json({ user: serializeUser(user) });
      } catch (e) {
        next(e);
      }
    },
  };
}
