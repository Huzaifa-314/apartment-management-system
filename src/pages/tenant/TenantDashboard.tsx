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
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { api } from '../../lib/api';
import { formatCurrency } from '../../lib/formatCurrency';
import { selectCurrentPayment } from '../../lib/paymentUtils';
import { Room, Payment, Complaint, Tenant, AnnouncementItem } from '../../types';
import { format, parseISO } from 'date-fns';

const TenantDashboard: React.FC = () => {
  const { user } = useAuth();
  const { settings } = useSiteSettings();
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <WelcomeMessage userName={tenant.name} />

        {/* Quick overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          <Card className="border border-slate-200 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Rent</p>
                {currentPayment ?
                  <>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(currentPayment.amount, settings.currencySymbol)}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Due {formatDate(currentPayment.dueDate)} ·{' '}
                      <StatusIndicator status={currentPayment.status} size="sm" />
                    </p>
                  </>
                : <p className="text-lg font-medium text-green-700">All caught up</p>}
              </div>
            </div>
          </Card>
          <Card className="border border-slate-200 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-violet-50 text-violet-700">
                <MessageSquareWarning className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Requests</p>
                <p className="text-lg font-semibold text-gray-900">{openComplaintCount} open</p>
                <Link
                  to="/tenant/complaints"
                  className="text-xs text-blue-600 hover:text-blue-800 inline-flex items-center gap-0.5 mt-0.5"
                >
                  View complaints <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </Card>
          <Card className="border border-slate-200 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-sky-50 text-sky-700">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Lease</p>
                <p className="text-sm font-medium text-gray-900">Ends {formatDate(tenant.leaseEndDate)}</p>
                <Link
                  to="/tenant/profile"
                  className="text-xs text-blue-600 hover:text-blue-800 inline-flex items-center gap-0.5 mt-0.5"
                >
                  Profile & documents <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-2 space-y-6">
            <Announcements announcements={announcements} loading={false} />
          </div>
          <div>
            <ContactManagement />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <Card
            title="Your room"
            className="lg:col-span-2 bg-gradient-to-br from-blue-50 to-white border-blue-100"
          >
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className="flex items-center mb-4">
                  <Home className="h-6 w-6 text-blue-600 mr-2" />
                  <h3 className="text-xl font-semibold text-gray-900">
                    {room ? `Room ${room.number}` : 'No room assigned'}
                  </h3>
                </div>

                {room ?
                  <>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Floor</p>
                        <p className="font-medium">{room.floor}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Type</p>
                        <p className="font-medium capitalize">{room.type}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Area</p>
                        <p className="font-medium">{room.area} sq.ft</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Monthly rent</p>
                        <p className="font-medium text-blue-700">
                          {formatCurrency(room.rent, settings.currencySymbol)}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-2">Amenities</p>
                      <div className="flex flex-wrap gap-2">
                        {room.amenities.map((amenity, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                : <p className="text-gray-600">When a room is assigned, details will appear here.</p>}
              </div>

              <div className="flex-1">
                <div className="flex items-center mb-4">
                  <Calendar className="h-6 w-6 text-blue-600 mr-2" />
                  <h3 className="text-xl font-semibold text-gray-900">Lease details</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Move-in date</p>
                    <p className="font-medium">{formatDate(tenant.moveInDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Lease end date</p>
                    <p className="font-medium">{formatDate(tenant.leaseEndDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Emergency contact</p>
                    <p className="font-medium">
                      {tenant.emergencyContact?.name} ({tenant.emergencyContact?.relationship})
                    </p>
                    <p className="text-sm">{tenant.emergencyContact?.phone}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card
            title="Payment status"
            className={`${currentPayment ? 'bg-gradient-to-br from-amber-50 to-white border-amber-100' : 'bg-gradient-to-br from-green-50 to-white border-green-100'}`}
          >
            <div className="space-y-4">
              {currentPayment ?
                <>
                  <div className="flex justify-between items-center gap-2">
                    <div>
                      <p className="text-sm text-gray-600">Amount due</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(currentPayment.amount, settings.currencySymbol)}
                      </p>
                    </div>
                    <StatusIndicator status={currentPayment.status} />
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Due date</p>
                    <p className="font-medium">{formatDate(currentPayment.dueDate)}</p>
                  </div>

                  <Button
                    variant="primary"
                    fullWidth
                    leftIcon={<CreditCard className="h-5 w-5" />}
                    onClick={handlePayNow}
                  >
                    Pay now
                  </Button>
                </>
              : <div className="text-center py-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mb-4">
                    <Receipt className="h-6 w-6" />
                  </div>
                  <p className="text-xl font-medium text-gray-900">All payments up to date</p>
                  <p className="text-sm text-gray-600 mt-1">No pending balance</p>
                </div>
              }
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <Card title="Recent payments" className="bg-white shadow-lg">
            {payments.length > 0 ?
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Due
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {payments.slice(0, 5).map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                            {formatDate(payment.dueDate)}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                            {formatCurrency(payment.amount, settings.currencySymbol)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <StatusIndicator status={payment.status} size="sm" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-center">
                  <Button variant="secondary" onClick={() => navigate('/tenant/payments')}>
                    View all payments
                  </Button>
                </div>
              </>
            : <div className="text-center py-10">
                <Receipt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No payment history yet</h3>
                <p className="text-gray-500 mb-4 text-sm">
                  Your ledger will show charges once the office posts them.
                </p>
              </div>
            }
          </Card>

          <Card title="Recent complaints" className="bg-white shadow-lg">
            {recentComplaints.length > 0 ?
              <>
                <ul className="divide-y divide-gray-100">
                  {recentComplaints.map((c) => (
                    <li key={c.id} className="py-3 flex justify-between gap-3 items-start">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{c.title}</p>
                        <p className="text-xs text-gray-500">
                          {format(parseISO(c.createdAt), 'MMM d, yyyy')} · {c.category}
                        </p>
                      </div>
                      <StatusIndicator status={c.status} size="sm" />
                    </li>
                  ))}
                </ul>
                <div className="mt-4 text-center">
                  <Button variant="secondary" onClick={() => navigate('/tenant/complaints')}>
                    Manage complaints
                  </Button>
                </div>
              </>
            : <div className="text-center py-10">
                <MessageSquareWarning className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 text-sm">You have not submitted any complaints yet.</p>
                <Button
                  variant="primary"
                  className="mt-4"
                  onClick={() => navigate('/tenant/complaints')}
                >
                  Submit a request
                </Button>
              </div>
            }
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TenantDashboard;
