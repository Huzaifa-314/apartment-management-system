export type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'tenant';
  phone?: string;
  profileImage?: string;
};

export type Tenant = User & {
  roomId: string;
  moveInDate: string;
  leaseEndDate: string;
  alternatePhone?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  occupation?: {
    type?: string;
    company?: string;
    designation?: string;
    workAddress?: string;
  };
  documents?: {
    leaseAgreement?: string;
    idProof?: string;
  };
};

export type Room = {
  id: string;
  number: string;
  floor: number;
  type: 'single' | 'double' | 'premium';
  rent: number;
  status: 'occupied' | 'vacant' | 'maintenance';
  area: number;
  amenities: string[];
  tenantId?: string;
  lastMaintenance?: string;
  nextMaintenance?: string;
};

export type Payment = {
  id: string;
  roomId: string;
  tenantId: string;
  amount: number;
  date: string;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  method?: 'card' | 'bank' | 'cash';
  reference?: string;
  receiptUrl?: string;
};

export type Complaint = {
  id: string;
  tenantId: string;
  roomId: string;
  title: string;
  description: string;
  category: 'maintenance' | 'neighbor' | 'facility' | 'other';
  priority: 'low' | 'medium' | 'high';
  status: 'new' | 'inProgress' | 'resolved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  feedback?: string;
  assignedTo?: string;
};

export type Notification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  date: string;
  link?: string;
};

export type FinancialSummary = {
  totalRevenue: number;
  pendingAmount: number;
  overdueAmount: number;
  collectionRate: number;
  occupancyRate: number;
};

export type BookingApplication = {
  id: string;
  room: Room | null;
  status: 'pending_payment' | 'pending' | 'approved' | 'rejected';
  moveInDate: string | null;
  leaseEndDate: string | null;
  createdAt?: string;
  updatedAt?: string;
  name: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  address?: { street?: string; city?: string; state?: string; pincode?: string };
  emergencyContact?: { name?: string; phone?: string; relationship?: string };
  occupation?: {
    type?: string;
    company?: string;
    designation?: string;
    workAddress?: string;
    monthlyIncome?: string;
  };
  preferences?: { vegetarian?: boolean; smoking?: boolean; pets?: boolean };
  additionalNotes?: string;
  documents?: {
    profilePicture?: string;
    voterId?: string;
    aadharCard?: string;
    incomeProof?: string;
  };
  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string;
  paidAmount?: number;
  currency?: string;
  paidAt?: string;
  rejectionReason?: string;
};