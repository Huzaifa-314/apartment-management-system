/** @deprecated Replaced by MongoDB + REST API — kept for reference only */
import { User, Room, Payment, Complaint, Tenant, Notification } from '../types';

// Generate a list of 57 rooms across 5 floors
export const mockRooms: Room[] = Array.from({ length: 57 }, (_, i) => {
  let floor: number;
  let roomNumberOnFloor: number;
  
  if (i < 15) {
    // Floor 1: rooms 0-14 (15 rooms)
    floor = 1;
    roomNumberOnFloor = i + 1;
  } else if (i < 30) {
    // Floor 2: rooms 15-29 (15 rooms)
    floor = 2;
    roomNumberOnFloor = i - 14;
  } else if (i < 45) {
    // Floor 3: rooms 30-44 (15 rooms)
    floor = 3;
    roomNumberOnFloor = i - 29;
  } else if (i < 53) {
    // Floor 4: rooms 45-52 (8 rooms)
    floor = 4;
    roomNumberOnFloor = i - 44;
  } else {
    // Floor 5: rooms 53-56 (4 rooms)
    floor = 5;
    roomNumberOnFloor = i - 52;
  }
  
  const roomNumber = `${floor}${String(roomNumberOnFloor).padStart(2, '0')}`;
  const roomType = i % 3 === 0 ? 'single' : i % 3 === 1 ? 'double' : 'premium';
  const baseRent = roomType === 'single' ? 4500 : roomType === 'double' ? 5200 : 6000;
  const status = i % 5 === 0 ? 'vacant' : i % 10 === 0 ? 'maintenance' : 'occupied';

  return {
    id: `room-${i + 1}`,
    number: roomNumber,
    floor,
    type: roomType,
    rent: baseRent,
    status,
    area: roomType === 'single' ? 250 : roomType === 'double' ? 350 : 450,
    amenities: [
      'Water Supply',
      'Electricity',
      ...(roomType === 'double' || roomType === 'premium' ? ['Air Conditioning'] : []),
      ...(roomType === 'premium' ? ['Balcony', 'Premium Furnishing'] : []),
    ],
    tenantId: status === 'occupied' ? `tenant-${i + 1}` : undefined,
    lastMaintenance: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    nextMaintenance: new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
  };
});

// Generate a list of users (admin and tenants)
export const mockUsers: User[] = [
  {
    id: 'admin-1',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    phone: '123-456-7890',
    profileImage: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg',
  },
  ...Array.from({ length: 40 }, (_, i) => ({
    id: `tenant-${i + 1}`,
    name: `Tenant ${i + 1}`,
    email: `tenant${i + 1}@example.com`,
    role: 'tenant' as const,
    phone: `555-${String(i + 100).padStart(3, '0')}-${String(i + 1000).padStart(4, '0')}`,
    profileImage: i % 2 === 0 
      ? 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg'
      : 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg',
  })),
];

// Generate tenant details
export const mockTenants: Tenant[] = mockUsers
  .filter(user => user.role === 'tenant')
  .map((user, i) => {
    const roomIndex = mockRooms.findIndex(room => room.tenantId === user.id);
    return {
      ...user,
      roomId: mockRooms[roomIndex]?.id || '',
      moveInDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      leaseEndDate: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      emergencyContact: {
        name: `Contact ${i + 1}`,
        phone: `555-${String(i + 200).padStart(3, '0')}-${String(i + 2000).padStart(4, '0')}`,
        relationship: i % 3 === 0 ? 'Parent' : i % 3 === 1 ? 'Spouse' : 'Sibling',
      },
      documents: {
        leaseAgreement: `lease-${user.id}.pdf`,
        idProof: `id-${user.id}.pdf`,
      },
    };
  });

// Generate payment data
export const mockPayments: Payment[] = Array.from({ length: 120 }, (_, i) => {
  const roomIndex = i % mockRooms.length;
  const room = mockRooms[roomIndex];
  const tenantId = room.tenantId || '';
  const monthOffset = Math.floor(i / mockRooms.length);
  const dueDate = new Date();
  dueDate.setMonth(dueDate.getMonth() - monthOffset);
  dueDate.setDate(5); // Due on 5th of each month
  
  const paymentDate = new Date(dueDate);
  const latePayment = Math.random() > 0.7;
  if (latePayment) {
    paymentDate.setDate(paymentDate.getDate() + Math.floor(Math.random() * 10) + 1);
  } else {
    paymentDate.setDate(paymentDate.getDate() - Math.floor(Math.random() * 5));
  }
  
  const status = monthOffset === 0 && Math.random() > 0.7 
    ? 'pending' 
    : monthOffset === 0 && Math.random() > 0.8 
      ? 'overdue' 
      : 'paid';

  return {
    id: `payment-${i + 1}`,
    roomId: room.id,
    tenantId,
    amount: room.rent,
    date: status === 'paid' ? paymentDate.toISOString() : '',
    dueDate: dueDate.toISOString(),
    status,
    method: status === 'paid' 
      ? (Math.random() > 0.6 ? 'card' : Math.random() > 0.5 ? 'bank' : 'cash')
      : undefined,
    reference: status === 'paid' ? `REF-${100000 + i}` : undefined,
    receiptUrl: status === 'paid' ? `receipt-${i + 1}.pdf` : undefined,
  };
});

// Generate complaint data
export const mockComplaints: Complaint[] = Array.from({ length: 30 }, (_, i) => {
  const roomIndex = Math.floor(Math.random() * mockRooms.length);
  const room = mockRooms[roomIndex];
  const tenantId = room.tenantId || '';
  const createdDate = new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000);
  const updatedDate = new Date(createdDate);
  updatedDate.setDate(updatedDate.getDate() + Math.floor(Math.random() * 5));
  
  const categories = ['maintenance', 'neighbor', 'facility', 'other'];
  const category = categories[Math.floor(Math.random() * categories.length)] as Complaint['category'];
  
  const priorities = ['low', 'medium', 'high'];
  const priority = priorities[Math.floor(Math.random() * priorities.length)] as Complaint['priority'];
  
  const statuses = ['new', 'inProgress', 'resolved', 'rejected'];
  const status = statuses[Math.floor(Math.random() * statuses.length)] as Complaint['status'];
  
  let resolvedDate;
  if (status === 'resolved' || status === 'rejected') {
    resolvedDate = new Date(updatedDate);
    resolvedDate.setDate(resolvedDate.getDate() + Math.floor(Math.random() * 3));
  }

  return {
    id: `complaint-${i + 1}`,
    tenantId,
    roomId: room.id,
    title: [
      'Water leakage in bathroom',
      'Noise complaint from neighbor',
      'Broken window',
      'Electrical issue',
      'Plumbing problem',
      'AC not working',
      'Pest control needed',
      'Lock damaged',
      'Internet connectivity issues',
      'Parking dispute'
    ][i % 10],
    description: `Detailed description of the complaint ${i + 1}. This explains what the issue is and any relevant details the tenant has provided.`,
    category,
    priority,
    status,
    createdAt: createdDate.toISOString(),
    updatedAt: updatedDate.toISOString(),
    resolvedAt: resolvedDate?.toISOString(),
    feedback: status === 'resolved' ? `Feedback for complaint ${i + 1}` : undefined,
    assignedTo: status !== 'new' ? 'admin-1' : undefined,
  };
});

// Generate notifications
export const mockNotifications: Notification[] = [
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `notification-admin-${i + 1}`,
    userId: 'admin-1',
    title: [
      'New complaint submitted',
      'Payment overdue',
      'Maintenance scheduled',
      'New tenant application',
      'Lease expiring soon'
    ][i % 5],
    message: `Notification message ${i + 1} for admin. This provides context about the notification.`,
    type: ['info', 'warning', 'success', 'error'][i % 4] as Notification['type'],
    read: Math.random() > 0.5,
    date: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000).toISOString(),
    link: `/admin/${['complaints', 'payments', 'rooms', 'tenants'][i % 4]}`,
  })),
  ...mockTenants.slice(0, 5).flatMap((tenant, tenantIndex) => 
    Array.from({ length: 3 }, (_, i) => ({
      id: `notification-tenant-${tenantIndex}-${i + 1}`,
      userId: tenant.id,
      title: [
        'Rent due reminder',
        'Maintenance scheduled',
        'Complaint status updated',
        'Welcome to your new home',
        'Building announcement'
      ][i % 5],
      message: `Notification message ${i + 1} for tenant. This provides information relevant to the tenant.`,
      type: ['info', 'warning', 'success', 'error'][i % 4] as Notification['type'],
      read: Math.random() > 0.5,
      date: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000).toISOString(),
      link: `/tenant/${['payments', 'complaints', 'profile'][i % 3]}`,
    }))
  ),
];