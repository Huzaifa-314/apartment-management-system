import cron from 'node-cron';
import { Payment } from '../models/Payment.js';
import { User } from '../models/User.js';
import { sendPaymentReminderEmail } from '../services/email.service.js';

export function startPaymentReminderCron() {
  cron.schedule('0 9 * * *', async () => {
    try {
      const payments = await Payment.find({
        status: { $in: ['pending', 'overdue'] },
      });
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;

      for (const p of payments) {
        if (p.lastRentReminderAt && now - p.lastRentReminderAt.getTime() < dayMs) {
          continue;
        }
        const tenant = await User.findById(p.tenantId);
        if (!tenant?.email) continue;
        await sendPaymentReminderEmail(
          tenant.email,
          tenant.name,
          p.amount,
          p.dueDate.toISOString().split('T')[0]
        );
        p.lastRentReminderAt = new Date();
        await p.save();
      }
    } catch (e) {
      console.error('payment reminder cron', e);
    }
  });
  console.log('Payment reminder cron scheduled (daily 09:00)');
}
