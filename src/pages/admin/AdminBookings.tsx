import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, CheckCircle, XCircle, Eye } from 'lucide-react';
import Button from '../../components/shared/Button';
import Input from '../../components/shared/Input';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import ConfirmDialog from '../../components/shared/ConfirmDialog';

interface BookingApplication {
  _id: string;
  name: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  roomId: { _id: string; number: string; floor: number; type: string } | null;
  moveInDate?: string;
  leaseEndDate?: string;
  status: 'pending_payment' | 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  address?: { street?: string; city?: string; state?: string; pincode?: string };
  emergencyContact?: { name?: string; phone?: string; relationship?: string };
  occupation?: { type?: string; company?: string; designation?: string };
  additionalNotes?: string;
}

type BookingsApiResponse = {
  bookings: BookingApplication[];
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
};

const PAGE_SIZE = 15;

const AdminBookings: React.FC = () => {
  const [bookings, setBookings] = useState<BookingApplication[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<BookingApplication | null>(null);
  const [rejectBooking, setRejectBooking] = useState<BookingApplication | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [pendingApproveId, setPendingApproveId] = useState<string | null>(null);
  const [rejectSubmitConfirm, setRejectSubmitConfirm] = useState(false);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(PAGE_SIZE));
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      const { data } = await api.get<BookingsApiResponse>(`/api/bookings?${params.toString()}`);
      setBookings(data.bookings);
      if (data.totalPages != null) setTotalPages(data.totalPages);
      if (data.total != null) setTotal(data.total);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, searchQuery]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleApprove = async (id: string) => {
    try {
      const { data } = await api.patch<{ booking: BookingApplication }>(`/api/bookings/${id}`, {
        status: 'approved',
      });
      setBookings((prev) => prev.map((b) => (b._id === id ? { ...b, ...data.booking } : b)));
      if (selectedBooking?._id === id) {
        setSelectedBooking(data.booking);
      }
    } catch (e) {
      toast.error('Could not approve application');
      throw e;
    }
  };

  const performReject = async () => {
    if (!rejectBooking) return;
    try {
      const { data } = await api.patch<{ booking: BookingApplication }>(
        `/api/bookings/${rejectBooking._id}`,
        {
          status: 'rejected',
          rejectionReason: rejectReason.trim() || undefined,
        }
      );
      setBookings((prev) =>
        prev.map((b) => (b._id === rejectBooking._id ? { ...b, ...data.booking } : b))
      );
      if (selectedBooking?._id === rejectBooking._id) {
        setSelectedBooking(data.booking);
      }
      setRejectBooking(null);
      setRejectReason('');
    } catch (e) {
      toast.error('Could not reject application');
      throw e;
    }
  };

  const statusColor = (status: string) => {
    if (status === 'approved') return 'text-green-700 bg-green-50';
    if (status === 'rejected') return 'text-red-700 bg-red-50';
    if (status === 'pending_payment') return 'text-amber-800 bg-amber-50';
    return 'text-yellow-700 bg-yellow-50';
  };

  const statusLabel = (status: string) =>
    status === 'pending_payment' ? 'Awaiting payment' : status;

  const pendingApprove = pendingApproveId
    ? bookings.find((b) => b._id === pendingApproveId) || selectedBooking
    : null;

  return (
    <>
      <ConfirmDialog
        open={!!pendingApproveId}
        onOpenChange={(o) => !o && setPendingApproveId(null)}
        title="Approve this application?"
        description={
          pendingApprove ? (
            <p>
              This will create the tenant and assign them to the selected room for{' '}
              <span className="font-medium text-gray-900">{pendingApprove.name}</span>.
            </p>
          ) : null
        }
        confirmLabel="Approve"
        variant="primary"
        onConfirm={async () => {
          if (!pendingApproveId) return;
          await handleApprove(pendingApproveId);
        }}
      />

      <ConfirmDialog
        open={rejectSubmitConfirm}
        onOpenChange={(o) => !o && setRejectSubmitConfirm(false)}
        title="Reject this application?"
        description={
          rejectBooking ? (
            <p>
              The applicant will see this as rejected
              {rejectReason.trim() ? ` with your note: "${rejectReason.trim().slice(0, 200)}${rejectReason.trim().length > 200 ? '…' : ''}"` : ''}.
            </p>
          ) : null
        }
        confirmLabel="Reject application"
        variant="danger"
        onConfirm={async () => {
          await performReject();
          setRejectSubmitConfirm(false);
        }}
      />

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Booking Applications</h1>
          <p className="text-gray-600">Review and manage room booking requests</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Search by name or email…"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              leftIcon={<Search className="h-5 w-5 text-gray-400" />}
              fullWidth
            />
            <div>
              <label htmlFor="booking-status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="booking-status-filter"
                className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPage(1);
                }}
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
          {loading ? (
            <div className="px-4 py-16 text-center text-gray-500 text-sm">Loading applications…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['Applicant', 'Room', 'Move-in', 'Lease End', 'Applied On', 'Status', 'Actions'].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center text-gray-500">
                        <p>No booking applications found.</p>
                        <p className="mt-1 text-xs text-gray-400">Adjust search or filters.</p>
                      </td>
                    </tr>
                  ) : (
                    bookings.map((booking) => (
                      <tr key={booking._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{booking.name}</div>
                          <div className="text-xs text-gray-500">{booking.email}</div>
                          {booking.phone && <div className="text-xs text-gray-500">{booking.phone}</div>}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {booking.roomId ? (
                            `Room ${booking.roomId.number} (F${booking.roomId.floor})`
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {booking.moveInDate ? new Date(booking.moveInDate).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {booking.leaseEndDate ? new Date(booking.leaseEndDate).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(booking.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${booking.status === 'pending_payment' ? '' : 'capitalize'} ${statusColor(booking.status)}`}
                          >
                            {statusLabel(booking.status)}
                          </span>
                          {booking.status === 'rejected' && booking.rejectionReason && (
                            <p className="mt-1 text-xs text-red-700 max-w-[14rem] line-clamp-2">
                              {booking.rejectionReason}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedBooking(booking)}
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {booking.status === 'pending' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setPendingApproveId(booking._id)}
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                                  title="Approve"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRejectBooking(booking);
                                    setRejectReason('');
                                  }}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                  title="Reject"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {booking.status === 'pending_payment' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setRejectBooking(booking);
                                  setRejectReason('');
                                }}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                title="Reject (unpaid)"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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

      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Application — {selectedBooking.name}</h3>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <p className="font-medium text-gray-700 mb-1">Contact</p>
                <p>{selectedBooking.email}</p>
                <p>
                  {selectedBooking.phone}
                  {selectedBooking.alternatePhone ? ` / ${selectedBooking.alternatePhone}` : ''}
                </p>
              </div>

              <div>
                <p className="font-medium text-gray-700 mb-1">Room & Dates</p>
                <p>
                  Room:{' '}
                  {selectedBooking.roomId
                    ? `${selectedBooking.roomId.number} (Floor ${selectedBooking.roomId.floor}, ${selectedBooking.roomId.type})`
                    : 'N/A'}
                </p>
                <p>
                  Move-in:{' '}
                  {selectedBooking.moveInDate
                    ? new Date(selectedBooking.moveInDate).toLocaleDateString()
                    : '—'}
                </p>
                <p>
                  Lease End:{' '}
                  {selectedBooking.leaseEndDate
                    ? new Date(selectedBooking.leaseEndDate).toLocaleDateString()
                    : '—'}
                </p>
              </div>

              {selectedBooking.address?.street && (
                <div>
                  <p className="font-medium text-gray-700 mb-1">Address</p>
                  <p>
                    {selectedBooking.address.street}, {selectedBooking.address.city},{' '}
                    {selectedBooking.address.state} — {selectedBooking.address.pincode}
                  </p>
                </div>
              )}

              {selectedBooking.emergencyContact?.name && (
                <div>
                  <p className="font-medium text-gray-700 mb-1">Emergency Contact</p>
                  <p>
                    {selectedBooking.emergencyContact.name} (
                    {selectedBooking.emergencyContact.relationship}) —{' '}
                    {selectedBooking.emergencyContact.phone}
                  </p>
                </div>
              )}

              {selectedBooking.occupation?.type && (
                <div>
                  <p className="font-medium text-gray-700 mb-1">Occupation</p>
                  <p className="capitalize">
                    {selectedBooking.occupation.type}
                    {selectedBooking.occupation.company ? ` at ${selectedBooking.occupation.company}` : ''}
                    {selectedBooking.occupation.designation
                      ? `, ${selectedBooking.occupation.designation}`
                      : ''}
                  </p>
                </div>
              )}

              {selectedBooking.additionalNotes && (
                <div>
                  <p className="font-medium text-gray-700 mb-1">Notes</p>
                  <p className="text-gray-600">{selectedBooking.additionalNotes}</p>
                </div>
              )}

              <div>
                <p className="font-medium text-gray-700 mb-1">Status</p>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedBooking.status === 'pending_payment' ? '' : 'capitalize'} ${statusColor(selectedBooking.status)}`}
                >
                  {statusLabel(selectedBooking.status)}
                </span>
              </div>

              {selectedBooking.rejectionReason && (
                <div>
                  <p className="font-medium text-gray-700 mb-1">Rejection note</p>
                  <p className="text-gray-600">{selectedBooking.rejectionReason}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              {selectedBooking.status === 'pending' && (
                <>
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => {
                      setRejectBooking(selectedBooking);
                      setRejectReason('');
                    }}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Reject…
                  </Button>
                  <Button
                    variant="primary"
                    type="button"
                    onClick={() => setPendingApproveId(selectedBooking._id)}
                  >
                    Approve
                  </Button>
                </>
              )}
              {selectedBooking.status === 'pending_payment' && (
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => {
                    setRejectBooking(selectedBooking);
                    setRejectReason('');
                  }}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Reject (unpaid)…
                </Button>
              )}
              <Button variant="secondary" type="button" onClick={() => setSelectedBooking(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {rejectBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Reject application</h3>
            <p className="text-sm text-gray-600 mb-3">
              Optional message shown to the applicant (e.g. reason for rejection).
            </p>
            <textarea
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 min-h-[100px]"
              placeholder="Reason for rejection…"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-3">
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  setRejectBooking(null);
                  setRejectReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="button"
                onClick={() => setRejectSubmitConfirm(true)}
                className="bg-red-600 hover:bg-red-700"
              >
                Reject application
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminBookings;
