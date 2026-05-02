import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search, Eye } from 'lucide-react';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Input from '../../components/shared/Input';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import TenantFormModal from '../../components/admin/modals/TenantFormModal';
import TenantDetailsModal from '../../components/admin/modals/TenantDetailsModal';
import { Tenant, Room } from '../../types';

const AdminTenants: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [vacantRooms, setVacantRooms] = useState<Room[]>([]);
  const [allRooms, setAllRooms] = useState<Room[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [viewingTenant, setViewingTenant] = useState<Tenant | null>(null);
  const [deleteConfirmTenant, setDeleteConfirmTenant] = useState<Tenant | null>(null);
  const [tenantSearch, setTenantSearch] = useState('');

  const filteredTenants = useMemo(() => {
    const q = tenantSearch.trim().toLowerCase();
    if (!q) return tenants;
    return tenants.filter((t) => {
      const room = allRooms.find((r) => r.id === t.roomId);
      const roomNum = room ? String(room.number) : '';
      return (
        t.name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        roomNum.includes(q)
      );
    });
  }, [tenants, allRooms, tenantSearch]);

  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: t }, { data: r }, { data: all }] = await Promise.all([
          api.get<{ tenants: Tenant[] }>('/api/tenants'),
          api.get<{ rooms: Room[] }>('/api/rooms/public'),
          api.get<{ rooms: Room[] }>('/api/rooms'),
        ]);
        setTenants(t.tenants);
        setVacantRooms(r.rooms);
        setAllRooms(all.rooms);
      } catch {
        setTenants([]);
      }
    };
    load();
  }, []);

  const refreshVacantRooms = async () => {
    try {
      const { data: r } = await api.get<{ rooms: Room[] }>('/api/rooms/public');
      setVacantRooms(r.rooms);
    } catch {
      /* ignore */
    }
  };

  const handleCreated = async (tenant: Tenant) => {
    setTenants((prev) => [...prev, tenant]);
    await refreshVacantRooms();
  };

  const handleUpdated = async (tenant: Tenant) => {
    setTenants((prev) => prev.map((t) => (t.id === tenant.id ? tenant : t)));
    await refreshVacantRooms();
  };

  const executeDeleteTenant = async () => {
    if (!deleteConfirmTenant) return;
    await api.delete(`/api/tenants/${deleteConfirmTenant.id}`);
    const id = deleteConfirmTenant.id;
    setTenants((prev) => prev.filter((t) => t.id !== id));
    await refreshVacantRooms();
  };

  return (
    <>
      <ConfirmDialog
        open={!!deleteConfirmTenant}
        onOpenChange={(o) => !o && setDeleteConfirmTenant(null)}
        title={deleteConfirmTenant ? `Delete ${deleteConfirmTenant.name}?` : 'Delete tenant?'}
        description="This will permanently delete the tenant account and vacate their room. This cannot be undone."
        variant="danger"
        confirmLabel="Delete tenant"
        onConfirm={async () => {
          try {
            await executeDeleteTenant();
          } catch (e) {
            toast.error('Could not delete tenant');
            throw e;
          }
        }}
      />

      <TenantFormModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        vacantRooms={vacantRooms}
        allRooms={allRooms}
        onCreated={handleCreated}
      />

      <TenantFormModal
        open={!!editingTenant}
        onOpenChange={(o) => !o && setEditingTenant(null)}
        initial={editingTenant}
        vacantRooms={vacantRooms}
        allRooms={allRooms}
        onUpdated={handleUpdated}
      />

      <TenantDetailsModal
        open={!!viewingTenant}
        onOpenChange={(o) => !o && setViewingTenant(null)}
        tenant={viewingTenant}
        rooms={allRooms}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenant Management</h1>
          <p className="text-gray-600">Add and manage tenant information</p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-5 w-5" />}
          onClick={() => setCreateOpen(true)}
        >
          Add Tenant
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-xl font-semibold">
            Current Tenants ({filteredTenants.length}
            {tenantSearch.trim() ? ` of ${tenants.length}` : ''})
          </h2>
          <div className="w-full sm:max-w-md">
            <Input
              placeholder="Search by name, email, or room number…"
              value={tenantSearch}
              onChange={(e) => setTenantSearch(e.target.value)}
              leftIcon={<Search className="h-5 w-5 text-gray-400" />}
              fullWidth
            />
          </div>
        </div>

        {filteredTenants.length === 0 && (
          <Card className="border-dashed border-gray-200">
            <p className="text-center text-gray-500 py-8 text-sm">
              {tenants.length === 0
                ? 'No tenants registered yet.'
                : 'No tenants match your search.'}
            </p>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTenants.map((tenant) => (
            <Card key={tenant.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <h3 className="text-lg font-medium truncate">{tenant.name}</h3>
                  <p className="text-gray-600 text-sm truncate">{tenant.email}</p>
                  <p className="text-gray-600 text-sm">{tenant.phone}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Room:{' '}
                    {allRooms.find((r) => r.id === tenant.roomId)?.number ?? tenant.roomId ?? '—'}
                  </p>
                  <div className="mt-2 text-sm">
                    <p>Move In: {new Date(tenant.moveInDate).toLocaleDateString()}</p>
                    <p>Lease End: {new Date(tenant.leaseEndDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex gap-1 ml-3 shrink-0">
                  <button
                    onClick={() => setViewingTenant(tenant)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
                    title="View tenant"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingTenant(tenant)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                    title="Edit tenant"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmTenant(tenant)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                    title="Delete tenant"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium">Emergency Contact</p>
                <p className="text-sm text-gray-600">
                  {tenant.emergencyContact?.name} ({tenant.emergencyContact?.relationship})
                </p>
                <p className="text-sm text-gray-600">{tenant.emergencyContact?.phone}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
};

export default AdminTenants;
