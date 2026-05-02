import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Button from '../../components/shared/Button';
import ComplaintsTable from '../../components/admin/ComplaintsTable';
import { api } from '../../lib/api';
import { Complaint, Room, Tenant } from '../../types';

const PAGE_SIZE = 15;

type ComplaintsApiResponse = {
  complaints: Complaint[];
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
};

const AdminComplaints: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [roomNumbers, setRoomNumbers] = useState<Record<string, string>>({});
  const [tenantNames, setTenantNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [{ data: roomsData }, { data: tenantsData }] = await Promise.all([
          api.get<{ rooms: Room[] }>('/api/rooms'),
          api.get<{ tenants: Tenant[] }>('/api/tenants'),
        ]);
        const roomMap: Record<string, string> = {};
        roomsData.rooms.forEach((room) => {
          roomMap[room.id] = `Room ${room.number}`;
        });
        setRoomNumbers(roomMap);
        const tenantMap: Record<string, string> = {};
        tenantsData.tenants.forEach((tenant) => {
          tenantMap[tenant.id] = tenant.name;
        });
        setTenantNames(tenantMap);
      } catch {
        setRoomNumbers({});
        setTenantNames({});
      }
    };
    loadMeta();
  }, []);

  const loadComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(PAGE_SIZE));
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (filterPriority !== 'all') params.set('priority', filterPriority);
      if (filterCategory !== 'all') params.set('category', filterCategory);
      const { data } = await api.get<ComplaintsApiResponse>(`/api/complaints?${params.toString()}`);
      setComplaints(data.complaints);
      if (data.totalPages != null) setTotalPages(data.totalPages);
      if (data.total != null) setTotal(data.total);
    } catch {
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterPriority, filterCategory]);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  const handleStatusChange = async (id: string, status: Complaint['status']) => {
    try {
      const { data } = await api.patch<{ complaint: Complaint }>(`/api/complaints/${id}`, { status });
      setComplaints((prev) => prev.map((c) => (c.id === id ? data.complaint : c)));
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Complaint Management</h1>
            <p className="text-gray-600">Track and resolve tenant complaints</p>
          </div>
          <Button variant="primary" leftIcon={<AlertCircle className="h-5 w-5" />}>
            Create Complaint
          </Button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status-filter"
                className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Statuses</option>
                <option value="new">New</option>
                <option value="inProgress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label htmlFor="priority-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                id="priority-filter"
                className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                value={filterPriority}
                onChange={(e) => {
                  setFilterPriority(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="category-filter"
                className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Categories</option>
                <option value="maintenance">Maintenance</option>
                <option value="neighbor">Neighbor</option>
                <option value="facility">Facility</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-16 text-gray-500 text-sm">Loading complaints…</div>
          ) : complaints.length > 0 ? (
            <ComplaintsTable
              complaints={complaints}
              roomNumbers={roomNumbers}
              tenantNames={tenantNames}
              onStatusChange={handleStatusChange}
            />
          ) : (
            <div className="text-center py-16 px-4">
              <p className="text-gray-500">No complaints match these filters.</p>
              <p className="mt-1 text-xs text-gray-400">Try clearing filters or check back later.</p>
            </div>
          )}
        </div>

        {!loading && totalPages > 1 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
            <p>
              Page {page} of {totalPages}
              {total > 0 ? ` · ${total} total` : ''}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminComplaints;
