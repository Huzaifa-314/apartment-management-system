import React, { useState, useEffect } from 'react';
import { Search, Plus, User } from 'lucide-react';
import RoomCard from '../../components/admin/RoomCard';
import Button from '../../components/shared/Button';
import Input from '../../components/shared/Input';
import Card from '../../components/shared/Card';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { Room, Tenant } from '../../types';

const AMENITY_OPTIONS = ['Water Supply', 'Electricity', 'Air Conditioning', 'Balcony', 'Premium Furnishing'];

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
  const [showRoomDetails, setShowRoomDetails] = useState(false);

  const [newRoomData, setNewRoomData] = useState({
    number: '',
    floor: '1',
    type: 'single',
    rent: '',
    area: '',
    amenities: [] as string[],
  });

  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [editRoomData, setEditRoomData] = useState({
    number: '',
    floor: '1',
    type: 'single',
    status: 'vacant',
    rent: '',
    area: '',
    amenities: [] as string[],
  });
  const [deleteConfirmRoom, setDeleteConfirmRoom] = useState<Room | null>(null);
  const [addRoomConfirmOpen, setAddRoomConfirmOpen] = useState(false);

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

  const resetNewRoomForm = () => {
    setNewRoomData({
      number: '',
      floor: '1',
      type: 'single',
      rent: '',
      area: '',
      amenities: [],
    });
  };

  const onAddRoomFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddRoomConfirmOpen(true);
  };

  const executeAddRoom = async () => {
    const { data } = await api.post<{ room: Room }>('/api/rooms', {
      number: newRoomData.number,
      floor: parseInt(newRoomData.floor, 10),
      type: newRoomData.type,
      rent: parseInt(newRoomData.rent, 10),
      status: 'vacant',
      area: parseInt(newRoomData.area, 10),
      amenities: newRoomData.amenities,
    });
    setAllRooms((prev) => [...prev, data.room]);
    setShowAddRoom(false);
    resetNewRoomForm();
  };

  const handleViewDetails = (room: Room) => {
    setSelectedRoom(room);
    setShowRoomDetails(true);
  };

  const handleEditOpen = (room: Room) => {
    setEditingRoom(room);
    setEditRoomData({
      number: room.number,
      floor: String(room.floor),
      type: room.type,
      status: room.status,
      rent: String(room.rent),
      area: String(room.area),
      amenities: [...room.amenities],
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;
    try {
      const { data } = await api.patch<{ room: Room }>(`/api/rooms/${editingRoom.id}`, {
        number: editRoomData.number,
        floor: parseInt(editRoomData.floor, 10),
        type: editRoomData.type,
        status: editRoomData.status,
        rent: parseInt(editRoomData.rent, 10),
        area: parseInt(editRoomData.area, 10),
        amenities: editRoomData.amenities,
      });
      setAllRooms(prev => prev.map(r => r.id === data.room.id ? data.room : r));
    } catch {
      /* ignore */
    }
    setEditingRoom(null);
  };

  const executeDeleteRoom = async () => {
    if (!deleteConfirmRoom) return;
    await api.delete(`/api/rooms/${deleteConfirmRoom.id}`);
    const id = deleteConfirmRoom.id;
    setAllRooms((prev) => prev.filter((r) => r.id !== id));
  };

  const getTenant = (roomId: string) => {
    return tenantsList.find(tenant => tenant.roomId === roomId);
  };

  useEffect(() => {
    let filteredRooms = [...allRooms];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredRooms = filteredRooms.filter(
        room => room.number.toLowerCase().includes(query)
      );
    }

    if (filterStatus !== 'all') {
      filteredRooms = filteredRooms.filter(room => room.status === filterStatus);
    }

    if (filterFloor !== 'all') {
      const floor = parseInt(filterFloor, 10);
      filteredRooms = filteredRooms.filter(room => room.floor === floor);
    }

    if (filterType !== 'all') {
      filteredRooms = filteredRooms.filter(room => room.type === filterType);
    }

    setRooms(filteredRooms);
  }, [searchQuery, filterStatus, filterFloor, filterType, allRooms]);

  return (
    <>
      <ConfirmDialog
        open={addRoomConfirmOpen}
        onOpenChange={(o) => !o && setAddRoomConfirmOpen(false)}
        title="Create this room?"
        description={
          <p>
            Room <span className="font-medium">{newRoomData.number || '—'}</span>, floor {newRoomData.floor}, rent ₹
            {newRoomData.rent || '—'}/mo will be added as vacant.
          </p>
        }
        confirmLabel="Create room"
        onConfirm={async () => {
          try {
            await executeAddRoom();
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
          } catch (e) {
            toast.error('Could not delete room');
            throw e;
          }
        }}
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
        
        {/* Add Room Modal */}
        {showAddRoom && (
          <Card className="mb-8">
            <form onSubmit={onAddRoomFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Room Number"
                  value={newRoomData.number}
                  onChange={(e) => setNewRoomData({ ...newRoomData, number: e.target.value })}
                  required
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Floor
                  </label>
                  <select
                    className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    value={newRoomData.floor}
                    onChange={(e) => setNewRoomData({ ...newRoomData, floor: e.target.value })}
                  >
                    <option value="1">Floor 1</option>
                    <option value="2">Floor 2</option>
                    <option value="3">Floor 3</option>
                    <option value="4">Floor 4</option>
                    <option value="5">Floor 5</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Room Type
                  </label>
                  <select
                    className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    value={newRoomData.type}
                    onChange={(e) => setNewRoomData({ ...newRoomData, type: e.target.value })}
                  >
                    <option value="single">Single</option>
                    <option value="double">Double</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
                
                <Input
                  label="Monthly Rent"
                  type="number"
                  value={newRoomData.rent}
                  onChange={(e) => setNewRoomData({ ...newRoomData, rent: e.target.value })}
                  required
                />
                
                <Input
                  label="Area (sq.ft)"
                  type="number"
                  value={newRoomData.area}
                  onChange={(e) => setNewRoomData({ ...newRoomData, area: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amenities
                </label>
                <div className="space-y-2">
                  {AMENITY_OPTIONS.map((amenity) => (
                    <label key={amenity} className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={newRoomData.amenities.includes(amenity)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewRoomData({
                              ...newRoomData,
                              amenities: [...newRoomData.amenities, amenity],
                            });
                          } else {
                            setNewRoomData({
                              ...newRoomData,
                              amenities: newRoomData.amenities.filter(a => a !== amenity),
                            });
                          }
                        }}
                      />
                      <span className="ml-2">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowAddRoom(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                >
                  Add Room
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Room Details Modal */}
        {showRoomDetails && selectedRoom && (
          <Card className="mb-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold">Room {selectedRoom.number}</h2>
                <p className="text-gray-600">Floor {selectedRoom.floor}</p>
              </div>
              <Button
                variant="secondary"
                onClick={() => setShowRoomDetails(false)}
              >
                Close
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Room Details</h3>
                <div className="space-y-3">
                  <p><span className="font-medium">Type:</span> {selectedRoom.type}</p>
                  <p><span className="font-medium">Status:</span> {selectedRoom.status}</p>
                  <p><span className="font-medium">Rent:</span> ₹{selectedRoom.rent}</p>
                  <p><span className="font-medium">Area:</span> {selectedRoom.area} sq.ft</p>
                  <div>
                    <p className="font-medium mb-2">Amenities:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedRoom.amenities.map((amenity, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Current Tenant</h3>
                {selectedRoom.tenantId ? (
                  (() => {
                    const tenant = getTenant(selectedRoom.id);
                    return tenant ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-6 w-6 text-gray-500" />
                          </div>
                          <div>
                            <p className="font-medium">{tenant.name}</p>
                            <p className="text-sm text-gray-600">{tenant.email}</p>
                          </div>
                        </div>
                        <p><span className="font-medium">Phone:</span> {tenant.phone}</p>
                        <p><span className="font-medium">Move In Date:</span> {new Date(tenant.moveInDate).toLocaleDateString()}</p>
                        <p><span className="font-medium">Lease End:</span> {new Date(tenant.leaseEndDate).toLocaleDateString()}</p>
                        <div className="mt-4">
                          <p className="font-medium mb-2">Emergency Contact:</p>
                          <p>{tenant.emergencyContact?.name}</p>
                          <p className="text-sm text-gray-600">{tenant.emergencyContact?.phone}</p>
                          <p className="text-sm text-gray-600">({tenant.emergencyContact?.relationship})</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-600">Tenant information not found</p>
                    );
                  })()
                ) : (
                  <p className="text-gray-600">No tenant currently assigned</p>
                )}
              </div>
            </div>
          </Card>
        )}
        
        {/* Edit Room Modal */}
        {editingRoom && (
          <Card className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Room {editingRoom.number}</h2>
              <Button variant="secondary" onClick={() => setEditingRoom(null)}>Cancel</Button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Room Number"
                  value={editRoomData.number}
                  onChange={(e) => setEditRoomData({ ...editRoomData, number: e.target.value })}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
                  <select
                    className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    value={editRoomData.floor}
                    onChange={(e) => setEditRoomData({ ...editRoomData, floor: e.target.value })}
                  >
                    {['1','2','3','4','5'].map(f => <option key={f} value={f}>Floor {f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                  <select
                    className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    value={editRoomData.type}
                    onChange={(e) => setEditRoomData({ ...editRoomData, type: e.target.value })}
                  >
                    <option value="single">Single</option>
                    <option value="double">Double</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    value={editRoomData.status}
                    onChange={(e) => setEditRoomData({ ...editRoomData, status: e.target.value })}
                  >
                    <option value="vacant">Vacant</option>
                    <option value="occupied">Occupied</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <Input
                  label="Monthly Rent"
                  type="number"
                  value={editRoomData.rent}
                  onChange={(e) => setEditRoomData({ ...editRoomData, rent: e.target.value })}
                  required
                />
                <Input
                  label="Area (sq.ft)"
                  type="number"
                  value={editRoomData.area}
                  onChange={(e) => setEditRoomData({ ...editRoomData, area: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amenities</label>
                <div className="space-y-2">
                  {AMENITY_OPTIONS.map((amenity) => (
                    <label key={amenity} className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={editRoomData.amenities.includes(amenity)}
                        onChange={(e) => {
                          setEditRoomData({
                            ...editRoomData,
                            amenities: e.target.checked
                              ? [...editRoomData.amenities, amenity]
                              : editRoomData.amenities.filter(a => a !== amenity),
                          });
                        }}
                      />
                      <span className="ml-2">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" variant="primary">Save Changes</Button>
              </div>
            </form>
          </Card>
        )}

        {/* Filters and Search */}
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
        
        {/* Room Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              tenantName={tenantMap[room.id]}
              onViewDetails={() => handleViewDetails(room)}
              onEdit={() => handleEditOpen(room)}
              onDelete={() => setDeleteConfirmRoom(room)}
            />
          ))}
        </div>
        
        {rooms.length === 0 && (
          <div className="text-center py-12 rounded-lg border border-dashed border-gray-200 bg-gray-50/80">
            <p className="text-gray-600">
              {allRooms.length === 0
                ? 'No rooms yet. Use “Add New Room” to create your first room.'
                : 'No rooms match your filters. Try different criteria.'}
            </p>
          </div>
        )}
    </>
  );
};

export default AdminRooms;