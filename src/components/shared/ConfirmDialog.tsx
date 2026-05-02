import React, { useCallback, useState } from 'react';
import Button from './Button';
import Modal from './Modal';

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
};

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  loading: loadingProp = false,
  onConfirm,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const loading = loadingProp || submitting;

  const runConfirm = useCallback(async () => {
    setSubmitting(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }, [onConfirm, onOpenChange]);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      size="md"
      loading={loading}
      zIndex={110}
      footer={
        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            type="button"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === 'danger' ? 'danger' : 'primary'}
            disabled={loading}
            onClick={() => void runConfirm()}
          >
            {loading ? 'Please wait…' : confirmLabel}
          </Button>
        </div>
      }
    >
      {description && <div className="text-sm text-gray-600">{description}</div>}
    </Modal>
  );
};

export default ConfirmDialog;
