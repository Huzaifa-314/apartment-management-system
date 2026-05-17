import React, { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Download, Calendar } from 'lucide-react';
import Button from '../../components/shared/Button';
import PaymentTable from '../../components/admin/PaymentTable';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import PaymentFormModal, {
  PaymentFormData,
} from '../../components/admin/modals/PaymentFormModal';
import PaymentDetailsModal from '../../components/shared/PaymentDetailsModal';
import { api } from '../../lib/api';
import { downloadPaymentReceiptPdf } from '../../lib/downloadPaymentReceipt';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { Payment, Room, Tenant } from '../../types';

const PAGE_SIZE = 15;

type PaymentsApiResponse = {
  payments: Payment[];
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
};

const AdminPayments: React.FC = () => {
  const { settings } = useSiteSettings();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [roomNumbers, setRoomNumbers] = useState<Record<string, string>>({});
  const [roomsById, setRoomsById] = useState<Record<string, Room>>({});
  const [tenantNames, setTenantNames] = useState<Record<string, string>>({});
  const [tenantsList, setTenantsList] = useState<Tenant[]>([]);
  const [roomRentByRoomId, setRoomRentByRoomId] = useState<Record<string, number>>({});
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [pendingRecord, setPendingRecord] = useState<PaymentFormData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [{ data: roomsData }, { data: tenantsData }] = await Promise.all([
          api.get<{ rooms: Room[] }>('/api/rooms'),
          api.get<{ tenants: Tenant[] }>('/api/tenants'),
        ]);
        const roomMap: Record<string, string> = {};
        const rentMap: Record<string, number> = {};
        const roomsMap: Record<string, Room> = {};
        roomsData.rooms.forEach((room) => {
          roomMap[room.id] = `Room ${room.number}`;
          rentMap[room.id] = room.rent;
          roomsMap[room.id] = room;
        });
        setRoomNumbers(roomMap);
        setRoomsById(roomsMap);
        setRoomRentByRoomId(rentMap);
        const tenantMap: Record<string, string> = {};
        tenantsData.tenants.forEach((tenant) => {
          tenantMap[tenant.id] = tenant.name;
        });
        setTenantNames(tenantMap);
        setTenantsList(tenantsData.tenants);
      } catch {
        setRoomNumbers({});
        setRoomsById({});
        setRoomRentByRoomId({});
        setTenantNames({});
        setTenantsList([]);
      }
    };
    loadMeta();
  }, []);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(PAGE_SIZE));
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (filterMonth !== 'all') params.set('month', filterMonth);
      const { data } = await api.get<PaymentsApiResponse>(`/api/payments?${params.toString()}`);
      setPayments(data.payments);
      if (data.totalPages != null) setTotalPages(data.totalPages);
      if (data.total != null) setTotal(data.total);
    } catch {
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterMonth]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleExportReport = async () => {
    try {
      const { data } = await api.get<{ payments: Payment[] }>('/api/payments');
      const headers = ['Date', 'Room', 'Tenant', 'Amount', 'Status', 'Reference'];
      const csvContent = [
        headers.join(','),
        ...data.payments.map((payment) =>
          [
            payment.date,
            roomNumbers[payment.roomId],
            tenantNames[payment.tenantId],
            payment.amount,
            payment.status,
            payment.reference || '',
          ].join(',')
        ),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payments-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    }
  };

  const executeRecordPayment = async () => {
    if (!pendingRecord) return;
    const payload: Record<string, unknown> = {
      tenantId: pendingRecord.tenantId,
      roomId: pendingRecord.roomId,
      amount: Number(pendingRecord.amount),
      dueDate: pendingRecord.dueDate,
    };
    if (pendingRecord.method) payload.method = pendingRecord.method;
    await api.post<{ payment: Payment }>('/api/payments', payload);
    setShowRecordModal(false);
    setPendingRecord(null);
    setPage(1);
    await loadPayments();
  };

  const handleDownloadReceipt = (payment: Payment) => {
    const tenant = tenantsList.find((t) => t.id === payment.tenantId);
    const room = roomsById[payment.roomId];
    downloadPaymentReceiptPdf({
      payment,
      propertyName: settings.propertyName,
      tenant: {
        name: tenant?.name ?? tenantNames[payment.tenantId] ?? 'Unknown',
        email: tenant?.email,
        phone: tenant?.phone,
        alternatePhone: tenant?.alternatePhone,
      },
      room: {
        label: roomNumbers[payment.roomId] ?? `Room ${payment.roomId.slice(0, 8)}`,
        number: room?.number,
        floor: room?.floor,
        type: room?.type,
        area: room?.area,
      },
    });
  };

  const selectedTenant = useMemo(
    () =>
      selectedPayment ? tenantsList.find((t) => t.id === selectedPayment.tenantId) : undefined,
    [selectedPayment, tenantsList]
  );
  const selectedRoom = useMemo(
    () => (selectedPayment ? roomsById[selectedPayment.roomId] : undefined),
    [selectedPayment, roomsById]
  );

  const recordTenantName = pendingRecord?.tenantId ? tenantNames[pendingRecord.tenantId] : '';
  const recordRoomLabel = pendingRecord?.roomId ? roomNumbers[pendingRecord.roomId] : '';

  return (
    <>
      <ConfirmDialog
        open={!!pendingRecord}
        onOpenChange={(o) => !o && setPendingRecord(null)}
        title="Create this payment record?"
        description={
          pendingRecord ? (
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium text-gray-800">Tenant:</span>{' '}
                {recordTenantName || '—'}
              </p>
              <p>
                <span className="font-medium text-gray-800">Room:</span> {recordRoomLabel || '—'}
              </p>
              <p>
                <span className="font-medium text-gray-800">Amount:</span>{' '}
                {pendingRecord.amount ? Number(pendingRecord.amount).toLocaleString() : '—'}
              </p>
              <p>
                <span className="font-medium text-gray-800">Due:</span>{' '}
                {pendingRecord.dueDate
                  ? new Date(pendingRecord.dueDate).toLocaleDateString()
                  : '—'}
              </p>
            </div>
          ) : null
        }
        confirmLabel="Create payment"
        onConfirm={async () => {
          try {
            await executeRecordPayment();
            toast.success('Payment created');
          } catch (e) {
            toast.error('Could not create payment');
            throw e;
          }
        }}
      />

      <PaymentFormModal
        open={showRecordModal}
        onOpenChange={setShowRecordModal}
        tenants={tenantsList}
        roomNumbers={roomNumbers}
        roomRentByRoomId={roomRentByRoomId}
        onSubmit={(data) => setPendingRecord(data)}
      />

      <PaymentDetailsModal
        open={!!selectedPayment}
        onOpenChange={(o) => !o && setSelectedPayment(null)}
        payment={selectedPayment}
        propertyName={settings.propertyName}
        tenantName={
          selectedTenant?.name ??
          (selectedPayment ? tenantNames[selectedPayment.tenantId] : undefined) ??
          '—'
        }
        tenantEmail={selectedTenant?.email}
        tenantPhone={selectedTenant?.phone}
        tenantAlternatePhone={selectedTenant?.alternatePhone}
        roomLabel={selectedPayment ? roomNumbers[selectedPayment.roomId] ?? '—' : '—'}
        roomNumber={selectedRoom?.number}
        roomFloor={selectedRoom?.floor}
        roomType={selectedRoom?.type}
        roomArea={selectedRoom?.area}
        onDownloadPdf={
          selectedPayment?.status === 'paid'
            ? () => handleDownloadReceipt(selectedPayment)
            : undefined
        }
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
          <p className="text-gray-600">Track and manage all payments</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            leftIcon={<Download className="h-5 w-5" />}
            onClick={handleExportReport}
          >
            Export Report
          </Button>
          <Button
            variant="primary"
            leftIcon={<Calendar className="h-5 w-5" />}
            onClick={() => setShowRecordModal(true)}
          >
            Add Payment
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status-filter"
              className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div>
            <label htmlFor="month-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Due month
            </label>
            <select
              id="month-filter"
              className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              value={filterMonth}
              onChange={(e) => {
                setFilterMonth(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Months</option>
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                return (
                  <option
                    key={i}
                    value={`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`}
                  >
                    {date.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="px-6 py-16 text-center text-gray-500 text-sm">Loading payments…</div>
        ) : (
          <PaymentTable
            payments={payments}
            roomNumbers={roomNumbers}
            tenantNames={tenantNames}
            onViewPayment={(p) => setSelectedPayment(p)}
            onDownloadReceipt={handleDownloadReceipt}
          />
        )}
      </div>

      {totalPages > 1 && (
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

export default AdminPayments;
