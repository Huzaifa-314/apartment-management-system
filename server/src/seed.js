import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from './models/User.js';
import { TenantProfile } from './models/TenantProfile.js';
import { Room } from './models/Room.js';
import { Payment } from './models/Payment.js';
import { Complaint } from './models/Complaint.js';
import { BookingApplication } from './models/BookingApplication.js';
import { hashPassword } from './services/auth.service.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/room-management';
const SEED_PASSWORD = process.env.SEED_PASSWORD || 'password';

/** 12 rooms: mix of types and statuses (vacant / occupied / maintenance) for demo. */
function buildRooms() {
  const specs = [
    { number: '101', floor: 1, type: 'single', status: 'occupied' },
    { number: '102', floor: 1, type: 'double', status: 'occupied' },
    { number: '103', floor: 1, type: 'premium', status: 'occupied' },
    { number: '104', floor: 1, type: 'single', status: 'occupied' },
    { number: '201', floor: 2, type: 'double', status: 'vacant' },
    { number: '202', floor: 2, type: 'single', status: 'vacant' },
    { number: '203', floor: 2, type: 'premium', status: 'maintenance' },
    { number: '204', floor: 2, type: 'double', status: 'vacant' },
    { number: '301', floor: 3, type: 'single', status: 'vacant' },
    { number: '302', floor: 3, type: 'double', status: 'maintenance' },
    { number: '303', floor: 3, type: 'premium', status: 'vacant' },
    { number: '304', floor: 3, type: 'single', status: 'vacant' },
  ];
  return specs.map((s) => {
    const baseRent = s.type === 'single' ? 4500 : s.type === 'double' ? 5200 : 6000;
    return {
      number: s.number,
      floor: s.floor,
      type: s.type,
      rent: baseRent,
      status: s.status,
      area: s.type === 'single' ? 250 : s.type === 'double' ? 350 : 450,
      amenities: [
        'Water Supply',
        'Electricity',
        ...(s.type === 'double' || s.type === 'premium' ? ['Air Conditioning'] : []),
        ...(s.type === 'premium' ? ['Balcony', 'Premium Furnishing'] : []),
      ],
      lastMaintenance: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      nextMaintenance: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
    };
  });
}

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected. Clearing collections...');
  await Promise.all([
    User.deleteMany({}),
    TenantProfile.deleteMany({}),
    Room.deleteMany({}),
    Payment.deleteMany({}),
    Complaint.deleteMany({}),
    BookingApplication.deleteMany({}),
  ]);

  const hp = await hashPassword(SEED_PASSWORD);

  const admin = await User.create({
    email: 'admin@example.com',
    password: hp,
    name: 'Admin User',
    role: 'admin',
    phone: '123-456-7890',
    profileImage: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg',
  });
  console.log('Admin:', admin.email);

  const roomDocs = [];
  for (const r of buildRooms()) {
    roomDocs.push(await Room.create(r));
  }

  const occupiedRooms = roomDocs.filter((r) => r.status === 'occupied');
  const tenants = [];
  for (let i = 0; i < 4; i++) {
    const room = occupiedRooms[i];
    const u = await User.create({
      email: `tenant${i + 1}@example.com`,
      password: hp,
      name: `Tenant ${i + 1}`,
      role: 'tenant',
      phone: `555-${String(i + 100).padStart(3, '0')}-${String(i + 1000).padStart(4, '0')}`,
      profileImage:
        i % 2 === 0
          ? 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg'
          : 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg',
    });
    room.tenantId = u._id;
    await room.save();

    await TenantProfile.create({
      userId: u._id,
      roomId: room._id,
      moveInDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      leaseEndDate: new Date(Date.now() + 275 * 24 * 60 * 60 * 1000),
      emergencyContact: {
        name: `Contact ${i + 1}`,
        phone: `555-${String(i + 200).padStart(3, '0')}-${String(i + 2000).padStart(4, '0')}`,
        relationship: i % 3 === 0 ? 'Parent' : i % 3 === 1 ? 'Spouse' : 'Sibling',
      },
      rentAmount: room.rent,
      documents: {
        leaseAgreement: `lease-${u._id}.pdf`,
        idProof: `id-${u._id}.pdf`,
      },
    });
    tenants.push(u);
  }

  let payIdx = 0;
  for (const room of roomDocs) {
    if (room.status !== 'occupied' || !room.tenantId) continue;
    for (let m = 0; m < 3; m++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() - m);
      dueDate.setDate(5);
      let status = 'paid';
      if (m === 0 && payIdx % 3 === 0) status = 'pending';
      if (m === 0 && payIdx % 5 === 0) status = 'overdue';
      const paymentDate = new Date(dueDate);
      if (status === 'paid') {
        paymentDate.setDate(paymentDate.getDate() - 2);
      }
      await Payment.create({
        roomId: room._id,
        tenantId: room.tenantId,
        amount: room.rent,
        date: status === 'paid' ? paymentDate : null,
        dueDate,
        status,
        method: status === 'paid' ? 'card' : null,
        reference: status === 'paid' ? `REF-${100000 + payIdx}` : '',
        receiptUrl: status === 'paid' ? `receipt-${payIdx}.pdf` : '',
      });
      payIdx++;
    }
  }

  const titles = [
    'Water leakage in bathroom',
    'Noise complaint from neighbor',
    'Broken window',
    'Electrical issue',
    'AC not working',
  ];
  for (let i = 0; i < 8; i++) {
    const room = roomDocs.filter((r) => r.tenantId)[i % 4];
    if (!room?.tenantId) continue;
    const categories = ['maintenance', 'neighbor', 'facility', 'other'];
    const priorities = ['low', 'medium', 'high'];
    const statuses = ['new', 'inProgress', 'resolved', 'rejected'];
    const st = statuses[i % 4];
    await Complaint.create({
      tenantId: room.tenantId,
      roomId: room._id,
      title: titles[i % titles.length],
      description: `Demo complaint ${i + 1} for property review.`,
      category: categories[i % 4],
      priority: priorities[i % 3],
      status: st,
      resolvedAt: st === 'resolved' || st === 'rejected' ? new Date() : null,
      feedback: st === 'resolved' ? 'Issue addressed.' : '',
      assignedTo: st !== 'new' ? admin._id.toString() : '',
    });
  }

  const vacantForBooking = roomDocs.find((r) => r.status === 'vacant');
  if (vacantForBooking) {
    await BookingApplication.create({
      roomId: vacantForBooking._id,
      applicantUserId: null,
      name: 'Demo Applicant',
      email: 'applicant.pending@example.com',
      phone: '555-0100-2000',
      moveInDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      leaseEndDate: new Date(Date.now() + 380 * 24 * 60 * 60 * 1000),
      address: { street: '12 Demo Lane', city: 'Kolkata', state: 'WB', pincode: '700001' },
      status: 'pending',
      paidAt: new Date(),
      paidAmount: vacantForBooking.rent,
    });
  }

  console.log(
    'Seed complete. Login: admin@example.com / tenant1@example.com — password:',
    SEED_PASSWORD
  );
  console.log('Set a known admin password with: node server/src/setAdminPassword.js');
  await mongoose.disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
