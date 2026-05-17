import { Payment } from '../models/Payment.js';
import { effectivePaymentStatus } from '../utils/paymentStatus.js';

function formatDate(d) {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export const notificationController = {
  async list(req, res, next) {
    try {
      const payments = await Payment.find({ tenantId: req.user.id });
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const notifications = [];

      for (const payment of payments) {
        const dueDate = new Date(payment.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        if (effectivePaymentStatus(payment) === 'overdue') {
          notifications.push({
            id: `notification-overdue-${payment._id}`,
            userId: req.user.id,
            title: 'Rent Payment Overdue',
            message: `Your rent payment of ${payment.amount.toLocaleString()} was due on ${formatDate(dueDate)}`,
            type: 'warning',
            read: false,
            date: new Date().toISOString(),
            link: '/tenant/payments',
          });
        }

        const sevenDaysBeforeDue = new Date(dueDate);
        sevenDaysBeforeDue.setDate(sevenDaysBeforeDue.getDate() - 7);

        if (effectivePaymentStatus(payment) === 'pending' && today > sevenDaysBeforeDue) {
          notifications.push({
            id: `notification-reminder-${payment._id}`,
            userId: req.user.id,
            title: 'Upcoming Rent Payment',
            message: `Your rent payment of ${payment.amount.toLocaleString()} is due on ${formatDate(dueDate)}`,
            type: 'info',
            read: false,
            date: new Date().toISOString(),
            link: '/tenant/payments',
          });
        }
      }

      res.json({ notifications });
    } catch (e) {
      next(e);
    }
  },
};
