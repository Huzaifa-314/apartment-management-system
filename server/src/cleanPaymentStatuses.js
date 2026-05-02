/**
 * One-shot: align stored payment status with due dates (removes incorrect overdue rows).
 * Run from repo root: node server/src/cleanPaymentStatuses.js
 * Or from server/: npm run clean-payment-statuses
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { syncPaymentStatuses } from './utils/paymentStatus.js';
import { Payment } from './models/Payment.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/room-management';

async function main() {
  await mongoose.connect(MONGODB_URI);
  const { markedOverdue, correctedToPending } = await syncPaymentStatuses();
  const stillOverdue = await Payment.countDocuments({ status: 'overdue' });

  console.log(
    `Synced: ${markedOverdue} payment(s) set to overdue (past due date), ${correctedToPending} payment(s) cleared from overdue → pending.`
  );
  console.log(`Remaining overdue records (actually past due): ${stillOverdue}`);

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
