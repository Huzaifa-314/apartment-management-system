import React from 'react';
import { Room } from '../../types';
import Card from '../shared/Card';
import Button from '../shared/Button';
import StatusIndicator from '../shared/StatusIndicator';
import { Building2, User, Calendar, Pencil, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface RoomCardProps {
  room: Room;
  tenantName?: string;
  onViewDetails: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, tenantName, onViewDetails, onEdit, onDelete }) => {
  // Format dates if they exist
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <Card 
      className="h-full flex flex-col transition-all duration-300 hover:shadow-lg"
      hoverable
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center">
          <Building2 className="w-6 h-6 text-blue-600 mr-2" />
          <div>
            <h3 className="font-bold text-lg">Room {room.number}</h3>
            <p className="text-gray-600 text-sm">Floor {room.floor}</p>
          </div>
        </div>
        <StatusIndicator status={room.status} />
      </div>
      
      <div className="mb-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-gray-600">Type:</div>
          <div className="font-medium capitalize">{room.type}</div>
          
          <div className="text-gray-600">Rent:</div>
          <div className="font-medium">₹{room.rent.toLocaleString()}</div>
          
          <div className="text-gray-600">Area:</div>
          <div className="font-medium">{room.area} sq.ft</div>
        </div>
      </div>
      
      {room.status === 'occupied' && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <div className="flex items-center mb-2">
            <User className="w-4 h-4 text-blue-600 mr-2" />
            <p className="font-medium">Tenant</p>
          </div>
          <p className="text-sm">{tenantName || 'Unknown Tenant'}</p>
        </div>
      )}
      
      <div className="mb-4 text-sm">
        <div className="flex items-center mb-1">
          <Calendar className="w-4 h-4 text-blue-600 mr-2" />
          <p className="font-medium">Last Maintenance:</p>
        </div>
        <p className="text-gray-600">{formatDate(room.lastMaintenance)}</p>
      </div>
      
      <div className="flex flex-wrap gap-1 mb-3">
        {room.amenities.map((amenity, index) => (
          <span 
            key={index}
            className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
          >
            {amenity}
          </span>
        ))}
      </div>
      
      <div className="mt-auto pt-4 space-y-2">
        <Button variant="primary" fullWidth onClick={onViewDetails}>
          View Details
        </Button>
        {(onEdit || onDelete) && (
          <div className="flex gap-2">
            {onEdit && (
              <Button variant="secondary" fullWidth onClick={onEdit}>
                <Pencil className="w-4 h-4 mr-1 inline" />
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                variant="secondary"
                fullWidth
                onClick={onDelete}
                className="text-red-600 hover:bg-red-50 border-red-200"
              >
                <Trash2 className="w-4 h-4 mr-1 inline" />
                Delete
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default RoomCard;