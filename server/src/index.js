import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import { createRouter } from './routes/index.js';
import { initSSLCommerz } from './services/sslcommerz.service.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initMailer } from './services/email.service.js';
import { startPaymentReminderCron } from './jobs/paymentReminders.cron.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Project root .env then server/.env (later overrides)
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/health', (req, res) => res.json({ ok: true }));

const sslcommerz = initSSLCommerz(process.env);
app.use((req, res, next) => {
  req.sslcommerz = sslcommerz;
  next();
});

app.use('/api', createRouter(process.env));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/room-management';

async function main() {
  if (!process.env.JWT_SECRET) {
    console.warn('Warning: JWT_SECRET not set — using dev default (not for production)');
    process.env.JWT_SECRET = 'dev-jwt-secret-change-me';
  }

  initMailer({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  });

  await connectDB();
  startPaymentReminderCron();

  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
    console.log(`Base path: /api`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
