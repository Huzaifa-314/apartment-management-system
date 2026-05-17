import React, { useEffect, useState } from 'react';
import { User, Mail, Phone, Calendar, Upload, Camera, FileText, MapPin, Plus, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../../shared/Modal';
import Input from '../../shared/Input';
import Button from '../../shared/Button';
import { api } from '../../../lib/api';
import { Tenant, Room } from '../../../types';

interface TenantFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Tenant | null;
  vacantRooms: Room[];
  allRooms: Room[];
  onCreated?: (tenant: Tenant) => void;
  onUpdated?: (tenant: Tenant) => void;
}

type CreateForm = {
  name: string;
  email: string;
  phone: string;
  alternatePhone: string;
  roomId: string;
  moveInDate: string;
  leaseEndDate: string;
  rentAmount: string;
  securityDeposit: string;
  address: { street: string; city: string; pincode: string };
  emergencyContact: { name: string; phone: string; relationship: string };
  documents: {
    profilePicture: File | null;
    voterId: File | null;
    leaseAgreement: File | null;
  };
  occupation: { type: string; company: string; designation: string; workAddress: string };
};

const emptyCreateForm = (): CreateForm => ({
  name: '',
  email: '',
  phone: '',
  alternatePhone: '',
  roomId: '',
  moveInDate: '',
  leaseEndDate: '',
  rentAmount: '',
  securityDeposit: '',
  address: { street: '', city: '', pincode: '' },
  emergencyContact: { name: '', phone: '', relationship: '' },
  documents: { profilePicture: null, voterId: null, leaseAgreement: null },
  occupation: { type: 'employed', company: '', designation: '', workAddress: '' },
});

const TenantFormModal: React.FC<TenantFormModalProps> = ({
  open,
  onOpenChange,
  initial,
  vacantRooms,
  allRooms,
  onCreated,
  onUpdated,
}) => {
  const isEdit = !!initial;
  const [submitting, setSubmitting] = useState(false);
  const [createData, setCreateData] = useState<CreateForm>(emptyCreateForm);
  const [editData, setEditData] = useState({
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

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setEditData({
        name: initial.name,
        phone: initial.phone || '',
        alternatePhone: initial.alternatePhone || '',
        roomId: initial.roomId || '',
        moveInDate: initial.moveInDate ? initial.moveInDate.slice(0, 10) : '',
        leaseEndDate: initial.leaseEndDate ? initial.leaseEndDate.slice(0, 10) : '',
        rentAmount: '',
        securityDeposit: '',
        emergencyContact: {
          name: initial.emergencyContact?.name || '',
          phone: initial.emergencyContact?.phone || '',
          relationship: initial.emergencyContact?.relationship || '',
        },
      });
    } else {
      setCreateData(emptyCreateForm());
    }
  }, [open, initial]);

  const handleFileChange = (field: keyof CreateForm['documents']) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setCreateData((prev) => ({
          ...prev,
          documents: { ...prev.documents, [field]: file },
        }));
      }
    };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('name', createData.name);
      fd.append('email', createData.email);
      fd.append('phone', createData.phone);
      fd.append('alternatePhone', createData.alternatePhone);
      fd.append('roomId', createData.roomId);
      fd.append('moveInDate', createData.moveInDate);
      fd.append('leaseEndDate', createData.leaseEndDate);
      fd.append('rentAmount', createData.rentAmount);
      fd.append('securityDeposit', createData.securityDeposit);
      fd.append('address', JSON.stringify(createData.address));
      fd.append('emergencyContact', JSON.stringify(createData.emergencyContact));
      fd.append('occupation', JSON.stringify(createData.occupation));
      if (createData.documents.profilePicture) fd.append('profilePicture', createData.documents.profilePicture);
      if (createData.documents.voterId) fd.append('voterId', createData.documents.voterId);
      if (createData.documents.leaseAgreement) fd.append('leaseAgreement', createData.documents.leaseAgreement);
      const { data } = await api.post<{ tenant: Tenant }>('/api/tenants', fd);
      toast.success('Tenant registered');
      onCreated?.(data.tenant);
      onOpenChange(false);
    } catch {
      toast.error('Could not register tenant');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initial) return;
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name: editData.name,
        phone: editData.phone,
        alternatePhone: editData.alternatePhone,
        moveInDate: editData.moveInDate,
        leaseEndDate: editData.leaseEndDate,
        emergencyContact: JSON.stringify(editData.emergencyContact),
      };
      if (editData.roomId !== initial.roomId) payload.roomId = editData.roomId;
      if (editData.rentAmount) payload.rentAmount = editData.rentAmount;
      if (editData.securityDeposit) payload.securityDeposit = editData.securityDeposit;
      const { data } = await api.patch<{ tenant: Tenant }>(`/api/tenants/${initial.id}`, payload);
      toast.success('Tenant updated');
      onUpdated?.(data.tenant);
      onOpenChange(false);
    } catch {
      toast.error('Could not update tenant');
    } finally {
      setSubmitting(false);
    }
  };

  const formId = isEdit ? 'tenant-edit-form' : 'tenant-create-form';

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? `Edit Tenant — ${initial?.name}` : 'Register New Tenant'}
      size="2xl"
      loading={submitting}
      footer={
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            variant="primary"
            isLoading={submitting}
            leftIcon={isEdit ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          >
            {isEdit ? 'Save Changes' : 'Register Tenant'}
          </Button>
        </div>
      }
    >
      {isEdit ? (
        <form id={formId} onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              required
            />
            <Input
              label="Phone"
              value={editData.phone}
              onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
            />
            <Input
              label="Alternate Phone"
              value={editData.alternatePhone}
              onChange={(e) => setEditData({ ...editData, alternatePhone: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
              <select
                className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                value={editData.roomId}
                onChange={(e) => setEditData({ ...editData, roomId: e.target.value })}
              >
                <option value="">No Room</option>
                {initial?.roomId && allRooms.find((r) => r.id === initial.roomId) && (
                  <option value={initial.roomId}>
                    Room {allRooms.find((r) => r.id === initial.roomId)?.number} (current)
                  </option>
                )}
                {vacantRooms
                  .filter((r) => r.id !== initial?.roomId)
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      Room {r.number} — Floor {r.floor} ({r.rent.toLocaleString()})
                    </option>
                  ))}
              </select>
            </div>
            <Input
              type="date"
              label="Move In Date"
              value={editData.moveInDate}
              onChange={(e) => setEditData({ ...editData, moveInDate: e.target.value })}
            />
            <Input
              type="date"
              label="Lease End Date"
              value={editData.leaseEndDate}
              onChange={(e) => setEditData({ ...editData, leaseEndDate: e.target.value })}
            />
            <Input
              type="number"
              label="Monthly Rent"
              value={editData.rentAmount}
              onChange={(e) => setEditData({ ...editData, rentAmount: e.target.value })}
              placeholder="Leave blank to keep current"
            />
            <Input
              type="number"
              label="Security Deposit"
              value={editData.securityDeposit}
              onChange={(e) => setEditData({ ...editData, securityDeposit: e.target.value })}
              placeholder="Leave blank to keep current"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Emergency Contact</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                label="Name"
                value={editData.emergencyContact.name}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    emergencyContact: { ...editData.emergencyContact, name: e.target.value },
                  })
                }
              />
              <Input
                label="Phone"
                value={editData.emergencyContact.phone}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    emergencyContact: { ...editData.emergencyContact, phone: e.target.value },
                  })
                }
              />
              <Input
                label="Relationship"
                value={editData.emergencyContact.relationship}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    emergencyContact: {
                      ...editData.emergencyContact,
                      relationship: e.target.value,
                    },
                  })
                }
              />
            </div>
          </div>
        </form>
      ) : (
        <form id={formId} onSubmit={handleCreateSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-base font-medium text-gray-900 border-b pb-2">
              Personal Information
            </h3>

            <div className="flex justify-center mb-2">
              <div className="relative">
                <div className="w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {createData.documents.profilePicture ? (
                    <img
                      src={URL.createObjectURL(createData.documents.profilePicture)}
                      alt="Profile Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera className="h-10 w-10 text-gray-400" />
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
              value={createData.name}
              onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
              leftIcon={<User className="h-5 w-5 text-gray-400" />}
              required
            />
            <Input
              type="email"
              label="Email Address"
              value={createData.email}
              onChange={(e) => setCreateData({ ...createData, email: e.target.value })}
              leftIcon={<Mail className="h-5 w-5 text-gray-400" />}
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Phone Number"
                value={createData.phone}
                onChange={(e) => setCreateData({ ...createData, phone: e.target.value })}
                leftIcon={<Phone className="h-5 w-5 text-gray-400" />}
                required
              />
              <Input
                label="Alternate Phone"
                value={createData.alternatePhone}
                onChange={(e) => setCreateData({ ...createData, alternatePhone: e.target.value })}
                leftIcon={<Phone className="h-5 w-5 text-gray-400" />}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-medium text-gray-900 border-b pb-2">
              Room & Lease Details
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
              <select
                className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                value={createData.roomId}
                onChange={(e) => setCreateData({ ...createData, roomId: e.target.value })}
                required
              >
                <option value="">Select vacant room</option>
                {vacantRooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    Room {room.number} — Floor {room.floor} ({room.rent.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="date"
                label="Move In Date"
                value={createData.moveInDate}
                onChange={(e) => setCreateData({ ...createData, moveInDate: e.target.value })}
                leftIcon={<Calendar className="h-5 w-5 text-gray-400" />}
                required
              />
              <Input
                type="date"
                label="Lease End Date"
                value={createData.leaseEndDate}
                onChange={(e) => setCreateData({ ...createData, leaseEndDate: e.target.value })}
                leftIcon={<Calendar className="h-5 w-5 text-gray-400" />}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="number"
                label="Monthly Rent"
                value={createData.rentAmount}
                onChange={(e) => setCreateData({ ...createData, rentAmount: e.target.value })}
                required
              />
              <Input
                type="number"
                label="Security Deposit"
                value={createData.securityDeposit}
                onChange={(e) => setCreateData({ ...createData, securityDeposit: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-medium text-gray-900 border-b pb-2">Current Address</h3>
            <Input
              label="Street Address"
              value={createData.address.street}
              onChange={(e) =>
                setCreateData({
                  ...createData,
                  address: { ...createData.address, street: e.target.value },
                })
              }
              leftIcon={<MapPin className="h-5 w-5 text-gray-400" />}
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="City"
                value={createData.address.city}
                onChange={(e) =>
                  setCreateData({
                    ...createData,
                    address: { ...createData.address, city: e.target.value },
                  })
                }
                required
              />
              <Input
                label="PIN Code"
                value={createData.address.pincode}
                onChange={(e) =>
                  setCreateData({
                    ...createData,
                    address: { ...createData.address, pincode: e.target.value },
                  })
                }
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-medium text-gray-900 border-b pb-2">
              Occupation Details
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Occupation Type
              </label>
              <select
                value={createData.occupation.type}
                onChange={(e) =>
                  setCreateData({
                    ...createData,
                    occupation: { ...createData.occupation, type: e.target.value },
                  })
                }
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
            {createData.occupation.type === 'employed' && (
              <>
                <Input
                  label="Company Name"
                  value={createData.occupation.company}
                  onChange={(e) =>
                    setCreateData({
                      ...createData,
                      occupation: { ...createData.occupation, company: e.target.value },
                    })
                  }
                  required
                />
                <Input
                  label="Designation"
                  value={createData.occupation.designation}
                  onChange={(e) =>
                    setCreateData({
                      ...createData,
                      occupation: { ...createData.occupation, designation: e.target.value },
                    })
                  }
                  required
                />
                <Input
                  label="Work Address"
                  value={createData.occupation.workAddress}
                  onChange={(e) =>
                    setCreateData({
                      ...createData,
                      occupation: { ...createData.occupation, workAddress: e.target.value },
                    })
                  }
                  required
                />
              </>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-medium text-gray-900 border-b pb-2">
              Emergency Contact
            </h3>
            <Input
              label="Contact Name"
              value={createData.emergencyContact.name}
              onChange={(e) =>
                setCreateData({
                  ...createData,
                  emergencyContact: { ...createData.emergencyContact, name: e.target.value },
                })
              }
              required
            />
            <Input
              label="Contact Phone"
              value={createData.emergencyContact.phone}
              onChange={(e) =>
                setCreateData({
                  ...createData,
                  emergencyContact: { ...createData.emergencyContact, phone: e.target.value },
                })
              }
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
              <select
                value={createData.emergencyContact.relationship}
                onChange={(e) =>
                  setCreateData({
                    ...createData,
                    emergencyContact: {
                      ...createData.emergencyContact,
                      relationship: e.target.value,
                    },
                  })
                }
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

          <div className="space-y-4">
            <h3 className="text-base font-medium text-gray-900 border-b pb-2">Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Voter ID</label>
                <label className="block">
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
                        {createData.documents.voterId?.name || 'Upload Voter ID'}
                      </p>
                    </div>
                  </div>
                </label>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Lease Agreement</label>
                <label className="block">
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
                        {createData.documents.leaseAgreement?.name || 'Upload Lease Agreement (PDF)'}
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default TenantFormModal;
