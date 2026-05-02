import mongoose from 'mongoose';

const bookingApplicationSchema = new mongoose.Schema(
  {
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    applicantUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: '' },
    alternatePhone: { type: String, default: '' },
    moveInDate: { type: Date, default: null },
    leaseEndDate: { type: Date, default: null },
    address: {
      street: String,
      city: String,
      state: String,
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
      monthlyIncome: String,
    },
    preferences: {
      vegetarian: Boolean,
      smoking: Boolean,
      pets: Boolean,
    },
    additionalNotes: { type: String, default: '' },
    documents: {
      profilePicture: String,
      voterId: String,
      aadharCard: String,
      incomeProof: String,
    },
    status: {
      type: String,
      enum: ['pending_payment', 'pending', 'approved', 'rejected'],
      default: 'pending_payment',
    },
    sslcommerzTransactionId: { type: String, default: '' },
    sslcommerzSessionId: { type: String, default: '' },
    paidAmount: { type: Number, default: null },
    currency: { type: String, default: 'inr' },
    paidAt: { type: Date, default: null },
    rejectionReason: { type: String, default: '' },
  },
  { timestamps: true }
);

export const BookingApplication = mongoose.model('BookingApplication', bookingApplicationSchema);
