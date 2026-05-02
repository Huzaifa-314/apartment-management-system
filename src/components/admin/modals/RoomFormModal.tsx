import React, { useEffect, useState } from 'react';
import { Plus, Save } from 'lucide-react';
import Modal from '../../shared/Modal';
import Input from '../../shared/Input';
import Button from '../../shared/Button';
import { Room } from '../../../types';

const AMENITY_OPTIONS = [
  'Water Supply',
  'Electricity',
  'Air Conditioning',
  'Balcony',
  'Premium Furnishing',
];

interface RoomFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Room | null;
  onSubmit: (data: RoomFormData, mode: 'create' | 'edit') => Promise<void> | void;
}

export type RoomFormData = {
  number: string;
  floor: string;
  type: string;
  status: string;
  rent: string;
  area: string;
  amenities: string[];
};

const emptyForm = (): RoomFormData => ({
  number: '',
  floor: '1',
  type: 'single',
  status: 'vacant',
  rent: '',
  area: '',
  amenities: [],
});

const RoomFormModal: React.FC<RoomFormModalProps> = ({
  open,
  onOpenChange,
  initial,
  onSubmit,
}) => {
  const isEdit = !!initial;
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<RoomFormData>(emptyForm);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setData({
        number: initial.number,
        floor: String(initial.floor),
        type: initial.type,
        status: initial.status,
        rent: String(initial.rent),
        area: String(initial.area),
        amenities: [...initial.amenities],
      });
    } else {
      setData(emptyForm());
    }
  }, [open, initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(data, isEdit ? 'edit' : 'create');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? `Edit Room ${initial?.number}` : 'Add New Room'}
      size="xl"
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
            form="room-form"
            variant="primary"
            isLoading={submitting}
            leftIcon={isEdit ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          >
            {isEdit ? 'Save Changes' : 'Add Room'}
          </Button>
        </div>
      }
    >
      <form id="room-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Room Number"
            value={data.number}
            onChange={(e) => setData({ ...data, number: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
            <select
              className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              value={data.floor}
              onChange={(e) => setData({ ...data, floor: e.target.value })}
            >
              {['1', '2', '3', '4', '5'].map((f) => (
                <option key={f} value={f}>
                  Floor {f}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
            <select
              className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              value={data.type}
              onChange={(e) => setData({ ...data, type: e.target.value })}
            >
              <option value="single">Single</option>
              <option value="double">Double</option>
              <option value="premium">Premium</option>
            </select>
          </div>
          {isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                value={data.status}
                onChange={(e) => setData({ ...data, status: e.target.value })}
              >
                <option value="vacant">Vacant</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          )}
          <Input
            label="Monthly Rent"
            type="number"
            value={data.rent}
            onChange={(e) => setData({ ...data, rent: e.target.value })}
            required
          />
          <Input
            label="Area (sq.ft)"
            type="number"
            value={data.area}
            onChange={(e) => setData({ ...data, area: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amenities</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {AMENITY_OPTIONS.map((amenity) => (
              <label key={amenity} className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={data.amenities.includes(amenity)}
                  onChange={(e) => {
                    setData({
                      ...data,
                      amenities: e.target.checked
                        ? [...data.amenities, amenity]
                        : data.amenities.filter((a) => a !== amenity),
                    });
                  }}
                />
                <span className="ml-2 text-sm">{amenity}</span>
              </label>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default RoomFormModal;
