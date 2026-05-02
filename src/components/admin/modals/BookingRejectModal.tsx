import React, { useEffect, useState } from 'react';
import Modal from '../../shared/Modal';
import Button from '../../shared/Button';

interface BookingRejectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicantName?: string;
  onSubmit: (reason: string) => void;
}

const BookingRejectModal: React.FC<BookingRejectModalProps> = ({
  open,
  onOpenChange,
  applicantName,
  onSubmit,
}) => {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Reject application"
      description={
        applicantName
          ? `Optional message shown to ${applicantName}.`
          : 'Optional message shown to the applicant (e.g. reason for rejection).'
      }
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            type="button"
            onClick={() => onSubmit(reason)}
          >
            Reject application
          </Button>
        </div>
      }
    >
      <textarea
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 min-h-[120px]"
        placeholder="Reason for rejection…"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
    </Modal>
  );
};

export default BookingRejectModal;
