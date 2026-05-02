import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../../shared/Modal';
import Input from '../../shared/Input';
import Button from '../../shared/Button';
import { Complaint, Tenant } from '../../../types';

export type ComplaintFormData = {
  tenantId: string;
  roomId: string;
  title: string;
  description: string;
  category: Complaint['category'];
  priority: Complaint['priority'];
};

const emptyForm = (): ComplaintFormData => ({
  tenantId: '',
  roomId: '',
  title: '',
  description: '',
  category: 'maintenance',
  priority: 'medium',
});

interface ComplaintFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenants: Tenant[];
  roomNumbers: Record<string, string>;
  onSubmit: (data: ComplaintFormData) => Promise<void> | void;
}

const ComplaintFormModal: React.FC<ComplaintFormModalProps> = ({
  open,
  onOpenChange,
  tenants,
  roomNumbers,
  onSubmit,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<ComplaintFormData>(emptyForm);

  useEffect(() => {
    if (open) setForm(emptyForm());
  }, [open]);

  const tenantsWithRooms = tenants.filter((t) => t.roomId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tenantId || !form.roomId || !form.title.trim()) {
      toast.error('Select a tenant with a room and enter a title');
      return;
    }
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
      title="Create complaint (admin)"
      size="lg"
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
            form="complaint-form"
            variant="primary"
            isLoading={submitting}
          >
            Submit
          </Button>
        </div>
      }
    >
      <form id="complaint-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tenant</label>
          <select
            className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm"
            value={form.tenantId}
            required
            onChange={(e) => {
              const id = e.target.value;
              const t = tenants.find((x) => x.id === id);
              setForm((prev) => ({ ...prev, tenantId: id, roomId: t?.roomId || '' }));
            }}
          >
            <option value="">Select tenant</option>
            {tenantsWithRooms.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          {tenantsWithRooms.length === 0 && (
            <p className="text-xs text-amber-700 mt-1">No tenants with an assigned room.</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
          <input
            className="block w-full rounded-md border border-gray-300 bg-gray-50 py-2 px-3 text-sm text-gray-600"
            readOnly
            value={form.roomId ? roomNumbers[form.roomId] || form.roomId : '—'}
          />
        </div>
        <Input
          label="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 min-h-[100px]"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm"
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value as Complaint['category'] })
              }
            >
              <option value="maintenance">Maintenance</option>
              <option value="neighbor">Neighbor</option>
              <option value="facility">Facility</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm"
              value={form.priority}
              onChange={(e) =>
                setForm({ ...form, priority: e.target.value as Complaint['priority'] })
              }
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default ComplaintFormModal;
