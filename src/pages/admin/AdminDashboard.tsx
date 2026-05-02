import React, { useState, useEffect } from 'react';
import { BarChart, Activity, ArrowUp, ArrowDown } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Card from '../../components/shared/Card';
import DashboardStats from '../../components/admin/DashboardStats';
import DashboardAI from '../../components/admin/DashboardAI';
import { api } from '../../lib/api';
import { Payment, Complaint, Room } from '../../types';
import { format, subDays } from 'date-fns';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

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
  const [revenueData, setRevenueData] = useState<{labels: string[], datasets: Array<{label: string, data: number[], backgroundColor: string, borderColor: string, borderWidth: number}>}>({
    labels: [],
    datasets: [{
      label: 'Monthly Revenue',
      data: [],
      backgroundColor: 'rgba(59, 130, 246, 0.5)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 2,
    }],
  });
  const [occupancyData, setOccupancyData] = useState<{labels: string[], datasets: Array<{label: string, data: number[], backgroundColor: string, borderColor: string, borderWidth: number, tension: number, fill: boolean}>}>({
    labels: [],
    datasets: [{
      label: 'Occupancy Trend',
      data: [],
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      borderColor: 'rgba(16, 185, 129, 1)',
      borderWidth: 2,
      tension: 0.4,
      fill: true,
    }],
  });
  const [complaintData, setComplaintData] = useState<{labels: string[], datasets: Array<{label: string, data: number[], backgroundColor: string[]}>}>({
    labels: [],
    datasets: [{
      label: 'Complaints by Status',
      data: [],
      backgroundColor: [],
    }],
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: s }, { data: pay }, { data: comp }, { data: roomsData }] = await Promise.all([
          api.get('/api/dashboard/stats'),
          api.get<{ payments: Payment[] }>('/api/payments'),
          api.get<{ complaints: Complaint[] }>('/api/complaints'),
          api.get<{ rooms: Room[] }>('/api/rooms'),
        ]);
        setStats(s as typeof stats);
        setPayments(pay.payments);
        setComplaints(comp.complaints);
        setPendingPayList(pay.payments.filter(p => p.status === 'pending').slice(0, 4));
        setNewComplaintsList(comp.complaints.filter(c => c.status === 'new').slice(0, 4));
        const rm: Record<string, string> = {};
        roomsData.rooms.forEach((r: Room) => {
          rm[r.id] = r.number;
        });
        setRoomLabels(rm);

        // Aggregate payment data by month
        const months: Record<string, number> = {};
        pay.payments.forEach((p: Payment) => {
          if (p.status === 'paid' && p.date) {
            const date = new Date(p.date);
            const monthKey = format(date, 'MMM yyyy');
            months[monthKey] = (months[monthKey] || 0) + p.amount;
          }
        });

        const sortedMonths = Object.keys(months).sort((a, b) => {
          return new Date(a).getTime() - new Date(b).getTime();
        }).slice(-6);

        setRevenueData({
          labels: sortedMonths,
          datasets: [{
            label: 'Monthly Revenue',
            data: sortedMonths.map(m => months[m]),
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 2,
          }],
        });

        // Occupancy trend
        const occupancyTrend = Array.from({ length: 7 }).map(() => {
          const occupied = s.occupiedRooms || 0;
          const total = s.totalRooms || 1;
          return Math.round((occupied / total) * 100);
        });
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = subDays(new Date(), 6 - i);
          return format(date, 'MMM dd');
        });

        setOccupancyData({
          labels: last7Days,
          datasets: [{
            label: 'Occupancy Rate',
            data: occupancyTrend,
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderColor: 'rgba(16, 185, 129, 1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true,
          }],
        });

        // Complaint status breakdown
        const complaintStatuses: Record<string, number> = {};
        const statusColors: Record<string, string> = {
          'new': 'rgba(59, 130, 246, 0.8)',
          'in_progress': 'rgba(245, 158, 11, 0.8)',
          'resolved': 'rgba(16, 185, 129, 0.8)',
        };

        comp.complaints.forEach((c: Complaint) => {
          complaintStatuses[c.status] = (complaintStatuses[c.status] || 0) + 1;
        });

        const statusLabels = Object.keys(complaintStatuses);
        const statusCounts = statusLabels.map(s => complaintStatuses[s]);
        const colors = statusLabels.map(s => statusColors[s] || 'rgba(107, 114, 128, 0.8)');

        setComplaintData({
          labels: statusLabels.map(s => s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')),
          datasets: [{
            label: 'Complaints by Status',
            data: statusCounts,
            backgroundColor: colors,
          }],
        });
      } catch {
        /* ignore */
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here's an overview of your properties.</p>
          </div>
          <div className="text-sm text-gray-600">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </div>
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
          <DashboardAI />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card title="Revenue Overview" subtitle="Last 6 months">
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

          <Card title="Occupancy Trend" subtitle="Last 7 days">
            <div className="h-80">
              <Line
                data={occupancyData}
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
                      max: 100,
                      ticks: {
                        callback: (value) => `${value}%`,
                      },
                    },
                  },
                }}
              />
            </div>
          </Card>
        </div>

        <div className="mb-8">
          <Card title="Complaint Status Breakdown">
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
          <Card title="Recent Activity">
            <div className="space-y-4">
              {[
                { icon: <BarChart className="h-5 w-5 text-blue-500" />, text: "Monthly report generated", time: "2 hours ago" },
                { icon: <Activity className="h-5 w-5 text-green-500" />, text: "New tenant onboarded", time: "Yesterday" },
                { icon: <ArrowUp className="h-5 w-5 text-green-500" />, text: "Rent increased for premium rooms", time: "2 days ago" },
                { icon: <ArrowDown className="h-5 w-5 text-red-500" />, text: "Maintenance scheduled for Room 301", time: "3 days ago" },
              ].map((item, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="p-2 bg-gray-100 rounded-full">{item.icon}</div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.text}</p>
                    <p className="text-xs text-gray-500">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Upcoming Payments">
            <div className="space-y-3">
              {pendingPayList
                .map((payment) => {
                  const dueDate = new Date(payment.dueDate);
                  return (
                    <div key={payment.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <div>
                        <p className="text-sm font-medium">Room {roomLabels[payment.roomId] || payment.roomId.slice(-6)}</p>
                        <p className="text-xs text-gray-500">Due: {format(dueDate, 'MMM d, yyyy')}</p>
                      </div>
                      <p className="text-sm font-semibold text-blue-600">₹{payment.amount.toLocaleString()}</p>
                    </div>
                  );
                })}
            </div>
            <div className="mt-4 text-center">
              <a href="/admin/payments" className="text-sm font-medium text-blue-600 hover:text-blue-800">
                View all payments
              </a>
            </div>
          </Card>

          <Card title="Recent Complaints">
            <div className="space-y-3">
              {newComplaintsList
                .map((complaint) => (
                  <div key={complaint.id} className="p-3 bg-gray-50 rounded-md">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium">{complaint.title}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        complaint.priority === 'high'
                          ? 'bg-red-100 text-red-800'
                          : complaint.priority === 'medium'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-green-100 text-green-800'
                      }`}>
                        {complaint.priority}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Room {roomLabels[complaint.roomId] || complaint.roomId.slice(-6)} • {format(new Date(complaint.createdAt), 'MMM d')}
                    </p>
                  </div>
                ))}
            </div>
            <div className="mt-4 text-center">
              <a href="/admin/complaints" className="text-sm font-medium text-blue-600 hover:text-blue-800">
                View all complaints
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;