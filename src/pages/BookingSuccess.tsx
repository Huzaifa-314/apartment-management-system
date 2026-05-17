import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { Building2, CalendarRange, CheckCircle2, CreditCard, Hash, User } from 'lucide-react';
import Navbar from '../components/shared/Navbar';
import Button from '../components/shared/Button';
import Card from '../components/shared/Card';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { formatAmount } from '../lib/formatAmount';
import type { BookingApplication } from '../types';

function formatDisplayDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'MMMM d, yyyy');
  } catch {
    return '—';
  }
}

const BookingSuccess: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const transactionId = searchParams.get('tran_id');
  const bookingId = searchParams.get('booking_id');
  const valId = searchParams.get('val_id');
  const [phase, setPhase] = useState<'loading' | 'ok' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<BookingApplication | null>(null);

  const nextPath = user?.role === 'admin' ? '/admin/bookings' : '/tenant/applications';
  const nextLabel = user?.role === 'admin' ? 'View booking applications' : 'View my applications';

  const rawRedirect = `${location.pathname}${location.search}`;
  const loginRedirect = `/login?redirect=${encodeURIComponent(rawRedirect)}`;

  useEffect(() => {
    if (authLoading || !user) return;

    if (!transactionId || !bookingId) {
      setPhase('error');
      setErrorMessage(
        'Missing payment information. Open this page from the SSLCommerz success redirect, or go to Applications and use “Complete payment”.'
      );
      return;
    }

    let cancelled = false;

    (async () => {
      setPhase('loading');
      setErrorMessage(null);
      try {
        const params: Record<string, string> = {
          tran_id: transactionId,
          booking_id: bookingId,
        };
        if (valId) params.val_id = valId;

        const { data } = await api.get<{ ok?: boolean; message?: string; booking?: BookingApplication }>(
          '/api/bookings/confirm-checkout',
          { params }
        );
        if (cancelled) return;
        if (data?.ok) {
          setConfirmedBooking(data.booking ?? null);
          setPhase('ok');
          toast.success('Payment confirmed. Your application is submitted for review.');
        } else {
          setPhase('error');
          setErrorMessage(data?.message || 'Could not confirm payment.');
        }
      } catch (e: unknown) {
        if (cancelled) return;
        const msg =
          e && typeof e === 'object' && 'response' in e
            ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
            : null;
        setPhase('error');
        setErrorMessage(msg || 'Could not confirm payment. Try again from your applications page.');
        toast.error(msg || 'Confirmation failed');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, transactionId, bookingId, valId]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-16 max-w-lg text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Loading…</h1>
          <p className="text-gray-600">One moment.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-16 max-w-lg text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Sign in to finish</h1>
          <p className="text-gray-600 mb-8">
            After paying on SSLCommerz, sign in with the same account you used for the booking so we can
            confirm your payment.
          </p>
          <Link to={loginRedirect}>
            <Button variant="primary">Sign in to continue</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        {phase === 'loading' && (
          <div className="text-center max-w-lg mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Confirming payment…</h1>
            <p className="text-gray-600">One moment while we verify your payment.</p>
          </div>
        )}
        {phase === 'ok' && confirmedBooking && (
          <div className="space-y-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mb-5">
                <CheckCircle2 className="w-9 h-9" aria-hidden />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Payment confirmed</h1>
              <p className="text-gray-600 max-w-xl mx-auto leading-relaxed">
                Your payment was successful and your booking application is secured. It is now{' '}
                <span className="font-medium text-gray-800">pending admin review</span>. You will be notified
                after a decision is made. Save the details below for your records.
              </p>
            </div>

            <Card title="Application" subtitle="Reference and applicant">
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-600 flex items-center gap-2">
                    <Hash className="w-4 h-4 shrink-0 text-gray-400" aria-hidden />
                    Application ID
                  </dt>
                  <dd className="font-mono text-xs sm:text-sm text-gray-900 text-right break-all">
                    {confirmedBooking.id}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-600 flex items-center gap-2">
                    <User className="w-4 h-4 shrink-0 text-gray-400" aria-hidden />
                    Applicant
                  </dt>
                  <dd className="font-medium text-gray-900 text-right">{confirmedBooking.name}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-600">Email</dt>
                  <dd className="font-medium text-gray-900 text-right break-all">{confirmedBooking.email}</dd>
                </div>
                {confirmedBooking.phone ? (
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-600">Phone</dt>
                    <dd className="font-medium text-gray-900 text-right">{confirmedBooking.phone}</dd>
                  </div>
                ) : null}
              </dl>
            </Card>

            {confirmedBooking.room ? (
              <Card title="Room & dates" subtitle="What you applied for">
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-600 flex items-center gap-2">
                      <Building2 className="w-4 h-4 shrink-0 text-gray-400" aria-hidden />
                      Room
                    </dt>
                    <dd className="font-medium text-gray-900 text-right">
                      Room {confirmedBooking.room.number} · Floor {confirmedBooking.room.floor} ·{' '}
                      <span className="capitalize">{confirmedBooking.room.type}</span>
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-600">Monthly rent</dt>
                    <dd className="font-medium text-gray-900 text-right">
                      {confirmedBooking.room.rent != null && Number.isFinite(confirmedBooking.room.rent)
                        ? formatAmount(confirmedBooking.room.rent)
                        : '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-600 flex items-center gap-2">
                      <CalendarRange className="w-4 h-4 shrink-0 text-gray-400" aria-hidden />
                      Move-in
                    </dt>
                    <dd className="font-medium text-gray-900 text-right">
                      {formatDisplayDate(confirmedBooking.moveInDate)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-600">Lease ends</dt>
                    <dd className="font-medium text-gray-900 text-right">
                      {formatDisplayDate(confirmedBooking.leaseEndDate)}
                    </dd>
                  </div>
                </dl>
              </Card>
            ) : null}

            <Card title="Payment details" subtitle="Gateway confirmation">
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-600 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 shrink-0 text-gray-400" aria-hidden />
                    Amount paid
                  </dt>
                  <dd className="font-semibold text-gray-900 text-right">
                    {confirmedBooking.paidAmount != null && Number.isFinite(confirmedBooking.paidAmount)
                      ? formatAmount(confirmedBooking.paidAmount)
                      : '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-600">Paid on</dt>
                  <dd className="font-medium text-gray-900 text-right">
                    {formatDisplayDate(confirmedBooking.paidAt)}
                  </dd>
                </div>
                {transactionId ? (
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-600">Transaction ID</dt>
                    <dd className="font-mono text-xs sm:text-sm text-gray-900 text-right break-all">
                      {transactionId}
                    </dd>
                  </div>
                ) : null}
                {valId ? (
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-600">Validation ID</dt>
                    <dd className="font-mono text-xs sm:text-sm text-gray-900 text-right break-all">
                      {valId}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </Card>

            <div className="flex flex-col sm:flex-row sm:justify-center gap-3 pt-2">
              <Link to={nextPath} className="sm:inline-flex">
                <Button variant="primary" className="w-full sm:w-auto">
                  {nextLabel}
                </Button>
              </Link>
            </div>
          </div>
        )}
        {phase === 'ok' && !confirmedBooking && (
          <div className="text-center max-w-lg mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Payment confirmed</h1>
            <p className="text-gray-600 mb-8">
              Your payment was recorded. Open your applications list to see full details.
            </p>
            <Link to={nextPath}>
              <Button variant="primary">{nextLabel}</Button>
            </Link>
          </div>
        )}
        {phase === 'error' && (
          <div className="text-center max-w-lg mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Something went wrong</h1>
            <p className="text-gray-600 mb-8">{errorMessage}</p>
            <Link to={nextPath}>
              <Button variant="primary">{nextLabel}</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingSuccess;
