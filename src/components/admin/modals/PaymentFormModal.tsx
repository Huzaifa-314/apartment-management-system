import React, { useEffect, useState } from 'react';
import Modal from '../../shared/Modal';
import Input from '../../shared/Input';
import Button from '../../shared/Button';
import { Tenant } from '../../../types';

export type PaymentFormData = {
  tenantId: string;
  roomId: string;
  amount: string;
  dueDate: string;
  method: '' | 'card' | 'bank' | 'cash' | 'stripe';
};

const emptyForm = (): PaymentFormData => ({
  tenantId: '',
  roomId: '',
  amount: '',
  dueDate: '',
  method: '',
});

interface PaymentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenants: Tenant[];
  roomNumbers: Record<string, string>;
  roomRentByRoomId: Record<string, number>;
  onSubmit: (data: PaymentFormData) => Promise<void> | void;
}

const PaymentFormModal: React.FC<PaymentFormModalProps> = ({
  open,
  onOpenChange,
  tenants,
  roomNumbers,
  roomRentByRoomId,
  onSubmit,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<PaymentFormData>(emptyForm);

  useEffect(() => {
    if (open) setForm(emptyForm());
  }, [open]);

  const handleTenantSelect = (tenantId: string) => {
    const tenant = tenants.find((t) => t.id === tenantId);
    setForm((prev) => ({
      ...prev,
      tenantId,
      roomId: tenant?.roomId || '',
      amount:
        tenant?.roomId && roomRentByRoomId[tenant.roomId] != null
          ? String(roomRentByRoomId[tenant.roomId])
          : prev.amount,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Add payment record"
      size="md"
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
            form="payment-form"
            variant="primary"
            isLoading={submitting}
          >
            Create Payment
          </Button>
        </div>
      }
    >
      <form id="payment-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tenant</label>
          <select
            className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            value={form.tenantId}
            onChange={(e) => handleTenantSelect(e.target.value)}
            required
          >
            <option value="">Select tenant</option>
            {tenants.map((t) => (
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
            value={form.roomId ? roomNumbers[form.roomId] || form.roomId : 'Auto-filled from tenant'}
            readOnly
          />
        </div>
        <Input
          type="number"
          label="Amount (₹)"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          required
        />
        <Input
          type="date"
          label="Due Date"
          value={form.dueDate}
          onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          required
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expected method (optional)
          </label>
          <select
            className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            value={form.method}
            onChange={(e) =>
              setForm({ ...form, method: e.target.value as PaymentFormData['method'] })
            }
          >
            <option value="">Not specified</option>
            <option value="cash">Cash</option>
            <option value="bank">Bank transfer</option>
            <option value="card">Card</option>
            <option value="stripe">Stripe</option>
          </select>
        </div>
      </form>
    </Modal>
  );
};

export default PaymentFormModal;
