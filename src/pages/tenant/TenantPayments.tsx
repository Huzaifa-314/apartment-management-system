import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Download, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import StatusIndicator from '../../components/shared/StatusIndicator';
import { useAuth } from '../../context/AuthContext';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { api } from '../../lib/api';
import { formatAmount } from '../../lib/formatAmount';
import { selectCurrentPayment } from '../../lib/paymentUtils';
import PaymentDetailsModal from '../../components/shared/PaymentDetailsModal';
import { Payment, Tenant, Room } from '../../types';
import { downloadPaymentReceiptPdf } from '../../lib/downloadPaymentReceipt';
import { format, parseISO } from 'date-fns';

const TenantPayments: React.FC = () => {
  const { user } = useAuth();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [roomLabels, setRoomLabels] = useState<Record<string, string>>({});
  const [roomsById, setRoomsById] = useState<Record<string, Room>>({});
  const [tenantProfile, setTenantProfile] = useState<Tenant | null>(null);
  const [detailPayment, setDetailPayment] = useState<Payment | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'tenant') return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get<{ tenant: Tenant }>('/api/tenants/me');
        if (!cancelled) setTenantProfile(data.tenant);
      } catch {
        if (!cancelled) setTenantProfile(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

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

    // Returning from Stripe Checkout or SSLCommerz (via API redirect)
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const tranId = params.get('tran_id');
    const paymentId = params.get('payment_id');
    const valId = params.get('val_id');
    const cancelled = params.get('cancelled');
    const failed = params.get('failed');

    if (failed) {
      setError('Payment failed. Please try again.');
      window.history.replaceState({}, '', '/tenant/payments');
    } else if (cancelled) {
      setError('Payment was cancelled. Please try again.');
      window.history.replaceState({}, '', '/tenant/payments');
    } else if (sessionId) {
      confirmStripePayment(sessionId);
    } else if (tranId && paymentId) {
      confirmSslPayment(tranId, paymentId, valId);
    }
  }, [user]);

  useEffect(() => {
    if (payments.length === 0) return;
    const ids = [...new Set(payments.map((p) => p.roomId))];
    let cancelled = false;
    (async () => {
      const nextLabels: Record<string, string> = {};
      const nextRooms: Record<string, Room> = {};
      await Promise.all(
        ids.map(async (id) => {
          try {
            const { data } = await api.get<{ room: Room }>(`/api/rooms/${id}`);
            nextLabels[id] = `Room ${data.room.number}`;
            nextRooms[id] = data.room;
          } catch {
            nextLabels[id] = `Room ${id.slice(0, 8)}`;
          }
        })
      );
      if (!cancelled) {
        setRoomLabels((prev) => ({ ...prev, ...nextLabels }));
        setRoomsById((prev) => ({ ...prev, ...nextRooms }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [payments]);

  const currentPayment = selectCurrentPayment(payments);

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const goToCheckoutConfirmation = () => {
    if (!currentPayment) return;
    navigate(`/tenant/payments/checkout/${currentPayment.id}`);
  };

  const handleDownloadReceipt = (payment: Payment) => {
    if (!user || user.role !== 'tenant') return;
    const tenant = tenantProfile ?? (user as Tenant);
    const room = roomsById[payment.roomId];
    downloadPaymentReceiptPdf({
      payment,
      propertyName: settings.propertyName,
      tenant: {
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        alternatePhone: tenant.alternatePhone,
      },
      room: {
        label: roomLabels[payment.roomId] ?? `Room ${payment.roomId.slice(0, 8)}`,
        number: room?.number,
        floor: room?.floor,
        type: room?.type,
        area: room?.area,
      },
    });
  };

  const confirmStripePayment = async (sessionId: string) => {
    try {
      const { data } = await api.get<{ ok: boolean; payment: Payment }>(
        `/api/payments/confirm-checkout?session_id=${encodeURIComponent(sessionId)}`
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

  const confirmSslPayment = async (
    tranId: string,
    payId: string,
    valId: string | null
  ) => {
    try {
      const qs = new URLSearchParams({
        tran_id: tranId,
        payment_id: payId,
      });
      if (valId) qs.set('val_id', valId);
      const { data } = await api.get<{ ok: boolean; payment: Payment }>(
        `/api/payments/confirm-checkout?${qs.toString()}`
      );
      if (data.ok) {
        setPayments(prev =>
          prev.map(p => (p.id === data.payment.id ? data.payment : p))
        );
        window.history.replaceState({}, '', '/tenant/payments');
      }
    } catch (err) {
      console.error('Payment confirmation failed:', err);
      try {
        const { data } = await api.get<{ payments: Payment[] }>('/api/payments');
        const found = data.payments?.find(p => p.id === payId);
        if (found?.status === 'paid') {
          setPayments(
            data.payments.sort(
              (a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
            )
          );
          setError(null);
          window.history.replaceState({}, '', '/tenant/payments');
          return;
        }
      } catch {
        /* ignore */
      }
      setError('Could not confirm payment. If you were charged, contact support.');
    }
  };

  const detailRoom = detailPayment ? roomsById[detailPayment.roomId] : undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <PaymentDetailsModal
        open={!!detailPayment}
        onOpenChange={(o) => !o && setDetailPayment(null)}
        payment={detailPayment}
        propertyName={settings.propertyName}
        tenantName={tenantProfile?.name ?? user?.name ?? '—'}
        tenantEmail={tenantProfile?.email ?? user?.email}
        tenantPhone={tenantProfile?.phone ?? user?.phone}
        tenantAlternatePhone={tenantProfile?.alternatePhone}
        roomLabel={detailPayment ? roomLabels[detailPayment.roomId] ?? '—' : '—'}
        roomNumber={detailRoom?.number}
        roomFloor={detailRoom?.floor}
        roomType={detailRoom?.type}
        roomArea={detailRoom?.area}
        onDownloadPdf={
          detailPayment?.status === 'paid'
            ? () => detailPayment && handleDownloadReceipt(detailPayment)
            : undefined
        }
      />

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
                {formatAmount(currentPayment.amount)}
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
                    {formatAmount(currentPayment.amount)}
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
                  onClick={goToCheckoutConfirmation}
                  className="px-8 py-3"
                >
                  Review &amp; pay {formatAmount(currentPayment.amount)}
                </Button>
              </div>
            </div>

            <div className="flex items-center p-3 bg-white rounded-lg shadow-sm">
              <CreditCard className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Secure checkout</p>
                <p className="text-sm text-gray-500">
                  You will confirm on the next screen before going to our payment provider
                </p>
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
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
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
                        {formatAmount(payment.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusIndicator status={payment.status} size="sm" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{payment.reference || '—'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        type="button"
                        className="text-blue-600 hover:text-blue-900 inline-flex"
                        onClick={() => setDetailPayment(payment)}
                        aria-label="View payment details"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {payment.status === 'paid' && (
                        <button
                          type="button"
                          className="text-blue-600 hover:text-blue-900"
                          onClick={() => handleDownloadReceipt(payment)}
                          aria-label="Download PDF receipt"
                        >
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