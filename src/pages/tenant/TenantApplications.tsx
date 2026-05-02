import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, FileText, X } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Button from '../../components/shared/Button';
import Input from '../../components/shared/Input';
import { api, assetUrl } from '../../lib/api';
import { BookingApplication } from '../../types';
import { format, parseISO } from 'date-fns';

function applicationDocumentLinks(documents?: BookingApplication['documents']) {
  if (!documents) return [];
  const pairs: { label: string; url: string }[] = [
    { label: 'Profile photo', url: documents.profilePicture! },
    { label: 'Voter ID', url: documents.voterId! },
    { label: 'Aadhar', url: documents.aadharCard! },
    { label: 'Income proof', url: documents.incomeProof! },
  ];
  return pairs.filter((p): p is { label: string; url: string } => Boolean(p.url));
}

const TenantApplications: React.FC = () => {
  const [bookings, setBookings] = useState<BookingApplication[]>([]);
  const [filtered, setFiltered] = useState<BookingApplication[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<BookingApplication | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get<{ bookings: BookingApplication[] }>('/api/bookings/me');
        setBookings(data.bookings);
      } catch {
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    let result = [...bookings];
    if (filterStatus !== 'all') {
      result = result.filter((b) => b.status === filterStatus);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          (b.room?.number || '').toLowerCase().includes(q) ||
          `${b.room?.floor ?? ''}`.includes(q)
      );
    }
    setFiltered(result);
  }, [bookings, filterStatus, searchQuery]);

  const statusColor = (status: string) => {
    if (status === 'approved') return 'text-green-700 bg-green-50';
    if (status === 'rejected') return 'text-red-700 bg-red-50';
    if (status === 'pending_payment') return 'text-amber-800 bg-amber-50';
    return 'text-yellow-700 bg-yellow-50';
  };

  const statusLabel = (status: string) =>
    status === 'pending_payment' ? 'Awaiting payment' : status;

  const formatDate = (iso: string | null | undefined) => {
    if (!iso) return '—';
    try {
      return format(parseISO(iso), 'MMM d, yyyy');
    } catch {
      return '—';
    }
  };

  const docLinks = useMemo(
    () => (selected ? applicationDocumentLinks(selected.documents) : []),
    [selected]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-gray-500">Loading your applications…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Room applications</h1>
          <p className="text-gray-600">Rooms you have applied for and their current status</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Search by name or room number…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              fullWidth
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All</option>
                <option value="pending_payment">Awaiting payment</option>
                <option value="pending">Pending review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Room', 'Move-in', 'Lease end', 'Applied', 'Status', 'View documents', ''].map((h) => (
                    <th
                      key={h || 'actions'}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      {bookings.length === 0 ? (
                        <span>
                          You have not submitted any applications yet.{' '}
                          <Link to="/rooms" className="text-blue-600 hover:underline font-medium">
                            Browse available rooms
                          </Link>
                        </span>
                      ) : (
                        'No applications match your filters.'
                      )}
                    </td>
                  </tr>
                ) : (
                  filtered.map((b) => {
                    const rowDocs = applicationDocumentLinks(b.documents);
                    return (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        {b.room ? (
                          <>
                            <div className="font-medium text-gray-900">Room {b.room.number}</div>
                            <div className="text-gray-500 text-xs">
                              Floor {b.room.floor} · <span className="capitalize">{b.room.type}</span>
                              {b.room.rent != null ? ` · ₹${b.room.rent.toLocaleString()}/mo` : ''}
                            </div>
                          </>
                        ) : (
                          <span className="text-gray-500">Room no longer listed</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{formatDate(b.moveInDate)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{formatDate(b.leaseEndDate)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{formatDate(b.createdAt)}</td>
                      <td className="px-4 py-3 align-top">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${b.status === 'pending_payment' ? '' : 'capitalize'} ${statusColor(b.status)}`}
                        >
                          {statusLabel(b.status)}
                        </span>
                        {b.status === 'rejected' && b.rejectionReason && (
                          <p className="mt-1.5 text-xs text-red-700 max-w-[16rem] leading-snug">
                            {b.rejectionReason}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm align-top max-w-[14rem]">
                        {rowDocs.length === 0 ? (
                          <span className="text-gray-400">—</span>
                        ) : (
                          <ul className="space-y-1">
                            {rowDocs.map(({ label, url }) => (
                              <li key={`${b.id}-${label}`}>
                                <a
                                  href={assetUrl(url)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-blue-600 hover:underline break-all"
                                >
                                  <FileText className="h-3.5 w-3.5 shrink-0" />
                                  {label}
                                </a>
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
                          {b.status === 'pending_payment' && (
                            <Link
                              to={`/booking/checkout/${b.id}`}
                              className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                            >
                              Complete payment
                            </Link>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelected(b)}
                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            <Eye className="h-4 w-4" />
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-6 text-sm text-gray-500 max-w-2xl">
          Applications you submit while signed in are tied to your account. Older requests may appear if the email
          matches your profile.
        </p>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Application details</h3>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <p className="font-medium text-gray-700 mb-1">Room</p>
                {selected.room ? (
                  <p>
                    Room {selected.room.number} (Floor {selected.room.floor},{' '}
                    <span className="capitalize">{selected.room.type}</span>)
                  </p>
                ) : (
                  <p className="text-gray-500">Details unavailable</p>
                )}
              </div>

              <div>
                <p className="font-medium text-gray-700 mb-1">Contact on application</p>
                <p>{selected.name}</p>
                <p>{selected.email}</p>
                <p>
                  {selected.phone}
                  {selected.alternatePhone ? ` / ${selected.alternatePhone}` : ''}
                </p>
              </div>

              <div>
                <p className="font-medium text-gray-700 mb-1">Dates</p>
                <p>Move-in: {formatDate(selected.moveInDate)}</p>
                <p>Lease end: {formatDate(selected.leaseEndDate)}</p>
                <p>Submitted: {formatDate(selected.createdAt)}</p>
              </div>

              {selected.address?.street && (
                <div>
                  <p className="font-medium text-gray-700 mb-1">Address</p>
                  <p>
                    {selected.address.street}, {selected.address.city}, {selected.address.state} —{' '}
                    {selected.address.pincode}
                  </p>
                </div>
              )}

              {selected.emergencyContact?.name && (
                <div>
                  <p className="font-medium text-gray-700 mb-1">Emergency contact</p>
                  <p>
                    {selected.emergencyContact.name} ({selected.emergencyContact.relationship}) —{' '}
                    {selected.emergencyContact.phone}
                  </p>
                </div>
              )}

              {selected.occupation?.type && (
                <div>
                  <p className="font-medium text-gray-700 mb-1">Occupation</p>
                  <p className="capitalize">
                    {selected.occupation.type}
                    {selected.occupation.company ? ` at ${selected.occupation.company}` : ''}
                    {selected.occupation.designation ? `, ${selected.occupation.designation}` : ''}
                  </p>
                </div>
              )}

              {selected.preferences && (
                <div>
                  <p className="font-medium text-gray-700 mb-1">Preferences</p>
                  <p className="text-gray-600">
                    {[
                      selected.preferences.vegetarian ? 'Vegetarian' : null,
                      selected.preferences.smoking ? 'Smoking' : null,
                      selected.preferences.pets ? 'Pets' : null,
                    ]
                      .filter(Boolean)
                      .join(', ') || '—'}
                  </p>
                </div>
              )}

              {selected.additionalNotes && (
                <div>
                  <p className="font-medium text-gray-700 mb-1">Notes</p>
                  <p className="text-gray-600">{selected.additionalNotes}</p>
                </div>
              )}

              {selected.rejectionReason && (
                <div>
                  <p className="font-medium text-gray-700 mb-1">Note from review</p>
                  <p className="text-gray-600">{selected.rejectionReason}</p>
                </div>
              )}

              {docLinks.length > 0 && (
                <div>
                  <p className="font-medium text-gray-700 mb-2">View documents</p>
                  <ul className="space-y-2">
                    {docLinks.map(({ label, url }) => (
                      <li key={label}>
                        <a
                          href={assetUrl(url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <FileText className="h-4 w-4 shrink-0" />
                          {label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selected.status === 'pending_payment' ? '' : 'capitalize'} ${statusColor(selected.status)}`}
                >
                  {statusLabel(selected.status)}
                </span>
                <Button variant="secondary" onClick={() => setSelected(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantApplications;
