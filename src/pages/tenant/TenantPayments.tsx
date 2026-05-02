import React, { useState, useEffect } from 'react';
import { CreditCard, Download, CheckCircle, AlertCircle } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import StatusIndicator from '../../components/shared/StatusIndicator';
import { useAuth } from '../../context/AuthContext';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { api } from '../../lib/api';
import { formatCurrency } from '../../lib/formatCurrency';
import { selectCurrentPayment } from '../../lib/paymentUtils';
import { Payment } from '../../types';
import { format, parseISO } from 'date-fns';

const TenantPayments: React.FC = () => {
  const { user } = useAuth();
  const { settings } = useSiteSettings();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const { data } = await api.get<{ payments: Payment[] }>('/api/payments');
        setPayments(
          data.payments.sort(
            (a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
          )
        );
      } catch {
        setPayments([]);
      }
    };
    load();

    // Check if we're returning from Stripe
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const cancelled = params.get('cancelled');

    if (cancelled) {
      setError('Payment was cancelled. Please try again.');
      window.history.replaceState({}, '', '/tenant/payments');
    } else if (sessionId) {
      confirmPayment(sessionId);
    }
  }, [user]);

  const currentPayment = selectCurrentPayment(payments);

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const handlePayNow = async () => {
    if (!currentPayment) return;
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.post<{ url: string }>(
        `/api/payments/${currentPayment.id}/checkout-session`,
        {}
      );
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError('Failed to initiate payment. Please try again.');
      setLoading(false);
    }
  };

  const confirmPayment = async (sessionId: string) => {
    try {
      const { data } = await api.get<{ ok: boolean; payment: Payment }>(
        `/api/payments/confirm-checkout?session_id=${sessionId}`
      );
      if (data.ok) {
        setPayments(prev =>
          prev.map(p => (p.id === data.payment.id ? data.payment : p))
        );
        window.history.replaceState({}, '', '/tenant/payments');
      }
    } catch (err) {
      console.error('Payment confirmation failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
            <p className="text-gray-600">Manage your rent payments</p>
          </div>
          {currentPayment && (
            <div className="text-right">
              <p className="text-sm text-gray-600">Current Balance</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(currentPayment.amount, settings.currencySymbol)}
              </p>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <Card className="mb-8 bg-red-50 border-red-200">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          </Card>
        )}

        {/* Payment Box */}
        {currentPayment && (
          <Card className="mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Make Payment</h2>
              <p className="text-gray-600">Pay your rent securely online</p>
            </div>

            <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Amount Due</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(currentPayment.amount, settings.currencySymbol)}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Due Date</p>
                  <p className="text-lg font-semibold text-gray-900">{formatDate(currentPayment.dueDate)}</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  <StatusIndicator status={currentPayment.status} />
                </div>
              </div>

              <div className="text-center">
                <Button
                  variant="primary"
                  size="lg"
                  leftIcon={<CreditCard className="h-6 w-6" />}
                  onClick={handlePayNow}
                  isLoading={loading}
                  className="px-8 py-3"
                >
                  Pay {formatCurrency(currentPayment.amount, settings.currencySymbol)} now
                </Button>
              </div>
            </div>

            <div className="flex items-center p-3 bg-white rounded-lg shadow-sm">
              <CreditCard className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Secure checkout</p>
                <p className="text-sm text-gray-500">Your payment is processed by our payment provider</p>
              </div>
            </div>
          </Card>
        )}

        {/* No Payment Due Message */}
        {!currentPayment && (
          <Card className="mb-8 bg-gradient-to-br from-green-50 to-white border-green-200">
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">All Payments Up to Date!</h2>
              <p className="text-gray-600">You have no pending payments at this time.</p>
            </div>
          </Card>
        )}

        {/* Payment History */}
        <Card title="Payment History">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Receipt
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(payment.dueDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(payment.amount, settings.currencySymbol)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusIndicator status={payment.status} size="sm" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{payment.reference || '—'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {payment.status === 'paid' && payment.receiptUrl && (
                        <button className="text-blue-600 hover:text-blue-900">
                          <Download className="h-5 w-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TenantPayments;