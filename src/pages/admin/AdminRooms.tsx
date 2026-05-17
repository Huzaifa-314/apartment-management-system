import React, { useState, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import RoomCard from '../../components/admin/RoomCard';
import Button from '../../components/shared/Button';
import Input from '../../components/shared/Input';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import RoomFormModal, { RoomFormData } from '../../components/admin/modals/RoomFormModal';
import RoomDetailsModal from '../../components/admin/modals/RoomDetailsModal';
import { Room, Tenant } from '../../types';

const AdminRooms: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterFloor, setFilterFloor] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tenantMap, setTenantMap] = useState<Record<string, string>>({});
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deleteConfirmRoom, setDeleteConfirmRoom] = useState<Room | null>(null);
  const [pendingCreate, setPendingCreate] = useState<RoomFormData | null>(null);
  const [tenantsList, setTenantsList] = useState<Tenant[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: roomsData }, { data: tenantsData }] = await Promise.all([
          api.get<{ rooms: Room[] }>('/api/rooms'),
          api.get<{ tenants: Tenant[] }>('/api/tenants'),
        ]);
        setAllRooms(roomsData.rooms);
        setTenantsList(tenantsData.tenants);
        const map: Record<string, string> = {};
        tenantsData.tenants.forEach((tenant: Tenant) => {
          if (tenant.roomId) {
            map[tenant.roomId] = tenant.name;
          }
        });
        setTenantMap(map);
      } catch {
        setAllRooms([]);
        setTenantsList([]);
      }
    };
    load();
  }, []);

  const handleRoomFormSubmit = async (data: RoomFormData, mode: 'create' | 'edit') => {
    if (mode === 'create') {
      setPendingCreate(data);
      return;
    }
    if (!editingRoom) return;
    try {
      const { data: res } = await api.patch<{ room: Room }>(`/api/rooms/${editingRoom.id}`, {
        number: data.number,
        floor: parseInt(data.floor, 10),
        type: data.type,
        status: data.status,
        rent: parseInt(data.rent, 10),
        area: parseInt(data.area, 10),
        amenities: data.amenities,
      });
      setAllRooms((prev) => prev.map((r) => (r.id === res.room.id ? res.room : r)));
      toast.success('Room updated');
      setEditingRoom(null);
    } catch {
      toast.error('Could not update room');
    }
  };

  const executeAddRoom = async () => {
    if (!pendingCreate) return;
    const { data } = await api.post<{ room: Room }>('/api/rooms', {
      number: pendingCreate.number,
      floor: parseInt(pendingCreate.floor, 10),
      type: pendingCreate.type,
      rent: parseInt(pendingCreate.rent, 10),
      status: 'vacant',
      area: parseInt(pendingCreate.area, 10),
      amenities: pendingCreate.amenities,
    });
    setAllRooms((prev) => [...prev, data.room]);
    setShowAddRoom(false);
    setPendingCreate(null);
  };

  const executeDeleteRoom = async () => {
    if (!deleteConfirmRoom) return;
    await api.delete(`/api/rooms/${deleteConfirmRoom.id}`);
    const id = deleteConfirmRoom.id;
    setAllRooms((prev) => prev.filter((r) => r.id !== id));
  };

  const getTenant = (roomId: string) => {
    return tenantsList.find((tenant) => tenant.roomId === roomId);
  };

  useEffect(() => {
    let filteredRooms = [...allRooms];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredRooms = filteredRooms.filter((room) =>
        room.number.toLowerCase().includes(query)
      );
    }

    if (filterStatus !== 'all') {
      filteredRooms = filteredRooms.filter((room) => room.status === filterStatus);
    }

    if (filterFloor !== 'all') {
      const floor = parseInt(filterFloor, 10);
      filteredRooms = filteredRooms.filter((room) => room.floor === floor);
    }

    if (filterType !== 'all') {
      filteredRooms = filteredRooms.filter((room) => room.type === filterType);
    }

    setRooms(filteredRooms);
  }, [searchQuery, filterStatus, filterFloor, filterType, allRooms]);

  return (
    <>
      <ConfirmDialog
        open={!!pendingCreate}
        onOpenChange={(o) => !o && setPendingCreate(null)}
        title="Create this room?"
        description={
          pendingCreate ? (
            <p>
              Room <span className="font-medium">{pendingCreate.number || '—'}</span>, floor{' '}
              {pendingCreate.floor}, rent {pendingCreate.rent != null ? Number(pendingCreate.rent).toLocaleString() : '—'}/mo will be added as vacant.
            </p>
          ) : null
        }
        confirmLabel="Create room"
        onConfirm={async () => {
          try {
            await executeAddRoom();
            toast.success('Room created');
          } catch (e) {
            toast.error('Could not create room');
            throw e;
          }
        }}
      />

      <ConfirmDialog
        open={!!deleteConfirmRoom}
        onOpenChange={(o) => !o && setDeleteConfirmRoom(null)}
        title={deleteConfirmRoom ? `Delete room ${deleteConfirmRoom.number}?` : 'Delete room?'}
        description="This action cannot be undone."
        variant="danger"
        confirmLabel="Delete room"
        onConfirm={async () => {
          try {
            await executeDeleteRoom();
            toast.success('Room deleted');
          } catch (e) {
            toast.error('Could not delete room');
            throw e;
          }
        }}
      />

      <RoomFormModal
        open={showAddRoom}
        onOpenChange={setShowAddRoom}
        onSubmit={handleRoomFormSubmit}
      />

      <RoomFormModal
        open={!!editingRoom}
        onOpenChange={(o) => !o && setEditingRoom(null)}
        initial={editingRoom}
        onSubmit={handleRoomFormSubmit}
      />

      <RoomDetailsModal
        open={!!selectedRoom}
        onOpenChange={(o) => !o && setSelectedRoom(null)}
        room={selectedRoom}
        tenant={selectedRoom ? getTenant(selectedRoom.id) : null}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Room Management</h1>
          <p className="text-gray-600">Manage and monitor all your rooms</p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-5 w-5" />}
          onClick={() => setShowAddRoom(true)}
        >
          Add New Room
        </Button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Search rooms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="h-5 w-5 text-gray-400" />}
            fullWidth
          />

          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status-filter"
              className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="occupied">Occupied</option>
              <option value="vacant">Vacant</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          <div>
            <label htmlFor="floor-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Floor
            </label>
            <select
              id="floor-filter"
              className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              value={filterFloor}
              onChange={(e) => setFilterFloor(e.target.value)}
            >
              <option value="all">All Floors</option>
              <option value="1">Floor 1</option>
              <option value="2">Floor 2</option>
              <option value="3">Floor 3</option>
              <option value="4">Floor 4</option>
              <option value="5">Floor 5</option>
            </select>
          </div>

          <div>
            <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Room Type
            </label>
            <select
              id="type-filter"
              className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="single">Single</option>
              <option value="double">Double</option>
              <option value="premium">Premium</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {rooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            tenantName={tenantMap[room.id]}
            onViewDetails={() => setSelectedRoom(room)}
            onEdit={() => setEditingRoom(room)}
            onDelete={() => setDeleteConfirmRoom(room)}
          />
        ))}
      </div>

      {rooms.length === 0 && (
        <div className="text-center py-12 rounded-lg border border-dashed border-gray-200 bg-gray-50/80">
          <p className="text-gray-600">
            {allRooms.length === 0
              ? 'No rooms yet. Use "Add New Room" to create your first room.'
              : 'No rooms match your filters. Try different criteria.'}
          </p>
        </div>
      )}
    </>
  );
};

export default AdminRooms;
