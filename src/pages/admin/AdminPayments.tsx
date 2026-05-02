import React, { useState, useEffect, useCallback } from 'react';
import { Download, Calendar, X } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Button from '../../components/shared/Button';
import Input from '../../components/shared/Input';
import PaymentTable from '../../components/admin/PaymentTable';
import { api } from '../../lib/api';
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
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [roomNumbers, setRoomNumbers] = useState<Record<string, string>>({});
  const [tenantNames, setTenantNames] = useState<Record<string, string>>({});
  const [tenantsList, setTenantsList] = useState<Tenant[]>([]);
  const [roomRentByRoomId, setRoomRentByRoomId] = useState<Record<string, number>>({});
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [recordForm, setRecordForm] = useState({
    tenantId: '',
    roomId: '',
    amount: '',
    dueDate: '',
    method: '' as '' | 'card' | 'bank' | 'cash' | 'stripe',
  });
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
        roomsData.rooms.forEach((room) => {
          roomMap[room.id] = `Room ${room.number}`;
          rentMap[room.id] = room.rent;
        });
        setRoomNumbers(roomMap);
        setRoomRentByRoomId(rentMap);
        const tenantMap: Record<string, string> = {};
        tenantsData.tenants.forEach((tenant) => {
          tenantMap[tenant.id] = tenant.name;
        });
        setTenantNames(tenantMap);
        setTenantsList(tenantsData.tenants);
      } catch {
        setRoomNumbers({});
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

  const handleViewPayment = (payment: Payment) => {
    setSelectedPayment(payment);
  };

  const handleTenantSelect = (tenantId: string) => {
    const tenant = tenantsList.find((t) => t.id === tenantId);
    setRecordForm((prev) => ({
      ...prev,
      tenantId,
      roomId: tenant?.roomId || '',
      amount:
        tenant?.roomId && roomRentByRoomId[tenant.roomId] != null
          ? String(roomRentByRoomId[tenant.roomId])
          : prev.amount,
    }));
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Record<string, unknown> = {
        tenantId: recordForm.tenantId,
        roomId: recordForm.roomId,
        amount: Number(recordForm.amount),
        dueDate: recordForm.dueDate,
      };
      if (recordForm.method) payload.method = recordForm.method;
      await api.post<{ payment: Payment }>('/api/payments', payload);
      setShowRecordModal(false);
      setRecordForm({
        tenantId: '',
        roomId: '',
        amount: '',
        dueDate: '',
        method: '',
      });
      setPage(1);
      await loadPayments();
    } catch {
      /* ignore */
    }
  };

  const handleDownloadReceipt = (payment: Payment) => {
    const receiptContent = `
      Receipt for Payment
      ------------------
      Date: ${payment.date}
      Room: ${roomNumbers[payment.roomId]}
      Tenant: ${tenantNames[payment.tenantId]}
      Amount: ₹${payment.amount}
      Reference: ${payment.reference}
      Status: ${payment.status}
    `;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${payment.reference}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
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
              onViewPayment={handleViewPayment}
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
      </div>

      {showRecordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add payment record</h3>
              <button
                onClick={() => setShowRecordModal(false)}
                className="text-gray-400 hover:text-gray-600"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tenant</label>
                <select
                  className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  value={recordForm.tenantId}
                  onChange={(e) => handleTenantSelect(e.target.value)}
                  required
                >
                  <option value="">Select tenant</option>
                  {tenantsList.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                <input
                  className="block w-full rounded-md border border-gray-300 bg-gray-50 py-2 px-3 text-sm text-gray-500"
                  value={
                    recordForm.roomId ? roomNumbers[recordForm.roomId] || recordForm.roomId : 'Auto-filled from tenant'
                  }
                  readOnly
                />
              </div>
              <Input
                type="number"
                label="Amount (₹)"
                value={recordForm.amount}
                onChange={(e) => setRecordForm({ ...recordForm, amount: e.target.value })}
                required
              />
              <Input
                type="date"
                label="Due Date"
                value={recordForm.dueDate}
                onChange={(e) => setRecordForm({ ...recordForm, dueDate: e.target.value })}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected method (optional)
                </label>
                <select
                  className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  value={recordForm.method}
                  onChange={(e) =>
                    setRecordForm({
                      ...recordForm,
                      method: e.target.value as typeof recordForm.method,
                    })
                  }
                >
                  <option value="">Not specified</option>
                  <option value="cash">Cash</option>
                  <option value="bank">Bank transfer</option>
                  <option value="card">Card</option>
                  <option value="stripe">Stripe</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" type="button" onClick={() => setShowRecordModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Create Payment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Payment Details</h3>
              <button
                onClick={() => setSelectedPayment(null)}
                className="text-gray-400 hover:text-gray-600"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Room</span>
                <span className="font-medium">
                  {roomNumbers[selectedPayment.roomId] || selectedPayment.roomId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tenant</span>
                <span className="font-medium">
                  {tenantNames[selectedPayment.tenantId] || selectedPayment.tenantId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Amount</span>
                <span className="font-medium">₹{selectedPayment.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Due Date</span>
                <span className="font-medium">
                  {new Date(selectedPayment.dueDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span
                  className={`font-medium capitalize ${
                    selectedPayment.status === 'paid'
                      ? 'text-green-600'
                      : selectedPayment.status === 'overdue'
                        ? 'text-red-600'
                        : 'text-yellow-600'
                  }`}
                >
                  {selectedPayment.status}
                </span>
              </div>
              {selectedPayment.date && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Date</span>
                  <span className="font-medium">
                    {new Date(selectedPayment.date).toLocaleDateString()}
                  </span>
                </div>
              )}
              {selectedPayment.method && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Method</span>
                  <span className="font-medium capitalize">{selectedPayment.method}</span>
                </div>
              )}
              {selectedPayment.reference && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Reference</span>
                  <span className="font-medium">{selectedPayment.reference}</span>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <Button variant="secondary" onClick={() => setSelectedPayment(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayments;
