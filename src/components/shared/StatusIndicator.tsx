import React from 'react';
import Badge from './Badge';

type StatusType = 'occupied' | 'vacant' | 'maintenance' | 'paid' | 'pending' | 'overdue' | 'new' | 'inProgress' | 'resolved' | 'rejected';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

interface StatusIndicatorProps {
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, size = 'md' }) => {
  const statusConfig: Record<StatusType, { variant: BadgeVariant; label: string }> = {
    // Room statuses
    occupied: { variant: 'primary', label: 'Occupied' },
    vacant: { variant: 'success', label: 'Vacant' },
    maintenance: { variant: 'warning', label: 'Maintenance' },
    
    // Payment statuses
    paid: { variant: 'success', label: 'Paid' },
    pending: { variant: 'warning', label: 'Pending' },
    overdue: { variant: 'danger', label: 'Overdue' },
    
    // Complaint statuses
    new: { variant: 'info', label: 'New' },
    inProgress: { variant: 'warning', label: 'In Progress' },
    resolved: { variant: 'success', label: 'Resolved' },
    rejected: { variant: 'danger', label: 'Rejected' },
  };

  const config = statusConfig[status];
  
  if (!config) {
    return <Badge size={size} variant="default">Unknown</Badge>;
  }

  return (
    <Badge 
      size={size} 
      variant={config.variant}
    >
      {config.label}
    </Badge>
  );
};

export default StatusIndicator;