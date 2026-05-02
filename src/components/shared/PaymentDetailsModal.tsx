import React from 'react';
import { Download } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import { Payment } from '../../types';
import { formatCurrency } from '../../lib/formatCurrency';
import { format, parseISO } from 'date-fns';
import StatusIndicator from './StatusIndicator';

export interface PaymentDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: Payment | null;
  currencySymbol: string;
  propertyName?: string;
  tenantName: string;
  tenantEmail?: string;
  tenantPhone?: string;
  tenantAlternatePhone?: string;
  roomLabel: string;
  roomNumber?: string;
  roomFloor?: number;
  roomType?: string;
  roomArea?: number;
  onDownloadPdf?: () => void;
}

function formatWhen(iso: string | undefined | null): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'MMMM d, yyyy');
  } catch {
    return iso;
  }
}

function formatRoomType(t: string | undefined): string | undefined {
  if (!t) return undefined;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

const PaymentDetailsModal: React.FC<PaymentDetailsModalProps> = ({
  open,
  onOpenChange,
  payment,
  currencySymbol,
  propertyName,
  tenantName,
  tenantEmail,
  tenantPhone,
  tenantAlternatePhone,
  roomLabel,
  roomNumber,
  roomFloor,
  roomType,
  roomArea,
  onDownloadPdf,
}) => {
  const rt = formatRoomType(roomType);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Payment details"
      description={propertyName ? propertyName : undefined}
      size="lg"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          {payment?.status === 'paid' && onDownloadPdf && (
            <Button
              type="button"
              variant="primary"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={onDownloadPdf}
            >
              Download PDF receipt
            </Button>
          )}
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      }
    >
      {!payment ? (
        <p className="text-sm text-gray-500">No payment selected.</p>
      ) : (
        <div className="space-y-6 text-sm">
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Tenant
            </h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              <div className="flex justify-between sm:block sm:space-y-1">
                <dt className="text-gray-500">Name</dt>
                <dd className="font-medium text-gray-900 text-right sm:text-left">{tenantName}</dd>
              </div>
              <div className="flex justify-between sm:block sm:space-y-1">
                <dt className="text-gray-500">Email</dt>
                <dd className="font-medium text-gray-900 text-right sm:text-left break-all">
                  {tenantEmail || '—'}
                </dd>
              </div>
              <div className="flex justify-between sm:block sm:space-y-1">
                <dt className="text-gray-500">Phone</dt>
                <dd className="font-medium text-gray-900 text-right sm:text-left">
                  {tenantPhone || '—'}
                </dd>
              </div>
              <div className="flex justify-between sm:block sm:space-y-1">
                <dt className="text-gray-500">Alternate phone</dt>
                <dd className="font-medium text-gray-900 text-right sm:text-left">
                  {tenantAlternatePhone || '—'}
                </dd>
              </div>
            </dl>
          </section>

          <div className="border-t border-gray-100" />

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Room</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              <div className="flex justify-between sm:block sm:space-y-1">
                <dt className="text-gray-500">Unit</dt>
                <dd className="font-medium text-gray-900 text-right sm:text-left">{roomLabel}</dd>
              </div>
              {roomNumber && (
                <div className="flex justify-between sm:block sm:space-y-1">
                  <dt className="text-gray-500">Room number</dt>
                  <dd className="font-medium text-gray-900 text-right sm:text-left">{roomNumber}</dd>
                </div>
              )}
              {roomFloor !== undefined && (
                <div className="flex justify-between sm:block sm:space-y-1">
                  <dt className="text-gray-500">Floor</dt>
                  <dd className="font-medium text-gray-900 text-right sm:text-left">{roomFloor}</dd>
                </div>
              )}
              {rt && (
                <div className="flex justify-between sm:block sm:space-y-1">
                  <dt className="text-gray-500">Type</dt>
                  <dd className="font-medium text-gray-900 text-right sm:text-left">{rt}</dd>
                </div>
              )}
              {roomArea !== undefined && (
                <div className="flex justify-between sm:block sm:space-y-1">
                  <dt className="text-gray-500">Area</dt>
                  <dd className="font-medium text-gray-900 text-right sm:text-left">
                    {roomArea} sq units
                  </dd>
                </div>
              )}
            </dl>
          </section>

          <div className="border-t border-gray-100" />

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Payment
            </h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              <div className="flex justify-between sm:block sm:space-y-1 sm:col-span-2">
                <dt className="text-gray-500">Record ID</dt>
                <dd className="font-mono text-xs text-gray-900 text-right sm:text-left break-all">
                  {payment.id}
                </dd>
              </div>
              <div className="flex justify-between sm:block sm:space-y-1">
                <dt className="text-gray-500">Amount</dt>
                <dd className="font-semibold text-gray-900 text-right sm:text-left">
                  {formatCurrency(payment.amount, currencySymbol)}
                </dd>
              </div>
              <div className="flex justify-between sm:block sm:space-y-1">
                <dt className="text-gray-500">Status</dt>
                <dd className="text-right sm:text-left">
                  <StatusIndicator status={payment.status} size="sm" />
                </dd>
              </div>
              <div className="flex justify-between sm:block sm:space-y-1">
                <dt className="text-gray-500">Due date</dt>
                <dd className="font-medium text-gray-900 text-right sm:text-left">
                  {formatWhen(payment.dueDate)}
                </dd>
              </div>
              <div className="flex justify-between sm:block sm:space-y-1">
                <dt className="text-gray-500">Paid on</dt>
                <dd className="font-medium text-gray-900 text-right sm:text-left">
                  {payment.date ? formatWhen(payment.date) : '—'}
                </dd>
              </div>
              <div className="flex justify-between sm:block sm:space-y-1">
                <dt className="text-gray-500">Method</dt>
                <dd className="font-medium text-gray-900 text-right sm:text-left capitalize">
                  {payment.method || '—'}
                </dd>
              </div>
              <div className="flex justify-between sm:block sm:space-y-1">
                <dt className="text-gray-500">Reference</dt>
                <dd className="font-medium text-gray-900 text-right sm:text-left break-all">
                  {payment.reference || '—'}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      )}
    </Modal>
  );
};

export default PaymentDetailsModal;
