import React from 'react';
import Modal from '../../shared/Modal';
import Button from '../../shared/Button';
import { Tenant, Room } from '../../../types';

interface TenantDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: Tenant | null;
  rooms: Room[];
}

const TenantDetailsModal: React.FC<TenantDetailsModalProps> = ({
  open,
  onOpenChange,
  tenant,
  rooms,
}) => {
  if (!tenant) {
    return (
      <Modal open={open} onOpenChange={onOpenChange} title="Tenant Details" size="lg">
        <p className="text-sm text-gray-500">No tenant selected.</p>
      </Modal>
    );
  }

  const room = rooms.find((r) => r.id === tenant.roomId);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={tenant.name}
      description={tenant.email}
      size="lg"
      footer={
        <div className="flex justify-end">
          <Button variant="secondary" type="button" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-5 text-sm">
        <section>
          <h4 className="font-medium text-gray-900 mb-2">Contact</h4>
          <div className="grid grid-cols-2 gap-2 text-gray-700">
            <span className="text-gray-500">Phone</span>
            <span>{tenant.phone || '—'}</span>
            {tenant.alternatePhone && (
              <>
                <span className="text-gray-500">Alternate</span>
                <span>{tenant.alternatePhone}</span>
              </>
            )}
          </div>
        </section>

        <section>
          <h4 className="font-medium text-gray-900 mb-2">Lease</h4>
          <div className="grid grid-cols-2 gap-2 text-gray-700">
            <span className="text-gray-500">Room</span>
            <span>{room ? `Room ${room.number} (Floor ${room.floor})` : tenant.roomId || '—'}</span>
            <span className="text-gray-500">Move In</span>
            <span>
              {tenant.moveInDate ? new Date(tenant.moveInDate).toLocaleDateString() : '—'}
            </span>
            <span className="text-gray-500">Lease End</span>
            <span>
              {tenant.leaseEndDate ? new Date(tenant.leaseEndDate).toLocaleDateString() : '—'}
            </span>
          </div>
        </section>

        {tenant.emergencyContact?.name && (
          <section>
            <h4 className="font-medium text-gray-900 mb-2">Emergency Contact</h4>
            <div className="grid grid-cols-2 gap-2 text-gray-700">
              <span className="text-gray-500">Name</span>
              <span>{tenant.emergencyContact.name}</span>
              <span className="text-gray-500">Relationship</span>
              <span>{tenant.emergencyContact.relationship || '—'}</span>
              <span className="text-gray-500">Phone</span>
              <span>{tenant.emergencyContact.phone || '—'}</span>
            </div>
          </section>
        )}

        {tenant.occupation?.type && (
          <section>
            <h4 className="font-medium text-gray-900 mb-2">Occupation</h4>
            <div className="grid grid-cols-2 gap-2 text-gray-700">
              <span className="text-gray-500">Type</span>
              <span className="capitalize">{tenant.occupation.type}</span>
              {tenant.occupation.company && (
                <>
                  <span className="text-gray-500">Company</span>
                  <span>{tenant.occupation.company}</span>
                </>
              )}
              {tenant.occupation.designation && (
                <>
                  <span className="text-gray-500">Designation</span>
                  <span>{tenant.occupation.designation}</span>
                </>
              )}
            </div>
          </section>
        )}
      </div>
    </Modal>
  );
};

export default TenantDetailsModal;
