import React, { useState, useEffect, useMemo } from 'react';
import {
  Home,
  Receipt,
  Calendar,
  CreditCard,
  MessageSquareWarning,
  ArrowRight,
  ClipboardList,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../../components/shared/Navbar';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import StatusIndicator from '../../components/shared/StatusIndicator';
import WelcomeMessage from '../../components/tenant/WelcomeMessage';
import Announcements from '../../components/tenant/Announcements';
import ContactManagement from '../../components/tenant/ContactManagement';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { formatAmount } from '../../lib/formatAmount';
import { selectCurrentPayment } from '../../lib/paymentUtils';
import { Room, Payment, Complaint, Tenant, AnnouncementItem } from '../../types';
import { format, parseISO } from 'date-fns';

const TenantDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [bootLoading, setBootLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const { data: me } = await api.get<{ tenant: Tenant }>('/api/tenants/me');
        setTenant(me.tenant);

        const [roomRes, payRes, compRes, annRes] = await Promise.all([
          me.tenant.roomId ?
            api.get<{ room: Room }>(`/api/rooms/${me.tenant.roomId}`).catch(() => null)
          : Promise.resolve(null),
          api.get<{ payments: Payment[] }>('/api/payments'),
          api.get<{ complaints: Complaint[] }>('/api/complaints'),
          api.get<{ announcements: AnnouncementItem[] }>('/api/announcements'),
        ]);

        if (roomRes && 'data' in roomRes && roomRes.data?.room) setRoom(roomRes.data.room);
        else setRoom(null);

        setPayments(
          payRes.data.payments.sort(
            (a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
          )
        );
        setComplaints(
          compRes.data.complaints.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
        setAnnouncements(annRes.data.announcements ?? []);
      } catch {
        setTenant(null);
        setRoom(null);
        setPayments([]);
        setComplaints([]);
        setAnnouncements([]);
      } finally {
        setBootLoading(false);
      }
    };
    load();
  }, [user]);

  const currentPayment = useMemo(() => selectCurrentPayment(payments), [payments]);

  const recentComplaints = useMemo(() => complaints.slice(0, 5), [complaints]);

  const openComplaintCount = useMemo(
    () =>
      complaints.filter((c) => c.status !== 'resolved' && c.status !== 'rejected').length,
    [complaints]
  );

  if (bootLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-gray-500">Loading tenant information...</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center max-w-md">
          <p className="text-gray-700 mb-6">
            We could not load your tenant profile. Check your connection or try signing in again.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="primary" onClick={() => navigate('/login')}>
              Back to login
            </Button>
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMMM d, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const handlePayNow = () => {
    navigate('/tenant/payments');
  };

  const rentStatusLabel = currentPayment
    ? currentPayment.status === 'overdue'
      ? 'Overdue'
      : 'Due soon'
    : 'All caught up';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
        <WelcomeMessage userName={tenant.name} />

        {/* Quick stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 shrink-0">
              <CreditCard className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Rent</p>
              {currentPayment ? (
                <>
                  <p className="text-xl font-semibold text-gray-900 mt-1">
                    {formatAmount(currentPayment.amount)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Due {formatDate(currentPayment.dueDate)} · {rentStatusLabel}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xl font-semibold text-green-700 mt-1">All caught up</p>
                  <p className="text-xs text-gray-500 mt-1">No pending balance</p>
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-violet-50 text-violet-600 shrink-0">
              <MessageSquareWarning className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Open requests</p>
              <p className="text-xl font-semibold text-gray-900 mt-1">{openComplaintCount}</p>
              <Link
                to="/tenant/complaints"
                className="text-xs text-blue-600 hover:text-blue-800 inline-flex items-center gap-0.5 mt-1"
              >
                View complaints <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-sky-50 text-sky-600 shrink-0">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Lease ends</p>
              <p className="text-xl font-semibold text-gray-900 mt-1">
                {formatDate(tenant.leaseEndDate)}
              </p>
              <Link
                to="/tenant/profile"
                className="text-xs text-blue-600 hover:text-blue-800 inline-flex items-center gap-0.5 mt-1"
              >
                Profile & documents <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Room details + Payment status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card
            title="Your room & lease"
            className="lg:col-span-2"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center mb-4">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600 mr-3">
                    <Home className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">
                    {room ? `Room ${room.number}` : 'No room assigned'}
                  </h3>
                </div>

                {room ? (
                  <>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 mb-4">
                      <div>
                        <dt className="text-xs text-gray-500">Floor</dt>
                        <dd className="text-sm font-medium text-gray-900 mt-0.5">{room.floor}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">Type</dt>
                        <dd className="text-sm font-medium text-gray-900 mt-0.5 capitalize">
                          {room.type}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">Area</dt>
                        <dd className="text-sm font-medium text-gray-900 mt-0.5">
                          {room.area} sq.ft
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">Monthly rent</dt>
                        <dd className="text-sm font-semibold text-blue-700 mt-0.5">
                          {formatAmount(room.rent)}
                        </dd>
                      </div>
                    </dl>

                    {room.amenities.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Amenities</p>
                        <div className="flex flex-wrap gap-1.5">
                          {room.amenities.map((amenity, index) => (
                            <span
                              key={index}
                              className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full"
                            >
                              {amenity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-600">
                    When a room is assigned, details will appear here.
                  </p>
                )}
              </div>

              <div className="md:border-l md:border-gray-100 md:pl-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600 mr-3">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">Lease details</h3>
                </div>

                <dl className="space-y-3">
                  <div>
                    <dt className="text-xs text-gray-500">Move-in date</dt>
                    <dd className="text-sm font-medium text-gray-900 mt-0.5">
                      {formatDate(tenant.moveInDate)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Lease end date</dt>
                    <dd className="text-sm font-medium text-gray-900 mt-0.5">
                      {formatDate(tenant.leaseEndDate)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Emergency contact</dt>
                    <dd className="text-sm font-medium text-gray-900 mt-0.5">
                      {tenant.emergencyContact?.name}{' '}
                      <span className="font-normal text-gray-600">
                        ({tenant.emergencyContact?.relationship})
                      </span>
                    </dd>
                    <dd className="text-sm text-gray-600">{tenant.emergencyContact?.phone}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </Card>

          <Card title="Payment status" className="h-full">
            <div className="h-full flex flex-col">
              {currentPayment ? (
                <div className="space-y-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Amount due</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">
                        {formatAmount(currentPayment.amount)}
                      </p>
                    </div>
                    <StatusIndicator status={currentPayment.status} />
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Due date</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {formatDate(currentPayment.dueDate)}
                    </p>
                  </div>

                  <div className="mt-auto pt-2">
                    <Button
                      variant="primary"
                      fullWidth
                      leftIcon={<CreditCard className="h-5 w-5" />}
                      onClick={handlePayNow}
                    >
                      Pay now
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 text-green-600 mb-4">
                    <Receipt className="h-7 w-7" />
                  </div>
                  <p className="text-base font-semibold text-gray-900">All payments up to date</p>
                  <p className="text-sm text-gray-500 mt-1">No pending balance</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Notices + Contact */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Announcements announcements={announcements} loading={false} />
          </div>
          <div>
            <ContactManagement />
          </div>
        </div>

        {/* Recent activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Recent payments">
            {payments.length > 0 ? (
              <>
                <div className="overflow-x-auto -mx-6">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Due
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Amount
                        </th>
                        <th className="px-6 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {payments.slice(0, 5).map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-3 text-sm text-gray-900 whitespace-nowrap">
                            {formatDate(payment.dueDate)}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                            {formatAmount(payment.amount)}
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-right">
                            <StatusIndicator status={payment.status} size="sm" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                    onClick={() => navigate('/tenant/payments')}
                  >
                    View all payments
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-10">
                <Receipt className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">No payment history yet</h3>
                <p className="text-xs text-gray-500">
                  Your ledger will show charges once the office posts them.
                </p>
              </div>
            )}
          </Card>

          <Card title="Recent complaints">
            {recentComplaints.length > 0 ? (
              <>
                <ul className="divide-y divide-gray-100 -my-2">
                  {recentComplaints.map((c) => (
                    <li
                      key={c.id}
                      className="py-3 flex justify-between gap-3 items-center"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{c.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 capitalize">
                          {format(parseISO(c.createdAt), 'MMM d, yyyy')} · {c.category}
                        </p>
                      </div>
                      <StatusIndicator status={c.status} size="sm" />
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                    onClick={() => navigate('/tenant/complaints')}
                  >
                    Manage complaints
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-10">
                <MessageSquareWarning className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                <p className="text-sm text-gray-600 mb-3">
                  You have not submitted any complaints yet.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/tenant/complaints')}
                >
                  Submit a request
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TenantDashboard;
