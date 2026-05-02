import { Room } from '../models/Room.js';
import { Payment } from '../models/Payment.js';
import { Complaint } from '../models/Complaint.js';
import { BookingApplication } from '../models/BookingApplication.js';
import { effectivePaymentStatus } from '../utils/paymentStatus.js';

export const dashboardController = {
  async stats(req, res, next) {
    try {
      const rooms = await Room.find();
      const payments = await Payment.find();
      const complaints = await Complaint.find();

      const occupiedRooms = rooms.filter((r) => r.status === 'occupied').length;
      const vacantRooms = rooms.filter((r) => r.status === 'vacant').length;
      const maintenanceRooms = rooms.filter((r) => r.status === 'maintenance').length;

      const pendingComplaints = complaints.filter(
        (c) => c.status === 'new' || c.status === 'inProgress'
      ).length;

      const totalRevenue = payments
        .filter((p) => effectivePaymentStatus(p) === 'paid')
        .reduce((s, p) => s + p.amount, 0);
      const pendingAmount = payments
        .filter((p) => effectivePaymentStatus(p) === 'pending')
        .reduce((s, p) => s + p.amount, 0);
      const overdueAmount = payments
        .filter((p) => effectivePaymentStatus(p) === 'overdue')
        .reduce((s, p) => s + p.amount, 0);
      const totalExpectedRevenue = payments.reduce((s, p) => s + p.amount, 0);
      const collectionRate =
        totalExpectedRevenue > 0 ? (totalRevenue / totalExpectedRevenue) * 100 : 0;
      const occupancyRate = rooms.length > 0 ? (occupiedRooms / rooms.length) * 100 : 0;

      res.json({
        totalRooms: rooms.length,
        occupiedRooms,
        vacantRooms,
        maintenanceRooms,
        totalTenants: occupiedRooms,
        pendingComplaints,
        financialSummary: {
          totalRevenue,
          pendingAmount,
          overdueAmount,
          collectionRate,
          occupancyRate,
        },
      });
    } catch (e) {
      next(e);
    }
  },

  async activity(req, res, next) {
    try {
      const cap = 20;
      const [payments, complaints, bookings] = await Promise.all([
        Payment.find().sort({ updatedAt: -1 }).limit(10).lean(),
        Complaint.find().sort({ updatedAt: -1 }).limit(10).lean(),
        BookingApplication.find().sort({ createdAt: -1 }).limit(10).lean(),
      ]);
      const rows = [];
      for (const p of payments) {
        const st = effectivePaymentStatus(p);
        rows.push({
          id: `pay-${p._id}`,
          kind: 'payment',
          message: `Rent record ${st === 'paid' ? 'marked paid' : st}: ₹${p.amount}`,
          occurredAt: new Date(p.updatedAt || p.dueDate || Date.now()).toISOString(),
        });
      }
      for (const c of complaints) {
        const raw = c.title || 'Untitled';
        const short = raw.length > 56 ? `${raw.slice(0, 56)}…` : raw;
        rows.push({
          id: `comp-${c._id}`,
          kind: 'complaint',
          message: `Complaint “${short}” (${c.status})`,
          occurredAt: new Date(c.updatedAt || c.createdAt || Date.now()).toISOString(),
        });
      }
      for (const b of bookings) {
        const st = b.status === 'pending_payment' ? 'awaiting payment' : b.status;
        rows.push({
          id: `book-${b._id}`,
          kind: 'booking',
          message: `Booking application from ${b.name} — ${st}`,
          occurredAt: new Date(b.createdAt || b.updatedAt || Date.now()).toISOString(),
        });
      }
      rows.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
      res.json({ activities: rows.slice(0, cap) });
    } catch (e) {
      next(e);
    }
  },
};
