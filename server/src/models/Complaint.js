import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['maintenance', 'neighbor', 'facility', 'other'],
      required: true,
    },
    priority: { type: String, enum: ['low', 'medium', 'high'], required: true },
    status: {
      type: String,
      enum: ['new', 'inProgress', 'resolved', 'rejected'],
      default: 'new',
    },
    resolvedAt: { type: Date, default: null },
    feedback: { type: String, default: '' },
    assignedTo: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Complaint = mongoose.model('Complaint', complaintSchema);
