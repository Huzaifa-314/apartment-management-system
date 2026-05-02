import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ['admin', 'tenant'], required: true },
    phone: { type: String, default: '' },
    profileImage: { type: String, default: '' },
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
