import React from 'react';
import { Payment } from '../../types';
import StatusIndicator from '../shared/StatusIndicator';
import { format, parseISO } from 'date-fns';
import { Download, Eye } from 'lucide-react';

interface PaymentTableProps {
  payments: Payment[];
  roomNumbers?: Record<string, string>;
  tenantNames?: Record<string, string>;
  onViewPayment: (payment: Payment) => void;
  onDownloadReceipt: (payment: Payment) => void;
}

const PaymentTable: React.FC<PaymentTableProps> = ({ 
  payments, 
  roomNumbers = {}, 
  tenantNames = {},
  onViewPayment,
  onDownloadReceipt
}) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  if (payments.length === 0) {
    return (
      <div className="px-6 py-16 text-center text-gray-500">
        <p className="text-sm">No payment records to show.</p>
        <p className="mt-1 text-xs text-gray-400">Add a payment or adjust filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ID/Reference
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Room
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tenant
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Due Date
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Payment Date
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Method
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {payments.map((payment) => (
            <tr key={payment.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {payment.reference || payment.id.substring(0, 10)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {roomNumbers[payment.roomId] || payment.roomId.substring(0, 8)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {tenantNames[payment.tenantId] || payment.tenantId.substring(0, 8)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">₹{payment.amount.toLocaleString()}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{formatDate(payment.dueDate)}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{formatDate(payment.date)}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusIndicator status={payment.status} size="sm" />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 capitalize">{payment.method || '—'}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end space-x-2">
                  <button 
                    className="text-blue-600 hover:text-blue-900"
                    onClick={() => onViewPayment(payment)}
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                  {payment.status === 'paid' && (
                    <button 
                      className="text-green-600 hover:text-green-900"
                      onClick={() => onDownloadReceipt(payment)}
                    >
                      <Download className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PaymentTable;