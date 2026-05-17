import React from 'react';
import { User } from 'lucide-react';
import Modal from '../../shared/Modal';
import Button from '../../shared/Button';
import { Room, Tenant } from '../../../types';

interface RoomDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: Room | null;
  tenant?: Tenant | null;
}

const RoomDetailsModal: React.FC<RoomDetailsModalProps> = ({
  open,
  onOpenChange,
  room,
  tenant,
}) => {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={room ? `Room ${room.number}` : 'Room Details'}
      description={room ? `Floor ${room.floor}` : undefined}
      size="xl"
      footer={
        <div className="flex justify-end">
          <Button variant="secondary" type="button" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      }
    >
      {!room ? (
        <p className="text-sm text-gray-500">No room selected.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-base font-semibold mb-3">Room Details</h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium text-gray-700">Type:</span>{' '}
                <span className="capitalize">{room.type}</span>
              </p>
              <p>
                <span className="font-medium text-gray-700">Status:</span>{' '}
                <span className="capitalize">{room.status}</span>
              </p>
              <p>
                <span className="font-medium text-gray-700">Rent:</span>{' '}
                <span className="text-gray-900">{room.rent.toLocaleString()}</span>
              </p>
              <p>
                <span className="font-medium text-gray-700">Area:</span> {room.area} sq.ft
              </p>
              <div>
                <p className="font-medium text-gray-700 mb-2">Amenities</p>
                <div className="flex flex-wrap gap-2">
                  {room.amenities.length === 0 ? (
                    <span className="text-gray-500 text-xs">None</span>
                  ) : (
                    room.amenities.map((amenity, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs"
                      >
                        {amenity}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-base font-semibold mb-3">Current Tenant</h3>
            {room.tenantId ? (
              tenant ? (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium">{tenant.name}</p>
                      <p className="text-gray-600">{tenant.email}</p>
                    </div>
                  </div>
                  <p>
                    <span className="font-medium text-gray-700">Phone:</span> {tenant.phone || '—'}
                  </p>
                  <p>
                    <span className="font-medium text-gray-700">Move In:</span>{' '}
                    {new Date(tenant.moveInDate).toLocaleDateString()}
                  </p>
                  <p>
                    <span className="font-medium text-gray-700">Lease End:</span>{' '}
                    {new Date(tenant.leaseEndDate).toLocaleDateString()}
                  </p>
                  {tenant.emergencyContact?.name && (
                    <div className="mt-3">
                      <p className="font-medium text-gray-700 mb-1">Emergency Contact</p>
                      <p>{tenant.emergencyContact.name}</p>
                      <p className="text-gray-600">{tenant.emergencyContact.phone}</p>
                      <p className="text-gray-600">({tenant.emergencyContact.relationship})</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-600">Tenant information not found</p>
              )
            ) : (
              <p className="text-sm text-gray-600">No tenant currently assigned</p>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default RoomDetailsModal;
