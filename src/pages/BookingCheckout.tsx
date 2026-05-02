import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import Navbar from '../components/shared/Navbar';
import Button from '../components/shared/Button';
import Card from '../components/shared/Card';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { BookingApplication } from '../types';
import toast from 'react-hot-toast';
import { ArrowLeft, CreditCard, Loader2 } from 'lucide-react';

const BookingCheckout: React.FC = () => {
  const { user } = useAuth();
  const { bookingId } = useParams<{ bookingId: string }>();
  const [searchParams] = useSearchParams();
  const cancelled = searchParams.get('cancelled') === '1';
  const failed = searchParams.get('failed') === '1';

  const [booking, setBooking] = useState<BookingApplication | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingBooking, setLoadingBooking] = useState(true);
  const [payRedirecting, setPayRedirecting] = useState(false);

  useEffect(() => {
    if (!bookingId) {
      setLoadError('Missing booking reference');
      setLoadingBooking(false);
      return;
    }

    let cancelledReq = false;

    (async () => {
      setLoadingBooking(true);
      setLoadError(null);
      try {
        const { data } = await api.get<{ bookings: BookingApplication[] }>('/api/bookings/me');
        if (cancelledReq) return;
        const b = data.bookings?.find(x => x.id === bookingId) ?? null;
        if (!b) {
          setLoadError('Booking not found or you do not have access.');
          setBooking(null);
          return;
        }
        setBooking(b);
      } catch (e: unknown) {
        if (cancelledReq) return;
        const msg =
          e && typeof e === 'object' && 'response' in e
            ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
            : null;
        setLoadError(msg || 'Could not load booking.');
        setBooking(null);
      } finally {
        if (!cancelledReq) setLoadingBooking(false);
      }
    })();

    return () => {
      cancelledReq = true;
    };
  }, [bookingId]);

  const startPayment = useCallback(async () => {
    if (!bookingId) return;
    setPayRedirecting(true);
    setLoadError(null);
    try {
      const { data } = await api.post<{ url?: string; message?: string }>(
        `/api/bookings/${bookingId}/checkout-session`,
        {}
      );
      if (data?.url) {
        window.location.assign(data.url);
        return;
      }
      const msg = data?.message || 'Could not start payment.';
      setLoadError(msg);
      toast.error(msg);
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      const out = msg || 'Could not start checkout. Please try again.';
      setLoadError(out);
      toast.error(out);
    } finally {
      setPayRedirecting(false);
    }
  }, [bookingId]);

  const backHref = user?.role === 'admin' ? '/admin/bookings' : '/tenant/applications';
  const backLabel = user?.role === 'admin' ? 'Back to bookings' : 'Back to applications';

  const rent = booking?.room?.rent;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link
          to={backHref}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {backLabel}
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Checkout</h1>
        <p className="text-gray-600 mb-6">
          Review your booking and pay the first month&apos;s rent securely via SSLCommerz.
        </p>

        {cancelled && (
          <p className="text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 mb-6 text-sm">
            Payment was cancelled. You can try again when you are ready.
          </p>
        )}
        {failed && (
          <p className="text-red-800 bg-red-50 border border-red-100 rounded-lg px-4 py-3 mb-6 text-sm">
            Payment did not complete. You can try again below.
          </p>
        )}

        {loadingBooking && (
          <div className="flex items-center justify-center py-16 text-gray-500 gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            Loading booking…
          </div>
        )}

        {!loadingBooking && loadError && !booking && (
          <Card>
            <p className="text-red-700 text-sm">{loadError}</p>
            <div className="mt-4">
              <Link to={backHref}>
                <Button variant="secondary">{backLabel}</Button>
              </Link>
            </div>
          </Card>
        )}

        {!loadingBooking && booking && (
          <>
            <Card title="Booking summary" className="mb-6">
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-600">Applicant</dt>
                  <dd className="font-medium text-gray-900 text-right">{booking.name}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-600">Email</dt>
                  <dd className="font-medium text-gray-900 text-right break-all">{booking.email}</dd>
                </div>
                {booking.room && (
                  <>
                    <div className="flex justify-between gap-4">
                      <dt className="text-gray-600">Room</dt>
                      <dd className="font-medium text-gray-900 text-right">
                        Room {booking.room.number} (Floor {booking.room.floor})
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-gray-600">Monthly rent</dt>
                      <dd className="font-medium text-gray-900 text-right">
                        ₹{typeof rent === 'number' ? rent.toLocaleString() : '—'}
                      </dd>
                    </div>
                  </>
                )}
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-600">Status</dt>
                  <dd className="font-medium text-gray-900 text-right capitalize">
                    {booking.status.replace('_', ' ')}
                  </dd>
                </div>
              </dl>
            </Card>

            {booking.status === 'pending_payment' && typeof rent === 'number' && rent > 0 && (
              <Card>
                <p className="text-sm text-gray-600 mb-4">
                  You will be redirected to SSLCommerz to complete payment for the first month&apos;s rent
                  (amount sent to the gateway matches your room rent; currency is set server-side for SSLCommerz,
                  typically BDT). After payment you will return here to confirm your application.
                </p>
                {loadError && (
                  <p className="text-red-700 bg-red-50 border border-red-100 rounded-lg px-4 py-3 mb-4 text-sm">
                    {loadError}
                  </p>
                )}
                <Button
                  variant="primary"
                  className="w-full sm:w-auto"
                  isLoading={payRedirecting}
                  leftIcon={<CreditCard className="h-5 w-5" />}
                  onClick={startPayment}
                >
                  Pay with SSLCommerz
                </Button>
              </Card>
            )}

            {booking.status !== 'pending_payment' && (
              <Card>
                <p className="text-gray-700 text-sm mb-4">
                  {booking.status === 'pending'
                    ? 'This application is already paid and waiting for admin review.'
                    : booking.status === 'approved'
                      ? 'This application has been approved.'
                      : booking.status === 'rejected'
                        ? 'This application was rejected.'
                        : 'No payment is required for this application in its current state.'}
                </p>
                <Link to={backHref}>
                  <Button variant="primary">{backLabel}</Button>
                </Link>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BookingCheckout;
