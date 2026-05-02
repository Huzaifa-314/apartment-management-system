import React, { useState, useEffect, useMemo } from 'react';
import { User, Mail, Phone, Plus, Calendar, Upload, Camera, FileText, MapPin, Pencil, Trash2, Search } from 'lucide-react';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Input from '../../components/shared/Input';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { Tenant, Room } from '../../types';

const AdminTenants: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [vacantRooms, setVacantRooms] = useState<Room[]>([]);
  const [allRooms, setAllRooms] = useState<Room[]>([]);

  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [editTenantData, setEditTenantData] = useState({
    name: '',
    phone: '',
    alternatePhone: '',
    roomId: '',
    moveInDate: '',
    leaseEndDate: '',
    rentAmount: '',
    securityDeposit: '',
    emergencyContact: { name: '', phone: '', relationship: '' },
  });
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

  const handleEditOpen = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setEditTenantData({
      name: tenant.name,
      phone: tenant.phone || '',
      alternatePhone: tenant.alternatePhone || '',
      roomId: tenant.roomId || '',
      moveInDate: tenant.moveInDate ? tenant.moveInDate.slice(0, 10) : '',
      leaseEndDate: tenant.leaseEndDate ? tenant.leaseEndDate.slice(0, 10) : '',
      rentAmount: '',
      securityDeposit: '',
      emergencyContact: {
        name: tenant.emergencyContact?.name || '',
        phone: tenant.emergencyContact?.phone || '',
        relationship: tenant.emergencyContact?.relationship || '',
      },
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;
    try {
      const payload: Record<string, unknown> = {
        name: editTenantData.name,
        phone: editTenantData.phone,
        alternatePhone: editTenantData.alternatePhone,
        moveInDate: editTenantData.moveInDate,
        leaseEndDate: editTenantData.leaseEndDate,
        emergencyContact: JSON.stringify(editTenantData.emergencyContact),
      };
      if (editTenantData.roomId !== editingTenant.roomId) {
        payload.roomId = editTenantData.roomId;
      }
      if (editTenantData.rentAmount) payload.rentAmount = editTenantData.rentAmount;
      if (editTenantData.securityDeposit) payload.securityDeposit = editTenantData.securityDeposit;
      const { data } = await api.patch<{ tenant: Tenant }>(`/api/tenants/${editingTenant.id}`, payload);
      setTenants(prev => prev.map(t => t.id === data.tenant.id ? data.tenant : t));
      const { data: r } = await api.get<{ rooms: Room[] }>('/api/rooms/public');
      setVacantRooms(r.rooms);
    } catch {
      /* ignore */
    }
    setEditingTenant(null);
  };

  const executeDeleteTenant = async () => {
    if (!deleteConfirmTenant) return;
    await api.delete(`/api/tenants/${deleteConfirmTenant.id}`);
    const id = deleteConfirmTenant.id;
    setTenants((prev) => prev.filter((t) => t.id !== id));
    const { data: r } = await api.get<{ rooms: Room[] }>('/api/rooms/public');
    setVacantRooms(r.rooms);
  };
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    alternatePhone: '',
    roomId: '',
    moveInDate: '',
    leaseEndDate: '',
    rentAmount: '',
    securityDeposit: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
    },
    emergencyContact: {
      name: '',
      phone: '',
      relationship: '',
    },
    documents: {
      profilePicture: null as File | null,
      voterId: null as File | null,
      aadharCard: null as File | null,
      leaseAgreement: null as File | null,
    },
    occupation: {
      type: 'employed',
      company: '',
      designation: '',
      workAddress: '',
    },
  });

  const handleFileChange = (field: keyof typeof formData.documents) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        documents: {
          ...prev.documents,
          [field]: file
        }
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('name', formData.name);
    fd.append('email', formData.email);
    fd.append('phone', formData.phone);
    fd.append('alternatePhone', formData.alternatePhone);
    fd.append('roomId', formData.roomId);
    fd.append('moveInDate', formData.moveInDate);
    fd.append('leaseEndDate', formData.leaseEndDate);
    fd.append('rentAmount', formData.rentAmount);
    fd.append('securityDeposit', formData.securityDeposit);
    fd.append('address', JSON.stringify(formData.address));
    fd.append('emergencyContact', JSON.stringify(formData.emergencyContact));
    fd.append('occupation', JSON.stringify(formData.occupation));
    if (formData.documents.profilePicture) fd.append('profilePicture', formData.documents.profilePicture);
    if (formData.documents.voterId) fd.append('voterId', formData.documents.voterId);
    if (formData.documents.aadharCard) fd.append('aadharCard', formData.documents.aadharCard);
    if (formData.documents.leaseAgreement) fd.append('leaseAgreement', formData.documents.leaseAgreement);

    try {
      const { data } = await api.post<{ tenant: Tenant }>('/api/tenants', fd);
      setTenants(prev => [...prev, data.tenant]);
      const { data: r } = await api.get<{ rooms: Room[] }>('/api/rooms/public');
      setVacantRooms(r.rooms);
    } catch {
      /* ignore */
    }
    
    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      alternatePhone: '',
      roomId: '',
      moveInDate: '',
      leaseEndDate: '',
      rentAmount: '',
      securityDeposit: '',
      address: {
        street: '',
        city: '',
        state: '',
        pincode: '',
      },
      emergencyContact: {
        name: '',
        phone: '',
        relationship: '',
      },
      documents: {
        profilePicture: null,
        voterId: null,
        aadharCard: null,
        leaseAgreement: null,
      },
      occupation: {
        type: 'employed',
        company: '',
        designation: '',
        workAddress: '',
      },
    });
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

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Tenant Management</h1>
          <p className="text-gray-600">Add and manage tenant information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add Tenant Form */}
          <Card title="Register New Tenant" className="lg:col-span-1">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Personal Information</h3>
                
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {formData.documents.profilePicture ? (
                        <img 
                          src={URL.createObjectURL(formData.documents.profilePicture)} 
                          alt="Profile Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Camera className="h-12 w-12 text-gray-400" />
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700">
                      <Camera className="h-4 w-4" />
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange('profilePicture')}
                      />
                    </label>
                  </div>
                </div>

                <Input
                  label="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  leftIcon={<User className="h-5 w-5 text-gray-400" />}
                  required
                />

                <Input
                  type="email"
                  label="Email Address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  leftIcon={<Mail className="h-5 w-5 text-gray-400" />}
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Phone Number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    leftIcon={<Phone className="h-5 w-5 text-gray-400" />}
                    required
                  />

                  <Input
                    label="Alternate Phone"
                    value={formData.alternatePhone}
                    onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                    leftIcon={<Phone className="h-5 w-5 text-gray-400" />}
                  />
                </div>
              </div>

              {/* Room and Lease Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Room & Lease Details</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                  <select
                    className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    value={formData.roomId}
                    onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                    required
                  >
                    <option value="">Select vacant room</option>
                    {vacantRooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        Room {room.number} — Floor {room.floor} (₹{room.rent})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    type="date"
                    label="Move In Date"
                    value={formData.moveInDate}
                    onChange={(e) => setFormData({ ...formData, moveInDate: e.target.value })}
                    leftIcon={<Calendar className="h-5 w-5 text-gray-400" />}
                    required
                  />

                  <Input
                    type="date"
                    label="Lease End Date"
                    value={formData.leaseEndDate}
                    onChange={(e) => setFormData({ ...formData, leaseEndDate: e.target.value })}
                    leftIcon={<Calendar className="h-5 w-5 text-gray-400" />}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    type="number"
                    label="Monthly Rent (₹)"
                    value={formData.rentAmount}
                    onChange={(e) => setFormData({ ...formData, rentAmount: e.target.value })}
                    required
                  />

                  <Input
                    type="number"
                    label="Security Deposit (₹)"
                    value={formData.securityDeposit}
                    onChange={(e) => setFormData({ ...formData, securityDeposit: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Current Address */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Current Address</h3>
                
                <Input
                  label="Street Address"
                  value={formData.address.street}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, street: e.target.value }
                  })}
                  leftIcon={<MapPin className="h-5 w-5 text-gray-400" />}
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="City"
                    value={formData.address.city}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: { ...formData.address, city: e.target.value }
                    })}
                    required
                  />

                  <Input
                    label="State"
                    value={formData.address.state}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: { ...formData.address, state: e.target.value }
                    })}
                    required
                  />
                </div>

                <Input
                  label="PIN Code"
                  value={formData.address.pincode}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, pincode: e.target.value }
                  })}
                  required
                />
              </div>

              {/* Occupation Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Occupation Details</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Occupation Type
                  </label>
                  <select
                    value={formData.occupation.type}
                    onChange={(e) => setFormData({
                      ...formData,
                      occupation: { ...formData.occupation, type: e.target.value }
                    })}
                    className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    required
                  >
                    <option value="employed">Employed</option>
                    <option value="self-employed">Self Employed</option>
                    <option value="student">Student</option>
                    <option value="retired">Retired</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {formData.occupation.type === 'employed' && (
                  <>
                    <Input
                      label="Company Name"
                      value={formData.occupation.company}
                      onChange={(e) => setFormData({
                        ...formData,
                        occupation: { ...formData.occupation, company: e.target.value }
                      })}
                      required
                    />

                    <Input
                      label="Designation"
                      value={formData.occupation.designation}
                      onChange={(e) => setFormData({
                        ...formData,
                        occupation: { ...formData.occupation, designation: e.target.value }
                      })}
                      required
                    />

                    <Input
                      label="Work Address"
                      value={formData.occupation.workAddress}
                      onChange={(e) => setFormData({
                        ...formData,
                        occupation: { ...formData.occupation, workAddress: e.target.value }
                      })}
                      required
                    />
                  </>
                )}
              </div>

              {/* Emergency Contact */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Emergency Contact</h3>
                
                <Input
                  label="Contact Name"
                  value={formData.emergencyContact.name}
                  onChange={(e) => setFormData({
                    ...formData,
                    emergencyContact: { ...formData.emergencyContact, name: e.target.value }
                  })}
                  required
                />

                <Input
                  label="Contact Phone"
                  value={formData.emergencyContact.phone}
                  onChange={(e) => setFormData({
                    ...formData,
                    emergencyContact: { ...formData.emergencyContact, phone: e.target.value }
                  })}
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relationship
                  </label>
                  <select
                    value={formData.emergencyContact.relationship}
                    onChange={(e) => setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact, relationship: e.target.value }
                    })}
                    className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    required
                  >
                    <option value="">Select Relationship</option>
                    <option value="Parent">Parent</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Friend">Friend</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Documents Upload */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Documents</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Voter ID
                    </label>
                    <div className="flex items-center space-x-2">
                      <label className="flex-1">
                        <div className="relative">
                          <input
                            type="file"
                            className="hidden"
                            onChange={handleFileChange('voterId')}
                            accept="image/*,.pdf"
                          />
                          <div className="flex items-center justify-center px-6 py-4 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-500 cursor-pointer">
                            <div className="text-center">
                              <Upload className="mx-auto h-6 w-6 text-gray-400" />
                              <p className="mt-1 text-sm text-gray-500">
                                {formData.documents.voterId?.name || 'Upload Voter ID'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Aadhar Card
                    </label>
                    <div className="flex items-center space-x-2">
                      <label className="flex-1">
                        <div className="relative">
                          <input
                            type="file"
                            className="hidden"
                            onChange={handleFileChange('aadharCard')}
                            accept="image/*,.pdf"
                          />
                          <div className="flex items-center justify-center px-6 py-4 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-500 cursor-pointer">
                            <div className="text-center">
                              <Upload className="mx-auto h-6 w-6 text-gray-400" />
                              <p className="mt-1 text-sm text-gray-500">
                                {formData.documents.aadharCard?.name || 'Upload Aadhar Card'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Lease Agreement
                  </label>
                  <div className="flex items-center space-x-2">
                    <label className="flex-1">
                      <div className="relative">
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleFileChange('leaseAgreement')}
                          accept=".pdf"
                        />
                        <div className="flex items-center justify-center px-6 py-4 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-500 cursor-pointer">
                          <div className="text-center">
                            <FileText className="mx-auto h-6 w-6 text-gray-400" />
                            <p className="mt-1 text-sm text-gray-500">
                              {formData.documents.leaseAgreement?.name || 'Upload Lease Agreement (PDF)'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                leftIcon={<Plus className="h-5 w-5" />}
              >
                Register Tenant
              </Button>
            </form>
          </Card>

          {/* Tenants List */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-xl font-semibold">
                Current Tenants ({filteredTenants.length}
                {tenantSearch.trim() ? ` of ${tenants.length}` : ''})
              </h2>
              <div className="w-full max-w-md">
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

            {/* Edit Tenant Modal */}
            {editingTenant && (
              <Card className="border-2 border-blue-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Edit Tenant — {editingTenant.name}</h3>
                  <Button variant="secondary" onClick={() => setEditingTenant(null)}>Cancel</Button>
                </div>
                <form onSubmit={handleEditSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Full Name"
                      value={editTenantData.name}
                      onChange={(e) => setEditTenantData({ ...editTenantData, name: e.target.value })}
                      required
                    />
                    <Input
                      label="Phone"
                      value={editTenantData.phone}
                      onChange={(e) => setEditTenantData({ ...editTenantData, phone: e.target.value })}
                    />
                    <Input
                      label="Alternate Phone"
                      value={editTenantData.alternatePhone}
                      onChange={(e) => setEditTenantData({ ...editTenantData, alternatePhone: e.target.value })}
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                      <select
                        className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                        value={editTenantData.roomId}
                        onChange={(e) => setEditTenantData({ ...editTenantData, roomId: e.target.value })}
                      >
                        <option value="">No Room</option>
                        {/* Current room (may be occupied) */}
                        {editingTenant.roomId && allRooms.find(r => r.id === editingTenant.roomId) && (
                          <option value={editingTenant.roomId}>
                            Room {allRooms.find(r => r.id === editingTenant.roomId)?.number} (current)
                          </option>
                        )}
                        {/* Other vacant rooms */}
                        {vacantRooms.filter(r => r.id !== editingTenant.roomId).map(r => (
                          <option key={r.id} value={r.id}>
                            Room {r.number} — Floor {r.floor} (₹{r.rent})
                          </option>
                        ))}
                      </select>
                    </div>
                    <Input
                      type="date"
                      label="Move In Date"
                      value={editTenantData.moveInDate}
                      onChange={(e) => setEditTenantData({ ...editTenantData, moveInDate: e.target.value })}
                    />
                    <Input
                      type="date"
                      label="Lease End Date"
                      value={editTenantData.leaseEndDate}
                      onChange={(e) => setEditTenantData({ ...editTenantData, leaseEndDate: e.target.value })}
                    />
                    <Input
                      type="number"
                      label="Monthly Rent (₹)"
                      value={editTenantData.rentAmount}
                      onChange={(e) => setEditTenantData({ ...editTenantData, rentAmount: e.target.value })}
                      placeholder="Leave blank to keep current"
                    />
                    <Input
                      type="number"
                      label="Security Deposit (₹)"
                      value={editTenantData.securityDeposit}
                      onChange={(e) => setEditTenantData({ ...editTenantData, securityDeposit: e.target.value })}
                      placeholder="Leave blank to keep current"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Emergency Contact</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input
                        label="Name"
                        value={editTenantData.emergencyContact.name}
                        onChange={(e) => setEditTenantData({
                          ...editTenantData,
                          emergencyContact: { ...editTenantData.emergencyContact, name: e.target.value }
                        })}
                      />
                      <Input
                        label="Phone"
                        value={editTenantData.emergencyContact.phone}
                        onChange={(e) => setEditTenantData({
                          ...editTenantData,
                          emergencyContact: { ...editTenantData.emergencyContact, phone: e.target.value }
                        })}
                      />
                      <Input
                        label="Relationship"
                        value={editTenantData.emergencyContact.relationship}
                        onChange={(e) => setEditTenantData({
                          ...editTenantData,
                          emergencyContact: { ...editTenantData.emergencyContact, relationship: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" variant="primary">Save Changes</Button>
                  </div>
                </form>
              </Card>
            )}

            {filteredTenants.map((tenant) => (
              <Card key={tenant.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-medium">{tenant.name}</h3>
                    <p className="text-gray-600">{tenant.email}</p>
                    <p className="text-gray-600">{tenant.phone}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Room:{' '}
                      {allRooms.find((r) => r.id === tenant.roomId)?.number ?? tenant.roomId ?? '—'}
                    </p>
                    <div className="mt-2 text-sm">
                      <p>Move In: {new Date(tenant.moveInDate).toLocaleDateString()}</p>
                      <p>Lease End: {new Date(tenant.leaseEndDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4 shrink-0">
                    <button
                      onClick={() => handleEditOpen(tenant)}
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