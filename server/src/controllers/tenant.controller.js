import { User } from '../models/User.js';
import { TenantProfile } from '../models/TenantProfile.js';
import { Room } from '../models/Room.js';
import { Payment } from '../models/Payment.js';
import { Complaint } from '../models/Complaint.js';
import { hashPassword } from '../services/auth.service.js';
import { serializeTenant, serializeUser } from '../utils/serialize.js';
import { sendMail } from '../services/email.service.js';
import crypto from 'crypto';

function genPassword() {
  return crypto.randomBytes(12).toString('base64url').slice(0, 16);
}

/** Accept JSON object or JSON string (multipart-style bodies). */
function parseNested(val) {
  if (val == null) return null;
  if (typeof val === 'object' && !Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const o = JSON.parse(val);
      return typeof o === 'object' && o !== null && !Array.isArray(o) ? o : null;
    } catch {
      return null;
    }
  }
  return null;
}

export const tenantController = {
  async list(req, res, next) {
    try {
      const profiles = await TenantProfile.find().populate('userId');
      const out = [];
      for (const p of profiles) {
        const u = p.userId;
        if (!u) continue;
        out.push(await serializeTenant(u, p));
      }
      res.json({ tenants: out });
    } catch (e) {
      next(e);
    }
  },

  async me(req, res, next) {
    try {
      const user = await User.findById(req.user.id);
      const profile = await TenantProfile.findOne({ userId: req.user.id });
      if (!user) return res.status(404).json({ message: 'Not found' });
      const tenant = await serializeTenant(user, profile);
      res.json({ tenant });
    } catch (e) {
      next(e);
    }
  },

  async create(req, res, next) {
    try {
      const {
        name,
        email,
        phone,
        alternatePhone,
        roomId,
        moveInDate,
        leaseEndDate,
        rentAmount,
        securityDeposit,
        password: plainPassword,
      } = req.body;

      const safeParse = (s, fallback = {}) => {
        if (!s || typeof s !== 'string') return fallback;
        try {
          return JSON.parse(s);
        } catch {
          return fallback;
        }
      };

      const address = safeParse(req.body.address);
      const emergencyContact = safeParse(req.body.emergencyContact);
      const occupation = safeParse(req.body.occupation);

      const password = plainPassword || genPassword();
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      const user = await User.create({
        email: email.toLowerCase(),
        password: await hashPassword(password),
        name,
        role: 'tenant',
        phone: phone || '',
        profileImage: req.fileUrls?.profilePicture || '',
      });

      const room = roomId ? await Room.findById(roomId) : null;
      if (room && room.tenantId && room.tenantId.toString() !== user._id.toString()) {
        await User.findByIdAndDelete(user._id);
        return res.status(400).json({ message: 'Room already occupied' });
      }

      const profile = await TenantProfile.create({
        userId: user._id,
        roomId: room?._id || null,
        moveInDate: moveInDate ? new Date(moveInDate) : null,
        leaseEndDate: leaseEndDate ? new Date(leaseEndDate) : null,
        alternatePhone: alternatePhone || '',
        rentAmount: rentAmount ? Number(rentAmount) : null,
        securityDeposit: securityDeposit ? Number(securityDeposit) : null,
        address,
        emergencyContact,
        occupation,
        documents: {
          profilePicture: req.fileUrls?.profilePicture,
          voterId: req.fileUrls?.voterId,
          leaseAgreement: req.fileUrls?.leaseAgreement,
        },
      });

      if (room) {
        room.tenantId = user._id;
        room.status = 'occupied';
        await room.save();
      }

      if (user.profileImage) {
        /* already set from upload */
      } else if (req.fileUrls?.profilePicture) {
        await User.findByIdAndUpdate(user._id, { profileImage: req.fileUrls.profilePicture });
      }

      const tenant = await serializeTenant(await User.findById(user._id), profile);

      try {
        await sendMail({
          to: user.email,
          subject: 'Your tenant account',
          text: `Hello ${name},\n\nYour account has been created.\nEmail: ${user.email}\nPassword: ${password}\n\nPlease log in and change your password if needed.`,
        });
      } catch {
        /* optional */
      }

      res.status(201).json({ tenant, temporaryPasswordSent: true });
    } catch (e) {
      next(e);
    }
  },

  async update(req, res, next) {
    try {
      const profile = await TenantProfile.findOne({ userId: req.params.id });
      if (!profile) return res.status(404).json({ message: 'Tenant not found' });
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ message: 'Tenant not found' });

      const {
        name,
        phone,
        alternatePhone,
        moveInDate,
        leaseEndDate,
        rentAmount,
        securityDeposit,
        roomId,
      } = req.body;

      const addressRaw = parseNested(req.body.address);
      const emergencyRaw = parseNested(req.body.emergencyContact);
      const occupationRaw = parseNested(req.body.occupation);

      const isTenantSelf = req.user.role === 'tenant' && req.user.id === req.params.id;
      if (isTenantSelf) {
        if (phone != null) user.phone = phone;
        await user.save();
        if (alternatePhone != null) profile.alternatePhone = alternatePhone;
        if (emergencyRaw != null) profile.emergencyContact = emergencyRaw;
        if (occupationRaw != null) {
          const prev = profile.occupation?.toObject?.() ?? profile.occupation ?? {};
          profile.occupation = { ...prev, ...occupationRaw };
        }
        await profile.save();
        const tenant = await serializeTenant(await User.findById(user._id), profile);
        return res.json({ tenant });
      }

      const address = req.body.address != null ? addressRaw ?? undefined : undefined;
      const emergencyContact = req.body.emergencyContact != null ? emergencyRaw ?? undefined : undefined;
      const occupation = req.body.occupation != null ? occupationRaw ?? undefined : undefined;

      // Handle room reassignment
      if (roomId !== undefined && roomId !== profile.roomId?.toString()) {
        // Vacate old room
        if (profile.roomId) {
          await Room.findByIdAndUpdate(profile.roomId, { tenantId: null, status: 'vacant' });
        }
        // Assign new room
        if (roomId) {
          const newRoom = await Room.findById(roomId);
          if (!newRoom) return res.status(404).json({ message: 'Room not found' });
          if (newRoom.tenantId && newRoom.tenantId.toString() !== req.params.id) {
            return res.status(400).json({ message: 'Room already occupied' });
          }
          await Room.findByIdAndUpdate(roomId, { tenantId: user._id, status: 'occupied' });
          profile.roomId = newRoom._id;
        } else {
          profile.roomId = null;
        }
      }

      if (name != null) user.name = name;
      if (phone != null) user.phone = phone;
      await user.save();

      if (alternatePhone != null) profile.alternatePhone = alternatePhone;
      if (moveInDate != null) profile.moveInDate = moveInDate ? new Date(moveInDate) : null;
      if (leaseEndDate != null) profile.leaseEndDate = leaseEndDate ? new Date(leaseEndDate) : null;
      if (rentAmount != null) profile.rentAmount = Number(rentAmount);
      if (securityDeposit != null) profile.securityDeposit = Number(securityDeposit);
      if (address != null) profile.address = address;
      if (emergencyContact != null) profile.emergencyContact = emergencyContact;
      if (occupation != null) profile.occupation = occupation;
      await profile.save();

      const tenant = await serializeTenant(await User.findById(user._id), profile);
      res.json({ tenant });
    } catch (e) {
      next(e);
    }
  },

  async delete(req, res, next) {
    try {
      const profile = await TenantProfile.findOne({ userId: req.params.id });
      if (!profile) return res.status(404).json({ message: 'Tenant not found' });

      // Vacate the room
      if (profile.roomId) {
        await Room.findByIdAndUpdate(profile.roomId, { tenantId: null, status: 'vacant' });
      }

      await Payment.deleteMany({ tenantId: req.params.id });
      await Complaint.deleteMany({ tenantId: req.params.id });
      await TenantProfile.findOneAndDelete({ userId: req.params.id });
      await User.findByIdAndDelete(req.params.id);
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  },
};
