import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { User, Mail, Phone, Home, Calendar, Upload, Camera, FileText, MapPin, ArrowLeft } from 'lucide-react';
import Navbar from '../components/shared/Navbar';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import Input from '../components/shared/Input';
import { api } from '../lib/api';
import {
  loadBookingDraft,
  clearBookingDraft,
  saveBookingDraftWithForm,
  snapshotFromFormState,
  applySnapshotToFormBase,
  saveBookingLeasePickSession,
  clearBookingLeasePickSession,
} from '../lib/bookingDraft';
import { fetchPublicRoom } from '../lib/roomPublicApi';
import { Room } from '../types';
import toast from 'react-hot-toast';

function initialFormState() {
  return {
    name: '',
    email: '',
    phone: '',
    alternatePhone: '',
    moveInDate: '',
    leaseEndDate: '',
    address: {
      street: '',
      city: '',
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
      incomeProof: null as File | null,
    },
    occupation: {
      type: 'employed',
      company: '',
      designation: '',
      workAddress: '',
      monthlyIncome: '',
    },
    preferences: {
      vegetarian: false,
      smoking: false,
      pets: false,
    },
    additionalNotes: '',
  };
}

type BookingLocationState = { moveInDate?: string; leaseEndDate?: string } | null;

const BookingForm: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(false);
  const [roomReadyForDraft, setRoomReadyForDraft] = useState(false);

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (!roomId) return;
    setRoomReadyForDraft(false);
    setFormData(initialFormState());
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    const load = async () => {
      try {
        const r = await fetchPublicRoom(roomId);
        setRoom(r);
      } catch {
        toast.error('Room not found');
        navigate('/rooms');
      }
    };
    load();
  }, [roomId, navigate]);

  useEffect(() => {
    if (!room || !roomId || room.id !== roomId) return;
    const draft = loadBookingDraft();
    if (draft?.roomId === roomId && draft.form) {
      const base = applySnapshotToFormBase(draft.form);
      setFormData(prev => ({
        ...prev,
        ...base,
        documents: {
          profilePicture: null,
          voterId: null,
          incomeProof: null,
        },
      }));
    }
    setRoomReadyForDraft(true);
  }, [room, roomId]);

  useEffect(() => {
    const nav = location.state as BookingLocationState;
    if (nav?.moveInDate && nav?.leaseEndDate) {
      setFormData(prev => ({
        ...prev,
        moveInDate: nav.moveInDate!,
        leaseEndDate: nav.leaseEndDate!,
      }));
    }
  }, [location.state]);

  useEffect(() => {
    if (!roomId || !room) return;
    const draft = loadBookingDraft();
    const nav = location.state as BookingLocationState;
    const fromNav = Boolean(nav?.moveInDate && nav?.leaseEndDate);
    const fromDraft =
      draft?.roomId === roomId &&
      Boolean(draft.form?.moveInDate && draft.form?.leaseEndDate);
    if (!fromNav && !fromDraft) {
      navigate(`/booking/${roomId}/dates`, { replace: true });
    }
  }, [roomId, room, navigate, location.state]);

  useEffect(() => {
    if (!roomReadyForDraft || !roomId || !room || room.id !== roomId) return;
    const t = window.setTimeout(() => {
      const snapshot = snapshotFromFormState(formData);
      saveBookingDraftWithForm(
        roomId,
        { number: room.number, floor: room.floor, type: room.type, rent: room.rent },
        snapshot
      );
    }, 450);
    return () => window.clearTimeout(t);
  }, [formData, roomId, room, roomReadyForDraft]);

  useEffect(() => {
    if (!roomId || !formData.moveInDate || !formData.leaseEndDate) return;
    saveBookingLeasePickSession(roomId, formData.moveInDate, formData.leaseEndDate);
  }, [roomId, formData.moveInDate, formData.leaseEndDate]);

  const navigateToLeaseDates = () =>
    navigate(`/booking/${roomId}/dates`, {
      state:
        formData.moveInDate && formData.leaseEndDate
          ? { moveInDate: formData.moveInDate, leaseEndDate: formData.leaseEndDate }
          : undefined,
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
    if (!roomId) return;
    if (!formData.moveInDate || !formData.leaseEndDate) {
      toast.error('Please choose move-in and lease end dates (step 1).');
      navigate(`/booking/${roomId}/dates`);
      return;
    }
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append('roomId', roomId);
      fd.append('name', formData.name);
      fd.append('email', formData.email);
      fd.append('phone', formData.phone);
      fd.append('alternatePhone', formData.alternatePhone);
      fd.append('moveInDate', formData.moveInDate);
      fd.append('leaseEndDate', formData.leaseEndDate);
      fd.append('address', JSON.stringify(formData.address));
      fd.append('emergencyContact', JSON.stringify(formData.emergencyContact));
      fd.append('occupation', JSON.stringify(formData.occupation));
      fd.append('preferences', JSON.stringify(formData.preferences));
      fd.append('additionalNotes', formData.additionalNotes);
      if (formData.documents.profilePicture) fd.append('profilePicture', formData.documents.profilePicture);
      if (formData.documents.voterId) fd.append('voterId', formData.documents.voterId);
      if (formData.documents.incomeProof) fd.append('incomeProof', formData.documents.incomeProof);

      const { data, status } = await api.post<{
        ok?: boolean;
        message?: string;
        booking?: { id: string };
      }>('/api/bookings', fd);

      if (status !== 201 || data?.ok !== true) {
        throw new Error(data?.message || 'Unexpected response from server');
      }

      clearBookingDraft();
      if (roomId) clearBookingLeasePickSession(roomId);
      const bid = data?.booking?.id;
      if (bid) {
        toast.success('Complete payment to submit your application for review.');
        navigate(`/booking/checkout/${bid}`);
      } else {
        toast.error('Booking created but checkout could not be started. Check Applications.');
        navigate('/tenant/applications');
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err && typeof (err as Error).message === 'string'
          ? (err as Error).message
          : 'Failed to submit booking application. Please try again.';
      if (err && typeof err === 'object' && 'response' in err) {
        const ax = err as { response?: { data?: { message?: string } } };
        const serverMsg = ax.response?.data?.message;
        toast.error(serverMsg || msg);
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-gray-500">Loading room information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="secondary"
            leftIcon={<ArrowLeft className="h-5 w-5" />}
            onClick={navigateToLeaseDates}
            className="mb-4"
          >
            Change dates
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Step 2 — Book Room {room.number}</h1>
          <p className="text-gray-600">Complete your application (payment is the next step)</p>
          <p className="mt-2 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
            Your answers are saved automatically as you type. Uploaded files are not stored in the draft—please
            re-attach documents before submitting.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Room Details Summary */}
          <div className="lg:col-span-1">
            <Card title="Room Details" className="sticky top-8">
              <div className="space-y-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <h3 className="text-xl font-bold text-blue-600">Room {room.number}</h3>
                  <p className="text-gray-600">Floor {room.floor}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Type:</p>
                    <p className="font-medium capitalize">{room.type}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Area:</p>
                    <p className="font-medium">{room.area} sq.ft</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-600">Monthly Rent:</p>
                    <p className="text-2xl font-bold text-blue-600">{room.rent.toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Amenities:</p>
                  <div className="flex flex-wrap gap-2">
                    {room.amenities.map((amenity, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Booking Form */}
          <div className="lg:col-span-2">
            <Card title="Booking Application Form">
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

                {/* Lease dates (from step 1) */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Your lease dates</h3>
                  <p className="text-sm text-gray-600">
                    Chosen in step 1.{' '}
                    <button
                      type="button"
                      className="text-blue-600 hover:underline font-medium"
                      onClick={navigateToLeaseDates}
                    >
                      Change dates
                    </button>
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg bg-gray-50 border border-gray-200 p-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Move-in
                      </p>
                      <p className="mt-1 flex items-center gap-2 text-gray-900 font-medium">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {formData.moveInDate || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Lease ends
                      </p>
                      <p className="mt-1 flex items-center gap-2 text-gray-900 font-medium">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {formData.leaseEndDate || '—'}
                      </p>
                    </div>
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      label="PIN Code"
                      value={formData.address.pincode}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, pincode: e.target.value }
                      })}
                      required
                    />
                  </div>
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

                  <Input
                    type="number"
                    label="Monthly Income"
                    value={formData.occupation.monthlyIncome}
                    onChange={(e) => setFormData({
                      ...formData,
                      occupation: { ...formData.occupation, monthlyIncome: e.target.value }
                    })}
                    required
                  />
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

                {/* Preferences */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Preferences</h3>
                  
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={formData.preferences.vegetarian}
                        onChange={(e) => setFormData({
                          ...formData,
                          preferences: { ...formData.preferences, vegetarian: e.target.checked }
                        })}
                      />
                      <span className="ml-2">Vegetarian</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={formData.preferences.smoking}
                        onChange={(e) => setFormData({
                          ...formData,
                          preferences: { ...formData.preferences, smoking: e.target.checked }
                        })}
                      />
                      <span className="ml-2">Smoking</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={formData.preferences.pets}
                        onChange={(e) => setFormData({
                          ...formData,
                          preferences: { ...formData.preferences, pets: e.target.checked }
                        })}
                      />
                      <span className="ml-2">Pets</span>
                    </label>
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

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Income Proof
                      </label>
                      <label className="flex-1">
                        <div className="relative">
                          <input
                            type="file"
                            className="hidden"
                            onChange={handleFileChange('incomeProof')}
                            accept=".pdf"
                          />
                          <div className="flex items-center justify-center px-6 py-4 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-500 cursor-pointer">
                            <div className="text-center">
                              <FileText className="mx-auto h-6 w-6 text-gray-400" />
                              <p className="mt-1 text-sm text-gray-500">
                                {formData.documents.incomeProof?.name || 'Upload Income Proof (PDF)'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Additional Notes */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Additional Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      value={formData.additionalNotes}
                      onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                      rows={4}
                      className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                      placeholder="Any additional information you'd like to share..."
                    />
                  </div>
                </div>

                <div className="flex flex-wrap justify-end gap-3 pt-6 border-t">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      clearBookingDraft();
                      if (roomId) clearBookingLeasePickSession(roomId);
                      navigate('/tenant/profile');
                    }}
                  >
                    Discard progress
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => navigate('/rooms')}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={loading}
                    leftIcon={<Home className="h-5 w-5" />}
                  >
                    Submit Booking Application
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;