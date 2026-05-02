import { Room } from '../models/Room.js';
import { Payment } from '../models/Payment.js';
import { Complaint } from '../models/Complaint.js';

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
        .filter((p) => p.status === 'paid')
        .reduce((s, p) => s + p.amount, 0);
      const pendingAmount = payments
        .filter((p) => p.status === 'pending')
        .reduce((s, p) => s + p.amount, 0);
      const overdueAmount = payments
        .filter((p) => p.status === 'overdue')
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
};
