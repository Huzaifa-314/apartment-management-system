import React from 'react';
import Modal from '../../shared/Modal';
import Button from '../../shared/Button';

export interface BookingDetailsApplication {
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
  address?: { street?: string; city?: string; pincode?: string };
  emergencyContact?: { name?: string; phone?: string; relationship?: string };
  occupation?: { type?: string; company?: string; designation?: string };
  additionalNotes?: string;
}

const statusColor = (status: string) => {
  if (status === 'approved') return 'text-green-700 bg-green-50';
  if (status === 'rejected') return 'text-red-700 bg-red-50';
  if (status === 'pending_payment') return 'text-amber-800 bg-amber-50';
  return 'text-yellow-700 bg-yellow-50';
};

const statusLabel = (status: string) =>
  status === 'pending_payment' ? 'Awaiting payment' : status;

interface BookingDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingDetailsApplication | null;
  onApprove?: (booking: BookingDetailsApplication) => void;
  onReject?: (booking: BookingDetailsApplication) => void;
}

const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({
  open,
  onOpenChange,
  booking,
  onApprove,
  onReject,
}) => {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={booking ? `Application — ${booking.name}` : 'Application'}
      size="lg"
      footer={
        booking ? (
          <div className="flex flex-wrap justify-end gap-3">
            {booking.status === 'pending' && (
              <>
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => onReject?.(booking)}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Reject…
                </Button>
                <Button variant="primary" type="button" onClick={() => onApprove?.(booking)}>
                  Approve
                </Button>
              </>
            )}
            {booking.status === 'pending_payment' && (
              <Button
                variant="secondary"
                type="button"
                onClick={() => onReject?.(booking)}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Reject (unpaid)…
              </Button>
            )}
            <Button variant="secondary" type="button" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        ) : null
      }
    >
      {!booking ? (
        <p className="text-sm text-gray-500">No booking selected.</p>
      ) : (
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-medium text-gray-700 mb-1">Contact</p>
            <p>{booking.email}</p>
            <p>
              {booking.phone}
              {booking.alternatePhone ? ` / ${booking.alternatePhone}` : ''}
            </p>
          </div>

          <div>
            <p className="font-medium text-gray-700 mb-1">Room & Dates</p>
            <p>
              Room:{' '}
              {booking.roomId
                ? `${booking.roomId.number} (Floor ${booking.roomId.floor}, ${booking.roomId.type})`
                : 'N/A'}
            </p>
            <p>
              Move-in:{' '}
              {booking.moveInDate ? new Date(booking.moveInDate).toLocaleDateString() : '—'}
            </p>
            <p>
              Lease End:{' '}
              {booking.leaseEndDate ? new Date(booking.leaseEndDate).toLocaleDateString() : '—'}
            </p>
          </div>

          {booking.address?.street && (
            <div>
              <p className="font-medium text-gray-700 mb-1">Address</p>
              <p>
                {booking.address.street}, {booking.address.city}
                {booking.address.pincode ? ` — ${booking.address.pincode}` : ''}
              </p>
            </div>
          )}

          {booking.emergencyContact?.name && (
            <div>
              <p className="font-medium text-gray-700 mb-1">Emergency Contact</p>
              <p>
                {booking.emergencyContact.name} ({booking.emergencyContact.relationship}) —{' '}
                {booking.emergencyContact.phone}
              </p>
            </div>
          )}

          {booking.occupation?.type && (
            <div>
              <p className="font-medium text-gray-700 mb-1">Occupation</p>
              <p className="capitalize">
                {booking.occupation.type}
                {booking.occupation.company ? ` at ${booking.occupation.company}` : ''}
                {booking.occupation.designation ? `, ${booking.occupation.designation}` : ''}
              </p>
            </div>
          )}

          {booking.additionalNotes && (
            <div>
              <p className="font-medium text-gray-700 mb-1">Notes</p>
              <p className="text-gray-600">{booking.additionalNotes}</p>
            </div>
          )}

          <div>
            <p className="font-medium text-gray-700 mb-1">Status</p>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${booking.status === 'pending_payment' ? '' : 'capitalize'} ${statusColor(booking.status)}`}
            >
              {statusLabel(booking.status)}
            </span>
          </div>

          {booking.rejectionReason && (
            <div>
              <p className="font-medium text-gray-700 mb-1">Rejection note</p>
              <p className="text-gray-600">{booking.rejectionReason}</p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default BookingDetailsModal;
