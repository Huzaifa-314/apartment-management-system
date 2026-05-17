import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { User, Mail, Phone, Home, Calendar, Briefcase, Pencil } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Input from '../../components/shared/Input';
import { api } from '../../lib/api';
import { formatAmount } from '../../lib/formatAmount';
import { Tenant, Room } from '../../types';
import {
  loadBookingDraft,
  clearBookingDraft,
  type BookingDraft,
} from '../../lib/bookingDraft';
import { format, parseISO } from 'date-fns';

const TenantProfile: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [roomSummary, setRoomSummary] = useState<Room | null>(null);
  const [draft, setDraft] = useState<BookingDraft | null>(() => loadBookingDraft());
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [form, setForm] = useState({
    phone: '',
    alternatePhone: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelationship: '',
    occupationType: 'employed',
    occupationCompany: '',
    occupationDesignation: '',
  });

  useEffect(() => {
    setDraft(loadBookingDraft());
  }, [location.pathname]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get<{ tenant: Tenant }>('/api/tenants/me');
        setTenant(data.tenant);
      } catch {
        setTenant(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const rid = tenant?.roomId;
    if (!rid) {
      setRoomSummary(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get<{ room: Room }>(`/api/rooms/${rid}`);
        if (!cancelled) setRoomSummary(data.room);
      } catch {
        if (!cancelled) setRoomSummary(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenant?.roomId]);

  useEffect(() => {
    if (!tenant) return;
    setForm({
      phone: tenant.phone || '',
      alternatePhone: tenant.alternatePhone || '',
      emergencyName: tenant.emergencyContact?.name || '',
      emergencyPhone: tenant.emergencyContact?.phone || '',
      emergencyRelationship: tenant.emergencyContact?.relationship || '',
      occupationType: tenant.occupation?.type || 'employed',
      occupationCompany: tenant.occupation?.company || '',
      occupationDesignation: tenant.occupation?.designation || '',
    });
  }, [tenant]);

  const handleDismissDraft = () => {
    clearBookingDraft();
    setDraft(null);
  };

  const handleContinueBooking = () => {
    if (!draft?.roomId) return;
    navigate(`/booking/${draft.roomId}`);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    setSaving(true);
    setSaveError(null);
    try {
      const { data } = await api.patch<{ tenant: Tenant }>(`/api/tenants/${tenant.id}`, {
        phone: form.phone,
        alternatePhone: form.alternatePhone,
        emergencyContact: JSON.stringify({
          name: form.emergencyName,
          phone: form.emergencyPhone,
          relationship: form.emergencyRelationship,
        }),
        occupation: JSON.stringify({
          type: form.occupationType,
          company: form.occupationCompany,
          designation: form.occupationDesignation,
        }),
      });
      setTenant(data.tenant);
      setEditing(false);
    } catch {
      setSaveError('Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-gray-500">Could not load your profile.</p>
        </div>
      </div>
    );
  }

  const draftSavedLabel = draft?.savedAt
    ? (() => {
        try {
          return format(parseISO(draft.savedAt), 'MMM d, yyyy h:mm a');
        } catch {
          return draft.savedAt;
        }
      })()
    : null;

  const draftTitle = draft?.roomSummary
    ? `Room ${draft.roomSummary.number} (Floor ${draft.roomSummary.floor})`
    : draft
      ? 'Room application'
      : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your profile</h1>
        <p className="text-gray-600 mb-2">Account details and saved booking progress</p>
        <p className="text-sm text-gray-600 mb-8">
          <Link to="/tenant/applications" className="text-blue-600 hover:underline font-medium">
            View submitted room applications
          </Link>
        </p>

        <Card title="Account" className="mb-6">
          <div className="flex justify-end mb-4">
            {!editing ? (
              <Button
                variant="secondary"
                type="button"
                leftIcon={<Pencil className="h-4 w-4" />}
                onClick={() => setEditing(true)}
              >
                Edit contact &amp; profile
              </Button>
            ) : (
              <Button variant="secondary" type="button" onClick={() => setEditing(false)}>
                Cancel editing
              </Button>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium text-gray-900">{tenant.name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{tenant.email}</p>
              </div>
            </div>

            {!editing ? (
              <>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium text-gray-900">{tenant.phone || '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Alternate phone</p>
                    <p className="font-medium text-gray-900">{tenant.alternatePhone || '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Emergency contact</p>
                    <p className="font-medium text-gray-900">
                      {[tenant.emergencyContact?.name, tenant.emergencyContact?.relationship]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </p>
                    <p className="text-gray-700 text-sm">{tenant.emergencyContact?.phone || '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Briefcase className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Occupation</p>
                    <p className="font-medium text-gray-900 capitalize">
                      {tenant.occupation?.type
                        ? `${tenant.occupation.type}${tenant.occupation.company ? ` · ${tenant.occupation.company}` : ''}${tenant.occupation.designation ? ` · ${tenant.occupation.designation}` : ''}`
                        : '—'}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-4 pt-2 border-t border-gray-100">
                <Input
                  label="Phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  fullWidth
                />
                <Input
                  label="Alternate phone"
                  type="tel"
                  value={form.alternatePhone}
                  onChange={(e) => setForm((f) => ({ ...f, alternatePhone: e.target.value }))}
                  fullWidth
                />
                <p className="text-sm font-medium text-gray-800">Emergency contact</p>
                <Input
                  label="Name"
                  value={form.emergencyName}
                  onChange={(e) => setForm((f) => ({ ...f, emergencyName: e.target.value }))}
                  fullWidth
                />
                <Input
                  label="Phone"
                  type="tel"
                  value={form.emergencyPhone}
                  onChange={(e) => setForm((f) => ({ ...f, emergencyPhone: e.target.value }))}
                  fullWidth
                />
                <Input
                  label="Relationship"
                  value={form.emergencyRelationship}
                  onChange={(e) => setForm((f) => ({ ...f, emergencyRelationship: e.target.value }))}
                  fullWidth
                />
                <p className="text-sm font-medium text-gray-800">Occupation</p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    value={form.occupationType}
                    onChange={(e) => setForm((f) => ({ ...f, occupationType: e.target.value }))}
                  >
                    <option value="employed">Employed</option>
                    <option value="student">Student</option>
                    <option value="self_employed">Self-employed</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <Input
                  label="Company / institution"
                  value={form.occupationCompany}
                  onChange={(e) => setForm((f) => ({ ...f, occupationCompany: e.target.value }))}
                  fullWidth
                />
                <Input
                  label="Designation / course"
                  value={form.occupationDesignation}
                  onChange={(e) => setForm((f) => ({ ...f, occupationDesignation: e.target.value }))}
                  fullWidth
                />
                {saveError && <p className="text-sm text-red-600">{saveError}</p>}
                <Button variant="primary" type="submit" disabled={saving}>
                  {saving ? 'Saving…' : 'Save changes'}
                </Button>
              </form>
            )}

            <div className="flex items-start gap-3 pt-2 border-t border-gray-100">
              <Home className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Assigned room</p>
                <p className="font-medium text-gray-900">
                  {!tenant.roomId
                    ? 'Not assigned yet'
                    : roomSummary
                      ? `Room ${roomSummary.number} (Floor ${roomSummary.floor}, ${roomSummary.type})`
                      : 'Assigned'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Lease</p>
                <p className="font-medium text-gray-900">
                  {tenant.moveInDate && tenant.leaseEndDate
                    ? `${format(parseISO(tenant.moveInDate), 'MMM d, yyyy')} – ${format(
                        parseISO(tenant.leaseEndDate),
                        'MMM d, yyyy'
                      )}`
                    : '—'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {draft && (
          <Card title="Booking in progress">
            <p className="text-gray-700 mb-2">
              You have a saved application for <span className="font-medium">{draftTitle}</span>.
              {draft.roomSummary && (
                <span className="text-gray-600">
                  {' '}
                  · {draft.roomSummary.type} ·{' '}
                  {formatAmount(draft.roomSummary.rent)}/mo
                </span>
              )}
            </p>
            {draftSavedLabel && (
              <p className="text-sm text-gray-500 mb-4">Last saved {draftSavedLabel}</p>
            )}
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" onClick={handleContinueBooking}>
                Continue application
              </Button>
              <Button variant="secondary" onClick={handleDismissDraft}>
                Dismiss
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TenantProfile;
