import React from 'react';
import { Complaint } from '../../types';
import StatusIndicator from '../shared/StatusIndicator';
import { format, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface ComplaintsTableProps {
  complaints: Complaint[];
  roomNumbers?: Record<string, string>;
  tenantNames?: Record<string, string>;
  onStatusChange?: (id: string, status: Complaint['status']) => void;
}

const ComplaintsTable: React.FC<ComplaintsTableProps> = ({ 
  complaints, 
  roomNumbers = {}, 
  tenantNames = {},
  onStatusChange,
}) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const getPriorityIcon = (priority: Complaint['priority']) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ID
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Title
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Room
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tenant
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Priority
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {complaints.map((complaint) => (
            <tr key={complaint.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {complaint.id.substring(0, 10)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {complaint.title}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {roomNumbers[complaint.roomId] || complaint.roomId.substring(0, 8)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {tenantNames[complaint.tenantId] || complaint.tenantId.substring(0, 8)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 capitalize">
                  {complaint.category}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {getPriorityIcon(complaint.priority)}
                  <span className="ml-1 text-sm text-gray-900 capitalize">
                    {complaint.priority}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {formatDate(complaint.createdAt)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusIndicator status={complaint.status} size="sm" />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                {onStatusChange ? (
                  <select
                    className="text-sm border border-gray-300 rounded-md py-1 px-2"
                    value={complaint.status}
                    onChange={(e) =>
                      onStatusChange(complaint.id, e.target.value as Complaint['status'])
                    }
                  >
                    <option value="new">New</option>
                    <option value="inProgress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                ) : (
                  <Link to={`/admin/complaints/${complaint.id}`} className="text-blue-600 hover:text-blue-900">
                    View
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ComplaintsTable;