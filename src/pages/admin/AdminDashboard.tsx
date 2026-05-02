import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Wallet, MessageSquare, CalendarCheck } from 'lucide-react';
import Card from '../../components/shared/Card';
import DashboardStats from '../../components/admin/DashboardStats';
import DashboardInsights from '../../components/admin/DashboardInsights';
import { api } from '../../lib/api';
import { Payment, Complaint, Room } from '../../types';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

type DashboardActivity = {
  id: string;
  kind: 'payment' | 'complaint' | 'booking';
  message: string;
  occurredAt: string;
};

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalRooms: 0,
    occupiedRooms: 0,
    vacantRooms: 0,
    maintenanceRooms: 0,
    totalTenants: 0,
    pendingComplaints: 0,
    financialSummary: {
      totalRevenue: 0,
      pendingAmount: 0,
      overdueAmount: 0,
      collectionRate: 0,
      occupancyRate: 0,
    },
  });
  const [pendingPayList, setPendingPayList] = useState<Payment[]>([]);
  const [newComplaintsList, setNewComplaintsList] = useState<Complaint[]>([]);
  const [roomLabels, setRoomLabels] = useState<Record<string, string>>({});
  const [activities, setActivities] = useState<DashboardActivity[]>([]);
  const [overduePaymentCount, setOverduePaymentCount] = useState(0);
  const [highPriorityOpenComplaints, setHighPriorityOpenComplaints] = useState(0);
  const [revenueData, setRevenueData] = useState<{
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string;
      borderColor: string;
      borderWidth: number;
    }>;
  }>({
    labels: [],
    datasets: [
      {
        label: 'Monthly Revenue',
        data: [],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
      },
    ],
  });
  const [occupancyDonutData, setOccupancyDonutData] = useState({
    labels: ['Occupied', 'Vacant', 'Maintenance'],
    datasets: [
      {
        data: [0, 0, 0],
        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b'],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  });
  const [complaintData, setComplaintData] = useState<{
    labels: string[];
    datasets: Array<{ label: string; data: number[]; backgroundColor: string[] }>;
  }>({
    labels: [],
    datasets: [
      {
        label: 'Complaints by Status',
        data: [],
        backgroundColor: [],
      },
    ],
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: s }, { data: pay }, { data: comp }, { data: roomsData }, { data: act }] =
          await Promise.all([
            api.get('/api/dashboard/stats'),
            api.get<{ payments: Payment[] }>('/api/payments'),
            api.get<{ complaints: Complaint[] }>('/api/complaints'),
            api.get<{ rooms: Room[] }>('/api/rooms'),
            api.get<{ activities: DashboardActivity[] }>('/api/dashboard/activity'),
          ]);
        setStats(s as typeof stats);
        setActivities(act.activities ?? []);
        setPendingPayList(pay.payments.filter((p) => p.status === 'pending').slice(0, 4));
        setNewComplaintsList(comp.complaints.filter((c) => c.status === 'new').slice(0, 4));
        setOverduePaymentCount(pay.payments.filter((p) => p.status === 'overdue').length);
        setHighPriorityOpenComplaints(
          comp.complaints.filter(
            (c) => c.priority === 'high' && c.status !== 'resolved' && c.status !== 'rejected'
          ).length
        );

        const rm: Record<string, string> = {};
        roomsData.rooms.forEach((r: Room) => {
          rm[r.id] = r.number;
        });
        setRoomLabels(rm);

        const months: Record<string, number> = {};
        pay.payments.forEach((p: Payment) => {
          if (p.status === 'paid' && p.date) {
            const date = new Date(p.date);
            const monthKey = format(date, 'MMM yyyy');
            months[monthKey] = (months[monthKey] || 0) + p.amount;
          }
        });

        const sortedMonths = Object.keys(months)
          .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
          .slice(-6);

        setRevenueData({
          labels: sortedMonths,
          datasets: [
            {
              label: 'Monthly Revenue',
              data: sortedMonths.map((m) => months[m]),
              backgroundColor: 'rgba(59, 130, 246, 0.5)',
              borderColor: 'rgba(59, 130, 246, 1)',
              borderWidth: 2,
            },
          ],
        });

        const st = s as typeof stats;
        setOccupancyDonutData({
          labels: ['Occupied', 'Vacant', 'Maintenance'],
          datasets: [
            {
              data: [st.occupiedRooms || 0, st.vacantRooms || 0, st.maintenanceRooms || 0],
              backgroundColor: ['#10b981', '#3b82f6', '#f59e0b'],
              borderWidth: 2,
              borderColor: '#ffffff',
            },
          ],
        });

        const complaintStatuses: Record<string, number> = {};
        const statusColors: Record<string, string> = {
          new: 'rgba(59, 130, 246, 0.8)',
          inProgress: 'rgba(245, 158, 11, 0.8)',
          resolved: 'rgba(16, 185, 129, 0.8)',
          rejected: 'rgba(107, 114, 128, 0.8)',
        };

        const statusLabel = (key: string) => {
          if (key === 'inProgress') return 'In progress';
          return key.charAt(0).toUpperCase() + key.slice(1);
        };

        comp.complaints.forEach((c: Complaint) => {
          complaintStatuses[c.status] = (complaintStatuses[c.status] || 0) + 1;
        });

        const statusLabels = Object.keys(complaintStatuses);
        const statusCounts = statusLabels.map((x) => complaintStatuses[x]);
        const colors = statusLabels.map((x) => statusColors[x] || 'rgba(107, 114, 128, 0.8)');

        setComplaintData({
          labels: statusLabels.map(statusLabel),
          datasets: [
            {
              label: 'Complaints by Status',
              data: statusCounts,
              backgroundColor: colors,
            },
          ],
        });
      } catch {
        toast.error('Could not load dashboard data');
      }
    };
    load();
  }, []);

  const {
    totalRooms,
    occupiedRooms,
    vacantRooms,
    maintenanceRooms,
    totalTenants,
    pendingComplaints,
    financialSummary,
  } = stats;

  const activityIcon = (kind: DashboardActivity['kind']) => {
    switch (kind) {
      case 'payment':
        return <Wallet className="h-5 w-5 text-emerald-600" />;
      case 'complaint':
        return <MessageSquare className="h-5 w-5 text-blue-600" />;
      default:
        return <CalendarCheck className="h-5 w-5 text-amber-600" />;
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's an overview of your properties.</p>
        </div>
        <div className="text-sm text-gray-600">{format(new Date(), 'EEEE, MMMM d, yyyy')}</div>
      </div>

      <DashboardStats
        totalRooms={totalRooms}
        occupiedRooms={occupiedRooms}
        vacantRooms={vacantRooms}
        maintenanceRooms={maintenanceRooms}
        totalTenants={totalTenants}
        financialSummary={financialSummary}
        pendingComplaints={pendingComplaints}
      />

      <div className="mb-8">
        <DashboardInsights
          financialSummary={financialSummary}
          pendingComplaints={pendingComplaints}
          overduePaymentCount={overduePaymentCount}
          highPriorityOpenComplaints={highPriorityOpenComplaints}
          vacantRooms={vacantRooms}
          maintenanceRooms={maintenanceRooms}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card title="Revenue Overview" subtitle="Paid rent by month (last 6 months with data)">
          <div className="h-80">
            <Bar
              data={revenueData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: (value) => `₹${(value as number).toLocaleString()}`,
                    },
                  },
                },
              }}
            />
          </div>
        </Card>

        <Card title="Room status" subtitle="Current snapshot (all rooms)">
          <div className="h-80 flex items-center justify-center">
            <div className="w-full max-w-xs mx-auto">
              <Doughnut
                data={occupancyDonutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom' as const,
                    },
                  },
                }}
              />
            </div>
          </div>
        </Card>
      </div>

      <div className="mb-8">
        <Card title="Complaint status breakdown">
          <div className="h-80">
            <Bar
              data={complaintData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y' as const,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                },
                scales: {
                  x: {
                    beginAtZero: true,
                  },
                },
              }}
            />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card title="Recent activity" subtitle="Latest updates across payments, complaints, and bookings">
          <div className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">No recent activity yet.</p>
            ) : (
              activities.slice(0, 10).map((item) => (
                <div key={item.id} className="flex items-start space-x-3">
                  <div className="p-2 bg-gray-100 rounded-full">{activityIcon(item.kind)}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 break-words">{item.message}</p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(parseISO(item.occurredAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card title="Upcoming Payments">
          <div className="space-y-3">
            {pendingPayList.map((payment) => {
              const dueDate = new Date(payment.dueDate);
              return (
                <div
                  key={payment.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-md"
                >
                  <div>
                    <p className="text-sm font-medium">
                      Room {roomLabels[payment.roomId] || payment.roomId.slice(-6)}
                    </p>
                    <p className="text-xs text-gray-500">Due: {format(dueDate, 'MMM d, yyyy')}</p>
                  </div>
                  <p className="text-sm font-semibold text-blue-600">
                    ₹{payment.amount.toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="mt-4 text-center">
            <Link to="/admin/payments" className="text-sm font-medium text-blue-600 hover:text-blue-800">
              View all payments
            </Link>
          </div>
        </Card>

        <Card title="Recent Complaints">
          <div className="space-y-3">
            {newComplaintsList.map((complaint) => (
              <div key={complaint.id} className="p-3 bg-gray-50 rounded-md">
                <div className="flex justify-between gap-2">
                  <p className="text-sm font-medium min-w-0">{complaint.title}</p>
                  <span
                    className={`text-xs px-2 py-1 rounded-full shrink-0 ${
                      complaint.priority === 'high'
                        ? 'bg-red-100 text-red-800'
                        : complaint.priority === 'medium'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {complaint.priority}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Room {roomLabels[complaint.roomId] || complaint.roomId.slice(-6)} •{' '}
                  {format(new Date(complaint.createdAt), 'MMM d')}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <Link to="/admin/complaints" className="text-sm font-medium text-blue-600 hover:text-blue-800">
              View all complaints
            </Link>
          </div>
        </Card>
      </div>
    </>
  );
};

export default AdminDashboard;
