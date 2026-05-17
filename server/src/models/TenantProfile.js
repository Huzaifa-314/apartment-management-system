import mongoose from 'mongoose';

const tenantProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', default: null },
    moveInDate: { type: Date, default: null },
    leaseEndDate: { type: Date, default: null },
    alternatePhone: { type: String, default: '' },
    rentAmount: { type: Number, default: null },
    securityDeposit: { type: Number, default: null },
    address: {
      street: String,
      city: String,
      pincode: String,
    },
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String,
    },
    occupation: {
      type: { type: String, default: 'employed' },
      company: String,
      designation: String,
      workAddress: String,
    },
    documents: {
      leaseAgreement: String,
      idProof: String,
      profilePicture: String,
      voterId: String,
    },
  },
  { timestamps: true }
);

export const TenantProfile = mongoose.model('TenantProfile', tenantProfileSchema);
