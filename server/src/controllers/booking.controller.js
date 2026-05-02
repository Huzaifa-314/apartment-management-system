import mongoose from 'mongoose';
import crypto from 'crypto';
import { BookingApplication } from '../models/BookingApplication.js';
import { Room } from '../models/Room.js';
import { User } from '../models/User.js';
import { TenantProfile } from '../models/TenantProfile.js';
import { serializeBookingApplication } from '../utils/serialize.js';
import { finalizeBookingFromSSLCommerzPayment } from '../services/sslcommerzCheckoutFinalize.js';
import { hashPassword } from '../services/auth.service.js';
import { sendMail } from '../services/email.service.js';
import { parsePagination } from '../utils/pagination.js';

function genPassword() {
  return crypto.randomBytes(12).toString('base64url').slice(0, 16);
}

function bookingOwnedByUser(booking, user) {
  if (!user?.id) return false;
  if (booking.applicantUserId && booking.applicantUserId.toString() === user.id) return true;
  const email = (booking.email || '').trim().toLowerCase();
  const uEmail = (user.email || '').trim().toLowerCase();
  return email.length > 0 && email === uEmail;
}

function frontendOrigin() {
  return (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
}

/**
 * SSLCommerz sends the customer's browser back via POST (form) to success/fail/cancel URLs.
 * The Vite dev server (and many static hosts) do not serve SPA HTML for POST — you get HTTP 404.
 * These handlers accept POST on the API, then redirect with GET to the React app.
 */
function sslcommerzBrowserReturnSuccess(req, res, next) {
  try {
    const { bookingId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).type('text').send('Invalid booking reference');
    }
    const tran_id = req.body?.tran_id ?? req.query?.tran_id;
    const val_id = req.body?.val_id ?? req.query?.val_id;
    const qs = new URLSearchParams();
    if (tran_id) qs.set('tran_id', String(tran_id));
    qs.set('booking_id', bookingId);
    if (val_id) qs.set('val_id', String(val_id));
    res.redirect(302, `${frontendOrigin()}/booking/success?${qs.toString()}`);
  } catch (e) {
    next(e);
  }
}

function sslcommerzBrowserReturnFail(req, res, next) {
  try {
    const { bookingId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).type('text').send('Invalid booking reference');
    }
    res.redirect(302, `${frontendOrigin()}/booking/checkout/${bookingId}?failed=1`);
  } catch (e) {
    next(e);
  }
}

function sslcommerzBrowserReturnCancel(req, res, next) {
  try {
    const { bookingId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).type('text').send('Invalid booking reference');
    }
    res.redirect(302, `${frontendOrigin()}/booking/checkout/${bookingId}?cancelled=1`);
  } catch (e) {
    next(e);
  }
}

export const bookingController = {
  sslcommerzBrowserReturnSuccess,
  sslcommerzBrowserReturnFail,
  sslcommerzBrowserReturnCancel,

  async listMine(req, res, next) {
    try {
      const uid = req.user.id;
      const emailEsc = req.user.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const or = [{ email: new RegExp(`^${emailEsc}$`, 'i') }];
      if (mongoose.Types.ObjectId.isValid(uid)) {
        or.unshift({ applicantUserId: new mongoose.Types.ObjectId(uid) });
      }
      const bookings = await BookingApplication.find({ $or: or })
        .populate('roomId', 'number floor type rent area amenities status')
        .sort({ createdAt: -1 });
      res.json({ bookings: bookings.map(serializeBookingApplication) });
    } catch (e) {
      next(e);
    }
  },

  async list(req, res, next) {
    try {
      const q = {};
      if (req.query.status) q.status = req.query.status;
      const rawQ = req.query.q;
      if (rawQ && typeof rawQ === 'string' && rawQ.trim()) {
        const esc = rawQ.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const rx = new RegExp(esc, 'i');
        q.$or = [{ name: rx }, { email: rx }];
      }
      const wantPaging = req.query.page != null || req.query.limit != null;
      if (wantPaging) {
        const { page, limit, skip } = parsePagination(req.query, 15);
        const [bookings, total] = await Promise.all([
          BookingApplication.find(q)
            .populate('roomId', 'number floor type')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
          BookingApplication.countDocuments(q),
        ]);
        const totalPages = Math.max(1, Math.ceil(total / limit));
        return res.json({ bookings, page, limit, total, totalPages });
      }
      const bookings = await BookingApplication.find(q)
        .populate('roomId', 'number floor type')
        .sort({ createdAt: -1 });
      res.json({ bookings });
    } catch (e) {
      next(e);
    }
  },

  async update(req, res, next) {
    try {
      const booking = await BookingApplication.findById(req.params.id);
      if (!booking) return res.status(404).json({ message: 'Booking not found' });
      const { status, rejectionReason } = req.body;

      if (status === 'approved') {
        if (booking.status === 'pending_payment') {
          return res.status(400).json({ message: 'Application is awaiting payment' });
        }
        if (booking.status !== 'pending') {
          return res.status(400).json({ message: 'Only paid applications awaiting review can be approved' });
        }

        const room = await Room.findById(booking.roomId);
        if (!room) return res.status(404).json({ message: 'Room not found' });
        if (room.status !== 'vacant' || room.tenantId) {
          return res.status(409).json({ message: 'Room is not available for assignment' });
        }

        let user =
          booking.applicantUserId && mongoose.Types.ObjectId.isValid(booking.applicantUserId)
            ? await User.findById(booking.applicantUserId)
            : null;
        if (!user) {
          user = await User.findOne({ email: (booking.email || '').trim().toLowerCase() });
        }

        let generatedPassword = null;
        if (!user) {
          generatedPassword = genPassword();
          user = await User.create({
            email: (booking.email || '').trim().toLowerCase(),
            password: await hashPassword(generatedPassword),
            name: booking.name,
            role: 'tenant',
            phone: booking.phone || '',
          });
        } else if (user.role !== 'tenant') {
          return res.status(400).json({ message: 'Applicant email belongs to a non-tenant account' });
        }

        let profile = await TenantProfile.findOne({ userId: user._id });
        if (profile?.roomId) {
          const rid = profile.roomId.toString();
          const assignedRoom = await Room.findById(rid);
          if (assignedRoom?.tenantId?.toString() === user._id.toString()) {
            return res.status(409).json({ message: 'Applicant already has a room assigned' });
          }
        }

        const rent = Number(room.rent);
        const docPayload = {
          profilePicture: booking.documents?.profilePicture,
          voterId: booking.documents?.voterId,
          aadharCard: booking.documents?.aadharCard,
        };

        if (profile) {
          profile.roomId = room._id;
          profile.moveInDate = booking.moveInDate || profile.moveInDate;
          profile.leaseEndDate = booking.leaseEndDate || profile.leaseEndDate;
          profile.alternatePhone = booking.alternatePhone || profile.alternatePhone;
          profile.address = booking.address?.street ? booking.address : profile.address;
          profile.emergencyContact = booking.emergencyContact?.name
            ? booking.emergencyContact
            : profile.emergencyContact;
          profile.occupation = booking.occupation?.type ? booking.occupation : profile.occupation;
          profile.rentAmount = Number.isFinite(rent) ? rent : profile.rentAmount;
          const prevDocs = profile.documents?.toObject?.() ?? profile.documents ?? {};
          profile.documents = { ...prevDocs, ...docPayload };
          await profile.save();
        } else {
          profile = await TenantProfile.create({
            userId: user._id,
            roomId: room._id,
            moveInDate: booking.moveInDate,
            leaseEndDate: booking.leaseEndDate,
            alternatePhone: booking.alternatePhone || '',
            rentAmount: Number.isFinite(rent) ? rent : null,
            address: booking.address?.street ? booking.address : undefined,
            emergencyContact: booking.emergencyContact?.name ? booking.emergencyContact : undefined,
            occupation: booking.occupation?.type ? booking.occupation : undefined,
            documents: docPayload,
          });
        }

        room.tenantId = user._id;
        room.status = 'occupied';
        await room.save();

        booking.status = 'approved';
        booking.rejectionReason = '';
        await booking.save();

        if (generatedPassword) {
          try {
            await sendMail({
              to: user.email,
              subject: 'Your tenant account',
              text: `Hello ${booking.name},\n\nYour application was approved.\nEmail: ${user.email}\nPassword: ${generatedPassword}\n\nPlease log in and change your password.`,
            });
          } catch {
            /* optional */
          }
        }

        const populated = await BookingApplication.findById(booking._id).populate(
          'roomId',
          'number floor type rent area amenities status'
        );
        return res.json({ booking: populated });
      }

      if (status === 'rejected') {
        if (booking.status === 'approved') {
          return res.status(400).json({ message: 'Cannot reject an approved application' });
        }
        const reason =
          rejectionReason != null && String(rejectionReason).trim()
            ? String(rejectionReason).trim()
            : 'Rejected by administrator';
        booking.status = 'rejected';
        booking.rejectionReason = reason;
        await booking.save();
        const populated = await BookingApplication.findById(booking._id).populate(
          'roomId',
          'number floor type rent area amenities status'
        );
        return res.json({ booking: populated });
      }

      if (status) {
        if (booking.status === 'pending_payment' && status === 'approved') {
          return res.status(400).json({ message: 'Application is awaiting payment' });
        }
        booking.status = status;
        if (status !== 'rejected') {
          booking.rejectionReason = '';
        }
      }
      await booking.save();
      const populated = await BookingApplication.findById(booking._id).populate(
        'roomId',
        'number floor type rent area amenities status'
      );
      res.json({ booking: populated });
    } catch (e) {
      next(e);
    }
  },

  async confirmCheckoutSession(req, res, next) {
    try {
      const transactionId = req.query.tran_id;
      if (!transactionId || typeof transactionId !== 'string') {
        return res.status(400).json({ message: 'tran_id is required' });
      }

      const bookingId = req.query.booking_id;
      if (!bookingId || typeof bookingId !== 'string') {
        return res.status(400).json({ message: 'booking_id is required' });
      }

      const booking = await BookingApplication.findById(bookingId).populate('roomId', 'rent');
      if (!booking) return res.status(404).json({ message: 'Booking not found' });

      if (!bookingOwnedByUser(booking, req.user)) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      if (booking.sslcommerzTransactionId && booking.sslcommerzTransactionId !== transactionId) {
        return res.status(400).json({ message: 'Transaction does not match this booking' });
      }

      const valId = req.query.val_id;
      const sslcommerz = req.sslcommerz;

      let validationResult;
      if (sslcommerz) {
        if (!valId || typeof valId !== 'string') {
          return res.status(400).json({
            message:
              'val_id is required — SSLCommerz should redirect back with val_id in the URL. Open this page from the payment success redirect.',
          });
        }
        const vr = await sslcommerz.validatePayment({ val_id: valId });
        if (!vr.valid) {
          return res.status(400).json({ message: vr.error || 'Payment validation failed' });
        }
        if (vr.transactionId && vr.transactionId !== transactionId) {
          return res.status(400).json({ message: 'Transaction id mismatch with gateway' });
        }
        const room = booking.roomId;
        const expectedRent = room?.rent != null ? Number(room.rent) : null;
        if (
          expectedRent != null &&
          Number.isFinite(expectedRent) &&
          vr.amount != null &&
          Number.isFinite(vr.amount) &&
          Math.abs(vr.amount - expectedRent) > 0.01
        ) {
          return res.status(400).json({ message: 'Paid amount does not match booking' });
        }
        validationResult = {
          valid: true,
          transactionId: transactionId,
          amount: vr.amount ?? expectedRent ?? booking.paidAmount,
        };
      } else {
        validationResult = {
          valid: true,
          transactionId: transactionId,
          amount: booking.paidAmount || (booking.roomId?.rent || 0),
        };
      }

      const r = await finalizeBookingFromSSLCommerzPayment(bookingId, validationResult);

      switch (r.result) {
        case 'already_paid':
        case 'updated':
          return res.json({
            ok: true,
            booking: serializeBookingApplication(r.booking),
          });
        case 'room_unavailable':
          return res.status(409).json({
            ok: false,
            message: 'Room is no longer available. Contact support if you were charged.',
            booking: serializeBookingApplication(r.booking),
          });
        case 'not_paid':
          return res.status(400).json({ message: 'Payment is not complete yet' });
        case 'wrong_status':
          return res.status(400).json({
            message: 'This application cannot be confirmed',
            booking: serializeBookingApplication(r.booking),
          });
        case 'invalid_metadata':
        case 'not_found':
        default:
          return res.status(400).json({ message: 'Could not confirm payment' });
      }
    } catch (e) {
      next(e);
    }
  },

  async createCheckoutSession(req, res, next) {
    try {
      const sslcommerz = req.sslcommerz;
      if (!sslcommerz) {
        return res.status(503).json({ message: 'Payment gateway is not configured' });
      }

      const booking = await BookingApplication.findById(req.params.id).populate('roomId');
      if (!booking) return res.status(404).json({ message: 'Booking not found' });

      if (!bookingOwnedByUser(booking, req.user)) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      if (booking.status !== 'pending_payment') {
        return res.status(400).json({ message: 'Booking is not awaiting payment' });
      }

      const room = booking.roomId;
      if (!room || !room._id) return res.status(404).json({ message: 'Room not found' });

      const rent = Number(room.rent);
      if (!Number.isFinite(rent) || rent <= 0) {
        return res.status(400).json({ message: 'Invalid room rent' });
      }

      const transactionId = `booking_${booking._id.toString()}_${Date.now()}`;
      const apiBase = (process.env.API_URL || 'http://localhost:5000').replace(/\/$/, '');
      const bookingPathId = booking._id.toString();

      const initResponse = await sslcommerz.initializePayment({
        amount: rent,
        currency: process.env.SSLCOMMERZ_CURRENCY || 'BDT',
        transactionId: transactionId,
        // Browser return hits the API (POST); see sslcommerzBrowserReturn* — never point these at Vite alone.
        successUrl: `${apiBase}/api/bookings/sslcommerz-browser-return/success/${bookingPathId}`,
        failUrl: `${apiBase}/api/bookings/sslcommerz-browser-return/fail/${bookingPathId}`,
        cancelUrl: `${apiBase}/api/bookings/sslcommerz-browser-return/cancel/${bookingPathId}`,
        ipnUrl: `${apiBase}/api/bookings/ipn`,
        productName: `First month rent — Room ${room.number}`,
        customerName: booking.name,
        customerEmail: booking.email,
        customerPhone: booking.phone,
        customerAddress: booking.address?.street || 'N/A',
      });

      if (!initResponse.success) {
        return res.status(400).json({ message: initResponse.error || 'Failed to initialize payment' });
      }

      booking.sslcommerzSessionId = initResponse.sessionId;
      booking.sslcommerzTransactionId = transactionId;
      await booking.save();

      res.json({ url: initResponse.gatewayUrl });
    } catch (e) {
      next(e);
    }
  },

  async create(req, res, next) {
    try {
      const room = await Room.findById(req.body.roomId || req.params.roomId);
      if (!room) return res.status(404).json({ message: 'Room not found' });
      if (room.status !== 'vacant') {
        return res.status(400).json({ message: 'Room is not available for booking' });
      }

      const applicantUserId = req.user?.id || null;
      const jp = (s, fb = {}) => {
        if (!s || typeof s !== 'string') return fb;
        try {
          return JSON.parse(s);
        } catch {
          return fb;
        }
      };

      const applicantOid =
        applicantUserId && mongoose.Types.ObjectId.isValid(applicantUserId)
          ? new mongoose.Types.ObjectId(applicantUserId)
          : null;

      const doc = {
        roomId: room._id,
        applicantUserId: applicantOid,
        name: req.body.name,
        email: (req.body.email || '').trim().toLowerCase(),
        phone: req.body.phone || '',
        alternatePhone: req.body.alternatePhone || '',
        moveInDate: req.body.moveInDate ? new Date(req.body.moveInDate) : null,
        leaseEndDate: req.body.leaseEndDate ? new Date(req.body.leaseEndDate) : null,
        address: jp(req.body.address),
        emergencyContact: jp(req.body.emergencyContact),
        occupation: jp(req.body.occupation),
        preferences: jp(req.body.preferences, { vegetarian: false, smoking: false, pets: false }),
        additionalNotes: req.body.additionalNotes || '',
        documents: {
          profilePicture: req.fileUrls?.profilePicture,
          voterId: req.fileUrls?.voterId,
          aadharCard: req.fileUrls?.aadharCard,
          incomeProof: req.fileUrls?.incomeProof,
        },
      };

      const created = await BookingApplication.create(doc);
      const populated = await BookingApplication.findById(created._id).populate(
        'roomId',
        'number floor type rent area amenities status'
      );
      res.status(201).json({
        ok: true,
        message: 'Complete payment to submit your application',
        booking: serializeBookingApplication(populated),
      });
    } catch (e) {
      next(e);
    }
  },
};
