import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Download, FileText } from 'lucide-react';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import { api } from '../../lib/api';
import { Payment, Room, Tenant } from '../../types';
import { Link, useNavigate } from 'react-router-dom';

type StatsShape = {
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  maintenanceRooms: number;
  totalTenants: number;
  pendingComplaints: number;
  financialSummary: {
    totalRevenue: number;
    pendingAmount: number;
    overdueAmount: number;
    collectionRate: number;
    occupancyRate: number;
  };
};

const AdminReports: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<StatsShape | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get<StatsShape>('/api/dashboard/stats');
        setStats(data);
      } catch {
        toast.error('Could not load report data');
        setStats(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const exportPaymentsCsv = async () => {
    try {
      const [{ data: pay }, { data: roomsData }, { data: tenantsData }] = await Promise.all([
        api.get<{ payments: Payment[] }>('/api/payments'),
        api.get<{ rooms: Room[] }>('/api/rooms'),
        api.get<{ tenants: Tenant[] }>('/api/tenants'),
      ]);
      const roomMap: Record<string, string> = {};
      roomsData.rooms.forEach((room) => {
        roomMap[room.id] = `Room ${room.number}`;
      });
      const tenantMap: Record<string, string> = {};
      tenantsData.tenants.forEach((tenant) => {
        tenantMap[tenant.id] = tenant.name;
      });
      const headers = ['Date', 'Room', 'Tenant', 'Amount', 'Status', 'Reference'];
      const csvContent = [
        headers.join(','),
        ...pay.payments.map((payment) =>
          [
            payment.date,
            roomMap[payment.roomId],
            tenantMap[payment.tenantId],
            payment.amount,
            payment.status,
            payment.reference || '',
          ].join(',')
        ),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payments-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Payments export downloaded');
    } catch {
      toast.error('Export failed');
    }
  };

  const fs = stats?.financialSummary;

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600">Financial snapshot and data exports</p>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading summary…</p>}

      {!loading && stats && fs && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card title="Occupancy">
            <p className="text-3xl font-bold text-blue-600">{fs.occupancyRate.toFixed(1)}%</p>
            <p className="text-sm text-gray-600 mt-2">
              {stats.occupiedRooms} occupied · {stats.vacantRooms} vacant · {stats.maintenanceRooms}{' '}
              maintenance · {stats.totalRooms} total rooms
            </p>
          </Card>
          <Card title="Revenue">
            <p className="text-2xl font-bold text-emerald-600">₹{fs.totalRevenue.toLocaleString()}</p>
            <p className="text-sm text-gray-600 mt-2">Paid rent recorded to date</p>
          </Card>
          <Card title="Outstanding">
            <p className="text-2xl font-bold text-amber-700">₹{fs.pendingAmount.toLocaleString()}</p>
            <p className="text-sm text-gray-600 mt-2">
              Pending · ₹{fs.overdueAmount.toLocaleString()} overdue · Collection{' '}
              {fs.collectionRate.toFixed(1)}%
            </p>
          </Card>
          <Card title="Complaints queue">
            <p className="text-3xl font-bold text-red-600">{stats.pendingComplaints}</p>
            <p className="text-sm text-gray-600 mt-2">New or in-progress complaints</p>
            <Link to="/admin/complaints" className="text-sm text-blue-600 hover:text-blue-800 mt-3 inline-block">
              Open complaints →
            </Link>
          </Card>
        </div>
      )}

      <Card title="Exports" subtitle="Download CSV for spreadsheets">
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" leftIcon={<Download className="h-5 w-5" />} onClick={exportPaymentsCsv}>
            Export all payments (CSV)
          </Button>
          <Button
            variant="secondary"
            type="button"
            leftIcon={<FileText className="h-5 w-5" />}
            onClick={() => navigate('/admin/payments')}
          >
            Payment management
          </Button>
        </div>
      </Card>
    </>
  );
};

export default AdminReports;
