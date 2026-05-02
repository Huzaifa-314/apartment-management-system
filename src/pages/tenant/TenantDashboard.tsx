import React, { useState, useEffect } from 'react';
import { Home, Receipt, Calendar, CreditCard } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import StatusIndicator from '../../components/shared/StatusIndicator';
import WelcomeMessage from '../../components/tenant/WelcomeMessage';
import Announcements from '../../components/tenant/Announcements';
import ContactManagement from '../../components/tenant/ContactManagement';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Room, Payment, Complaint, Tenant } from '../../types';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const TenantDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [, setComplaints] = useState<Complaint[]>([]);
  const [bootLoading, setBootLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const { data: me } = await api.get<{ tenant: Tenant }>('/api/tenants/me');
        setTenant(me.tenant);
        if (me.tenant.roomId) {
          try {
            const { data: roomData } = await api.get<{ room: Room }>(`/api/rooms/${me.tenant.roomId}`);
            setRoom(roomData.room);
          } catch {
            setRoom(null);
          }
        } else {
          setRoom(null);
        }
        const [payRes, compRes] = await Promise.all([
          api.get<{ payments: Payment[] }>('/api/payments'),
          api.get<{ complaints: Complaint[] }>('/api/complaints'),
        ]);
        setPayments(
          payRes.data.payments.sort(
            (a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
          )
        );
        setComplaints(
          compRes.data.complaints
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5)
        );
      } catch {
        setTenant(null);
        setRoom(null);
        setPayments([]);
        setComplaints([]);
      } finally {
        setBootLoading(false);
      }
    };
    load();
  }, [user]);

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

  const currentPayment = payments.find(p => p.status !== 'paid');

  const handlePayNow = () => {
    navigate('/tenant/payments');
  };
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <WelcomeMessage userName={tenant.name} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-2">
            <Announcements />
          </div>
          <div>
            <ContactManagement />
          </div>
        </div>
        
        {/* Room Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <Card 
            title="Your Room" 
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
                
                {room ? (
                <>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Floor:</p>
                    <p className="font-medium">{room.floor}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Type:</p>
                    <p className="font-medium capitalize">{room.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Area:</p>
                    <p className="font-medium">{room.area} sq.ft</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Monthly Rent:</p>
                    <p className="font-medium text-blue-700">₹{room.rent.toLocaleString()}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-2">Amenities:</p>
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
                ) : (
                  <p className="text-gray-600">Contact the office to assign a room.</p>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center mb-4">
                  <Calendar className="h-6 w-6 text-blue-600 mr-2" />
                  <h3 className="text-xl font-semibold text-gray-900">Lease Details</h3>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Move In Date:</p>
                    <p className="font-medium">{formatDate(tenant.moveInDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Lease End Date:</p>
                    <p className="font-medium">{formatDate(tenant.leaseEndDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Emergency Contact:</p>
                    <p className="font-medium">
                      {tenant.emergencyContact?.name} ({tenant.emergencyContact?.relationship})
                    </p>
                    <p className="text-sm">{tenant.emergencyContact?.phone}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Payment Status */}
          <Card 
            title="Payment Status" 
            className={`${currentPayment ? 'bg-gradient-to-br from-amber-50 to-white border-amber-100' : 'bg-gradient-to-br from-green-50 to-white border-green-100'}`}
          >
            <div className="space-y-4">
              {currentPayment ? (
                <>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">Current Rent:</p>
                      <p className="text-2xl font-bold text-gray-900">₹{currentPayment.amount.toLocaleString()}</p>
                    </div>
                    <StatusIndicator status={currentPayment.status} />
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Due Date:</p>
                    <p className="font-medium">{formatDate(currentPayment.dueDate)}</p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-amber-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">Quick Payment</h4>
                      <CreditCard className="h-5 w-5 text-amber-600" />
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Pay your rent securely with multiple payment options
                    </p>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-500">Amount Due</p>
                        <p className="font-bold text-amber-600">₹{currentPayment.amount.toLocaleString()}</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-500">Status</p>
                        <StatusIndicator status={currentPayment.status} size="sm" />
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="primary"
                    fullWidth
                    leftIcon={<CreditCard className="h-5 w-5" />}
                    onClick={handlePayNow}
                  >
                    Pay Now
                  </Button>
                </>
              ) : (
                <div className="text-center py-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mb-4">
                    <Receipt className="h-6 w-6" />
                  </div>
                  <p className="text-xl font-medium text-gray-900">All Payments Up to Date</p>
                  <p className="text-sm text-gray-600 mt-1">No pending payments</p>
                </div>
              )}
            </div>
          </Card>
        </div>
        
        {/* Recent Payments */}
        <div className="mt-8">
          <Card title="Recent Payments" className="bg-white shadow-lg">
            {payments.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reference
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payments.slice(0, 5).map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(payment.dueDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            ₹{payment.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusIndicator status={payment.status} size="sm" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.reference || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-center">
                  <Button
                    variant="secondary"
                    onClick={() => navigate('/tenant/payments')}
                  >
                    View All Payments
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Receipt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment History</h3>
                <p className="text-gray-500 mb-4">Your payment history will appear here once payments are recorded.</p>
                <Button
                  variant="primary"
                  onClick={() => navigate('/tenant/payments')}
                >
                  Make Payment
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