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
  /** `GET /api/rooms/public` with `include=all` or `GET /api/rooms/public/:id` */
  nextAvailableDate?: string | null;
  bookableNow?: boolean;
};

/** Block returned by `GET /api/rooms/public/:id/availability` */
export type RoomAvailabilityBlock = {
  start: string;
  end: string;
  kind: 'tenant' | 'pending' | 'pending_payment';
  bookingId?: string;
};

export type RoomAvailabilityResponse = {
  roomId: string;
  from: string;
  to: string;
  blocks: RoomAvailabilityBlock[];
};

export type RoomAvailabilityBulkResponse = {
  from: string;
  to: string;
  ranges: { roomId: string; blocks: RoomAvailabilityBlock[] }[];
};

/** Aggregated public data for the landing page (`GET /api/public/homepage`). */
export type HomepageData = {
  stats: {
    totalRooms: number;
    availableRooms: number;
    occupiedRooms: number;
    occupancyRate: number;
    startingRent: number;
  };
  pricing: Partial<Record<Room['type'], number>>;
  topAmenities: { name: string; count: number }[];
  featuredRooms: Room[];
};

export type Payment = {
  id: string;
  roomId: string;
  tenantId: string;
  amount: number;
  date: string;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  method?: 'card' | 'bank' | 'cash' | 'stripe' | 'sslcommerz';
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

export type SiteSettings = {
  id: string;
  propertyName: string;
  contactEmail: string;
  managementEmail: string;
  phone: string;
  emergencyPhone: string;
  officeHours: string;
  currencySymbol: string;
  currencyCode: string;
  liveChatEnabled: boolean;
  liveChatUrl: string;
  heroTagline: string;
  ctaSubtext: string;
  publicRoomsIntro: string;
  publicRoomsCtaTitle: string;
  publicRoomsCtaSubtext: string;
  footerTagline: string;
  footerAddress: string;
  landingStats: { value: string; label: string }[];
  updatedAt?: string;
};

export type AnnouncementItem = {
  id: string;
  title: string;
  message: string;
  type: 'urgent' | 'maintenance' | 'info';
  date: string;
  isPublished?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
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