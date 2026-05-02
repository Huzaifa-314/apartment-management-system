import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from './models/User.js';
import { RefreshToken } from './models/RefreshToken.js';
import { hashPassword } from './services/auth.service.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/room-management';
const email = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase().trim();
const newPassword = process.env.ADMIN_PASSWORD || process.env.NEW_ADMIN_PASSWORD;

async function main() {
  if (!newPassword || newPassword.length < 8) {
    console.error('Set ADMIN_PASSWORD (at least 8 characters), e.g. ADMIN_PASSWORD=yourSecret npm run set-admin-password');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  const hashed = await hashPassword(newPassword);
  const user = await User.findOneAndUpdate(
    { email, role: 'admin' },
    { password: hashed },
    { new: true }
  );

  if (!user) {
    console.error(`No admin user with email ${email}. Create one with npm run server:seed (optional SEED_PASSWORD).`);
    await mongoose.disconnect();
    process.exit(1);
  }

  await RefreshToken.deleteMany({ userId: user._id });
  console.log(`Password updated for ${email}. Existing refresh sessions were cleared.`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
