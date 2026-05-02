import React from 'react';
import Modal from '../../shared/Modal';
import Button from '../../shared/Button';
import { Payment } from '../../../types';

interface PaymentDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: Payment | null;
  roomNumbers: Record<string, string>;
  tenantNames: Record<string, string>;
}

const PaymentDetailsModal: React.FC<PaymentDetailsModalProps> = ({
  open,
  onOpenChange,
  payment,
  roomNumbers,
  tenantNames,
}) => {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Payment Details"
      size="md"
      footer={
        <div className="flex justify-end">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      }
    >
      {!payment ? (
        <p className="text-sm text-gray-500">No payment selected.</p>
      ) : (
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Room</span>
            <span className="font-medium">{roomNumbers[payment.roomId] || payment.roomId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Tenant</span>
            <span className="font-medium">
              {tenantNames[payment.tenantId] || payment.tenantId}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Amount</span>
            <span className="font-medium">₹{payment.amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Due Date</span>
            <span className="font-medium">
              {new Date(payment.dueDate).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Status</span>
            <span
              className={`font-medium capitalize ${
                payment.status === 'paid'
                  ? 'text-green-600'
                  : payment.status === 'overdue'
                    ? 'text-red-600'
                    : 'text-yellow-600'
              }`}
            >
              {payment.status}
            </span>
          </div>
          {payment.date && (
            <div className="flex justify-between">
              <span className="text-gray-500">Payment Date</span>
              <span className="font-medium">{new Date(payment.date).toLocaleDateString()}</span>
            </div>
          )}
          {payment.method && (
            <div className="flex justify-between">
              <span className="text-gray-500">Method</span>
              <span className="font-medium capitalize">{payment.method}</span>
            </div>
          )}
          {payment.reference && (
            <div className="flex justify-between">
              <span className="text-gray-500">Reference</span>
              <span className="font-medium">{payment.reference}</span>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default PaymentDetailsModal;
