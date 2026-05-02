import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { AlertCircle, X } from 'lucide-react';
import Button from '../../components/shared/Button';
import Input from '../../components/shared/Input';
import ComplaintsTable from '../../components/admin/ComplaintsTable';
import { api } from '../../lib/api';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
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
  const [tenantsList, setTenantsList] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusConfirm, setStatusConfirm] = useState<{
    id: string;
    status: Complaint['status'];
  } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createConfirmOpen, setCreateConfirmOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    tenantId: '',
    roomId: '',
    title: '',
    description: '',
    category: 'maintenance' as Complaint['category'],
    priority: 'medium' as Complaint['priority'],
  });

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
        setTenantsList(tenantsData.tenants);
      } catch {
        setRoomNumbers({});
        setTenantNames({});
        setTenantsList([]);
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

  const applyStatusChange = async (id: string, status: Complaint['status']) => {
    const { data } = await api.patch<{ complaint: Complaint }>(`/api/complaints/${id}`, { status });
    setComplaints((prev) => prev.map((c) => (c.id === id ? data.complaint : c)));
  };

  const handleStatusChange = (id: string, status: Complaint['status']) => {
    if (status === 'resolved' || status === 'rejected') {
      setStatusConfirm({ id, status });
      return;
    }
    void (async () => {
      try {
        await applyStatusChange(id, status);
      } catch {
        /* optional toast */
      }
    })();
  };

  const tenantsWithRooms = tenantsList.filter((t) => t.roomId);

  const createComplaintAdmin = async () => {
    await api.post<{ complaint: Complaint }>('/api/complaints/admin', {
      tenantId: createForm.tenantId,
      roomId: createForm.roomId,
      title: createForm.title.trim(),
      description: createForm.description.trim(),
      category: createForm.category,
      priority: createForm.priority,
    });
  };

  const resetCreateForm = () => {
    setCreateForm({
      tenantId: '',
      roomId: '',
      title: '',
      description: '',
      category: 'maintenance',
      priority: 'medium',
    });
  };

  const openCreateModal = () => {
    resetCreateForm();
    setShowCreateModal(true);
  };

  return (
    <>
      <ConfirmDialog
        open={createConfirmOpen}
        onOpenChange={(o) => !o && setCreateConfirmOpen(false)}
        title="Create complaint for this tenant?"
        description={
          createForm.tenantId ? (
            <p>
              Filed as <span className="font-medium">{tenantNames[createForm.tenantId]}</span> for{' '}
              {createForm.roomId ? roomNumbers[createForm.roomId] || createForm.roomId : '—'}.
            </p>
          ) : null
        }
        confirmLabel="Create complaint"
        onConfirm={async () => {
          try {
            await createComplaintAdmin();
            toast.success('Complaint created');
            setShowCreateModal(false);
            resetCreateForm();
            if (page !== 1) setPage(1);
            else await loadComplaints();
          } catch (e) {
            toast.error('Could not create complaint');
            throw e;
          }
        }}
      />

      <ConfirmDialog
        open={!!statusConfirm}
        onOpenChange={(o) => !o && setStatusConfirm(null)}
        title={
          statusConfirm?.status === 'resolved'
            ? 'Mark this complaint as resolved?'
            : 'Reject this complaint?'
        }
        description={
          statusConfirm
            ? 'Tenants will see the updated status. This action is recorded on the complaint.'
            : null
        }
        variant={statusConfirm?.status === 'rejected' ? 'danger' : 'primary'}
        confirmLabel={statusConfirm?.status === 'resolved' ? 'Mark resolved' : 'Reject complaint'}
        onConfirm={async () => {
          if (!statusConfirm) return;
          try {
            await applyStatusChange(statusConfirm.id, statusConfirm.status);
          } catch (e) {
            toast.error('Could not update complaint');
            throw e;
          }
        }}
      />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Complaint Management</h1>
            <p className="text-gray-600">Track and resolve tenant complaints</p>
          </div>
          <Button variant="primary" leftIcon={<AlertCircle className="h-5 w-5" />} onClick={openCreateModal}>
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

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Create complaint (admin)</h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600"
                onClick={() => {
                  setShowCreateModal(false);
                  resetCreateForm();
                }}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!createForm.tenantId || !createForm.roomId || !createForm.title.trim()) {
                  toast.error('Select a tenant with a room and enter a title');
                  return;
                }
                setCreateConfirmOpen(true);
              }}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tenant</label>
                <select
                  className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm"
                  value={createForm.tenantId}
                  required
                  onChange={(e) => {
                    const id = e.target.value;
                    const t = tenantsList.find((x) => x.id === id);
                    setCreateForm((prev) => ({
                      ...prev,
                      tenantId: id,
                      roomId: t?.roomId || '',
                    }));
                  }}
                >
                  <option value="">Select tenant</option>
                  {tenantsWithRooms.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                {tenantsWithRooms.length === 0 && (
                  <p className="text-xs text-amber-700 mt-1">No tenants with an assigned room.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                <input
                  className="block w-full rounded-md border border-gray-300 bg-gray-50 py-2 px-3 text-sm text-gray-600"
                  readOnly
                  value={createForm.roomId ? roomNumbers[createForm.roomId] || createForm.roomId : '—'}
                />
              </div>
              <Input
                label="Title"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 min-h-[100px]"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm"
                    value={createForm.category}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, category: e.target.value as Complaint['category'] })
                    }
                  >
                    <option value="maintenance">Maintenance</option>
                    <option value="neighbor">Neighbor</option>
                    <option value="facility">Facility</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm"
                    value={createForm.priority}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, priority: e.target.value as Complaint['priority'] })
                    }
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetCreateForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Submit…
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminComplaints;
