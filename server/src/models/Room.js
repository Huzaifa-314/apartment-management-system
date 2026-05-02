import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    number: { type: String, required: true },
    floor: { type: Number, required: true },
    type: { type: String, enum: ['single', 'double', 'premium'], required: true },
    rent: { type: Number, required: true },
    status: { type: String, enum: ['occupied', 'vacant', 'maintenance'], required: true },
    area: { type: Number, required: true },
    amenities: [{ type: String }],
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    lastMaintenance: { type: Date, default: null },
    nextMaintenance: { type: Date, default: null },
  },
  { timestamps: true }
);

roomSchema.index({ number: 1 });

export const Room = mongoose.model('Room', roomSchema);
