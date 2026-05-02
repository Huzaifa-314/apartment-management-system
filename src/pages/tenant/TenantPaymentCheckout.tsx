import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CreditCard, Loader2, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import Navbar from '../../components/shared/Navbar';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import StatusIndicator from '../../components/shared/StatusIndicator';
import { useAuth } from '../../context/AuthContext';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { api } from '../../lib/api';
import { formatCurrency } from '../../lib/formatCurrency';
import { isPayableRentPayment } from '../../lib/paymentUtils';
import type { Payment } from '../../types';
import { format, parseISO } from 'date-fns';

const TenantPaymentCheckout: React.FC = () => {
  const { user } = useAuth();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();
  const { paymentId } = useParams<{ paymentId: string }>();

  const [payment, setPayment] = useState<Payment | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!user || !paymentId) {
      if (!paymentId) setLoadError('Missing payment reference');
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const { data } = await api.get<{ payments: Payment[] }>('/api/payments');
        if (cancelled) return;
        const p = data.payments?.find((x) => x.id === paymentId) ?? null;
        if (!p) {
          setLoadError('Payment not found or you do not have access.');
          setPayment(null);
          return;
        }
        if (!isPayableRentPayment(p)) {
          setLoadError('This payment has already been completed or cannot be paid online.');
          setPayment(p);
          return;
        }
        setPayment(p);
      } catch {
        if (cancelled) return;
        setLoadError('Could not load payment details.');
        setPayment(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, paymentId]);

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const proceedToGateway = useCallback(async () => {
    if (!paymentId || !payment) return;
    setRedirecting(true);
    setLoadError(null);
    try {
      const { data } = await api.post<{ url: string }>(
        `/api/payments/${paymentId}/checkout-session`,
        {}
      );
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setLoadError('No payment URL returned. Please try again.');
    } catch (e) {
      const msg =
        axios.isAxiosError(e) &&
        e.response?.data &&
        typeof (e.response.data as { message?: string }).message === 'string'
          ? (e.response.data as { message: string }).message
          : 'Failed to initiate payment. Please try again.';
      setLoadError(msg);
    } finally {
      setRedirecting(false);
    }
  }, [paymentId, payment]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-lg">
        <Link
          to="/tenant/payments"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to payments
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Confirm payment</h1>
        <p className="text-gray-600 mb-6">
          Review your rent payment below. When you continue, you will be taken to our secure payment
          provider to complete the transaction.
        </p>

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        )}

        {!loading && loadError && !payment && (
          <Card className="border-red-200 bg-red-50">
            <p className="text-red-800">{loadError}</p>
            <Button variant="secondary" className="mt-4" onClick={() => navigate('/tenant/payments')}>
              Return to payments
            </Button>
          </Card>
        )}

        {!loading && payment && !isPayableRentPayment(payment) && (
          <Card className="border-amber-200 bg-amber-50">
            <p className="text-amber-900">{loadError}</p>
            <Button variant="secondary" className="mt-4" onClick={() => navigate('/tenant/payments')}>
              Return to payments
            </Button>
          </Card>
        )}

        {!loading && payment && isPayableRentPayment(payment) && (
          <>
            <Card className="mb-6 shadow-sm">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
                Payment summary
              </h2>
              <dl className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <dt className="text-gray-600">Amount due</dt>
                  <dd className="text-xl font-bold text-gray-900">
                    {formatCurrency(payment.amount, settings.currencySymbol)}
                  </dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="text-gray-600">Due date</dt>
                  <dd className="font-medium text-gray-900">{formatDate(payment.dueDate)}</dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="text-gray-600">Status</dt>
                  <dd>
                    <StatusIndicator status={payment.status} size="sm" />
                  </dd>
                </div>
              </dl>
            </Card>

            <Card className="mb-6 bg-blue-50 border-blue-100">
              <div className="flex gap-3">
                <ShieldCheck className="h-6 w-6 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Secure checkout</p>
                  <p className="text-sm text-gray-600 mt-1">
                    By continuing, you leave this app and complete payment on our payment
                    partner&apos;s site. You can return here after paying.
                  </p>
                </div>
              </div>
            </Card>

            {loadError && (
              <Card className="mb-4 border-red-200 bg-red-50">
                <p className="text-red-800 text-sm">{loadError}</p>
              </Card>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="secondary"
                className="sm:flex-1"
                onClick={() => navigate('/tenant/payments')}
                disabled={redirecting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="sm:flex-1"
                leftIcon={<CreditCard className="h-5 w-5" />}
                onClick={proceedToGateway}
                isLoading={redirecting}
              >
                Pay Now
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TenantPaymentCheckout;
