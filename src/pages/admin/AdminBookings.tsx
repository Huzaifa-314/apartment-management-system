import React, { useState, useEffect, useCallback } from 'react';
import { Search, CheckCircle, XCircle, Eye } from 'lucide-react';
import Button from '../../components/shared/Button';
import Input from '../../components/shared/Input';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import BookingDetailsModal, {
  BookingDetailsApplication,
} from '../../components/admin/modals/BookingDetailsModal';
import BookingRejectModal from '../../components/admin/modals/BookingRejectModal';

type BookingApplication = BookingDetailsApplication;

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
  const [pendingApproveId, setPendingApproveId] = useState<string | null>(null);
  const [pendingRejectReason, setPendingRejectReason] = useState<string | null>(null);

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
    if (!rejectBooking || pendingRejectReason == null) return;
    try {
      const { data } = await api.patch<{ booking: BookingApplication }>(
        `/api/bookings/${rejectBooking._id}`,
        {
          status: 'rejected',
          rejectionReason: pendingRejectReason.trim() || undefined,
        }
      );
      setBookings((prev) =>
        prev.map((b) => (b._id === rejectBooking._id ? { ...b, ...data.booking } : b))
      );
      if (selectedBooking?._id === rejectBooking._id) {
        setSelectedBooking(data.booking);
      }
      setRejectBooking(null);
      setPendingRejectReason(null);
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
        open={pendingRejectReason !== null}
        onOpenChange={(o) => !o && setPendingRejectReason(null)}
        title="Reject this application?"
        description={
          rejectBooking && pendingRejectReason !== null ? (
            <p>
              The applicant will see this as rejected
              {pendingRejectReason.trim()
                ? ` with your note: "${pendingRejectReason.trim().slice(0, 200)}${pendingRejectReason.trim().length > 200 ? '…' : ''}"`
                : ''}
              .
            </p>
          ) : null
        }
        confirmLabel="Reject application"
        variant="danger"
        onConfirm={async () => {
          await performReject();
        }}
      />

      <BookingDetailsModal
        open={!!selectedBooking}
        onOpenChange={(o) => !o && setSelectedBooking(null)}
        booking={selectedBooking}
        onApprove={(b) => setPendingApproveId(b._id)}
        onReject={(b) => setRejectBooking(b)}
      />

      <BookingRejectModal
        open={!!rejectBooking}
        onOpenChange={(o) => {
          if (!o) {
            setRejectBooking(null);
            setPendingRejectReason(null);
          }
        }}
        applicantName={rejectBooking?.name}
        onSubmit={(reason) => setPendingRejectReason(reason)}
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
            <label
              htmlFor="booking-status-filter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
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
          <div className="px-4 py-16 text-center text-gray-500 text-sm">
            Loading applications…
          </div>
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
                        {booking.phone && (
                          <div className="text-xs text-gray-500">{booking.phone}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {booking.roomId ? (
                          `Room ${booking.roomId.number} (F${booking.roomId.floor})`
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {booking.moveInDate
                          ? new Date(booking.moveInDate).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {booking.leaseEndDate
                          ? new Date(booking.leaseEndDate).toLocaleDateString()
                          : '—'}
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
                                onClick={() => setRejectBooking(booking)}
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
                              onClick={() => setRejectBooking(booking)}
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
    </>
  );
};

export default AdminBookings;
