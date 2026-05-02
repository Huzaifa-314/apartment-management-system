import mongoose from 'mongoose';
import { BookingApplication } from '../models/BookingApplication.js';
import { Room } from '../models/Room.js';

async function populateBooking(bid) {
  return BookingApplication.findById(bid).populate('roomId', 'number floor type rent area amenities status');
}

/**
 * Apply a paid Stripe Checkout Session to the booking (idempotent).
 * @param {import('stripe').Stripe.Checkout.Session} session
 */
export async function finalizeBookingFromCheckoutSession(session) {
  const bookingId = session.metadata?.bookingId;
  if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
    return { result: 'invalid_metadata' };
  }

  const booking = await BookingApplication.findById(bookingId);
  if (!booking) return { result: 'not_found' };

  if (booking.status === 'pending' && booking.paidAt) {
    return { result: 'already_paid', booking: await populateBooking(booking._id) };
  }

  if (booking.status !== 'pending_payment') {
    return { result: 'wrong_status', booking: await populateBooking(booking._id) };
  }

  if (session.payment_status !== 'paid') {
    return { result: 'not_paid' };
  }

  const room = await Room.findById(booking.roomId);
  if (!room || room.status !== 'vacant') {
    booking.status = 'rejected';
    booking.rejectionReason = 'Room no longer available at payment confirmation';
    await booking.save();
    return { result: 'room_unavailable', booking: await populateBooking(booking._id) };
  }

  const pi = session.payment_intent;
  const paymentIntentId = typeof pi === 'string' ? pi : pi?.id || '';

  const total = session.amount_total;
  const paidAmount =
    typeof total === 'number' && Number.isFinite(total) ? Math.round(total) / 100 : null;

  booking.status = 'pending';
  booking.stripePaymentIntentId = paymentIntentId;
  booking.paidAmount = paidAmount;
  booking.paidAt = new Date();
  await booking.save();

  return { result: 'updated', booking: await populateBooking(booking._id) };
}
