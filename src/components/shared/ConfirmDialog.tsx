import React, { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onOpenChange(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, loading, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close"
        onClick={() => !loading && onOpenChange(false)}
      />
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 z-10">
        <div className="flex justify-between items-start gap-3 mb-2">
          <h2 id="confirm-dialog-title" className="text-lg font-semibold text-gray-900">
            {title}
          </h2>
          <button
            type="button"
            className="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-50"
            onClick={() => !loading && onOpenChange(false)}
            disabled={loading}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {description && <div className="text-sm text-gray-600 mb-6">{description}</div>}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" type="button" disabled={loading} onClick={() => onOpenChange(false)}>
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
      </div>
    </div>
  );
};

export default ConfirmDialog;
