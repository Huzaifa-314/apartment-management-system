import { effectivePaymentStatus } from './paymentStatus.js';

export function toId(doc) {
  if (!doc) return null;
  return doc._id ? doc._id.toString() : String(doc);
}

export function serializeUser(u) {
  if (!u) return null;
  const o = u.toObject ? u.toObject() : { ...u };
  return {
    id: o._id.toString(),
    name: o.name,
    email: o.email,
    role: o.role,
    phone: o.phone || undefined,
    profileImage: o.profileImage || undefined,
  };
}

export function serializeRoom(r) {
  if (!r) return null;
  const o = r.toObject ? r.toObject() : { ...r };
  return {
    id: o._id.toString(),
    number: o.number,
    floor: o.floor,
    type: o.type,
    rent: o.rent,
    status: o.status,
    area: o.area,
    amenities: o.amenities || [],
    tenantId: o.tenantId ? o.tenantId.toString() : undefined,
    lastMaintenance: o.lastMaintenance ? new Date(o.lastMaintenance).toISOString() : undefined,
    nextMaintenance: o.nextMaintenance ? new Date(o.nextMaintenance).toISOString() : undefined,
  };
}

export function serializeComplaint(c) {
  if (!c) return null;
  const o = c.toObject ? c.toObject() : { ...c };
  const tid = o.tenantId?._id || o.tenantId;
  const rid = o.roomId?._id || o.roomId;
  return {
    id: o._id.toString(),
    tenantId: tid.toString(),
    roomId: rid.toString(),
    title: o.title,
    description: o.description,
    category: o.category,
    priority: o.priority,
    status: o.status,
    createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : undefined,
    updatedAt: o.updatedAt ? new Date(o.updatedAt).toISOString() : undefined,
    resolvedAt: o.resolvedAt ? new Date(o.resolvedAt).toISOString() : undefined,
    feedback: o.feedback || undefined,
    assignedTo: o.assignedTo || undefined,
  };
}

export function serializePayment(p) {
  if (!p) return null;
  const o = p.toObject ? p.toObject() : { ...p };
  return {
    id: o._id.toString(),
    roomId: o.roomId.toString(),
    tenantId: o.tenantId.toString(),
    amount: o.amount,
    date: o.date ? new Date(o.date).toISOString() : '',
    dueDate: o.dueDate ? new Date(o.dueDate).toISOString() : '',
    status: effectivePaymentStatus(o),
    method: o.method || undefined,
    reference: o.reference || undefined,
    receiptUrl: o.receiptUrl || undefined,
  };
}

export function serializeBookingApplication(b) {
  if (!b) return null;
  const o = b.toObject ? b.toObject() : { ...b };
  const populatedRoom =
    o.roomId && typeof o.roomId === 'object' && o.roomId._id != null ? serializeRoom(o.roomId) : null;
  return {
    id: o._id.toString(),
    room: populatedRoom,
    status: o.status,
    moveInDate: o.moveInDate ? new Date(o.moveInDate).toISOString() : null,
    leaseEndDate: o.leaseEndDate ? new Date(o.leaseEndDate).toISOString() : null,
    createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : undefined,
    updatedAt: o.updatedAt ? new Date(o.updatedAt).toISOString() : undefined,
    name: o.name,
    email: o.email,
    phone: o.phone || '',
    alternatePhone: o.alternatePhone || '',
    address:
      o.address && (o.address.street || o.address.city || o.address.pincode)
        ? {
            street: o.address.street || undefined,
            city: o.address.city || undefined,
            pincode: o.address.pincode || undefined,
          }
        : undefined,
    emergencyContact: o.emergencyContact?.name ? o.emergencyContact : undefined,
    occupation: o.occupation?.type ? o.occupation : undefined,
    preferences: o.preferences,
    additionalNotes: o.additionalNotes || undefined,
    documents: o.documents
      ? {
          profilePicture: o.documents.profilePicture || undefined,
          voterId: o.documents.voterId || undefined,
          incomeProof: o.documents.incomeProof || undefined,
        }
      : undefined,
    stripeCheckoutSessionId: o.stripeCheckoutSessionId || undefined,
    stripePaymentIntentId: o.stripePaymentIntentId || undefined,
    paidAmount: o.paidAmount != null ? o.paidAmount : undefined,
    paidAt: o.paidAt ? new Date(o.paidAt).toISOString() : undefined,
    rejectionReason: o.rejectionReason || undefined,
  };
}

export async function serializeTenant(user, profile) {
  const u = serializeUser(user);
  if (!profile) {
    return {
      ...u,
      roomId: '',
      moveInDate: new Date().toISOString(),
      leaseEndDate: new Date().toISOString(),
    };
  }
  const p = profile.toObject ? profile.toObject() : profile;
  return {
    ...u,
    roomId: p.roomId ? p.roomId.toString() : '',
    moveInDate: p.moveInDate ? new Date(p.moveInDate).toISOString() : '',
    leaseEndDate: p.leaseEndDate ? new Date(p.leaseEndDate).toISOString() : '',
    alternatePhone: p.alternatePhone || undefined,
    emergencyContact: p.emergencyContact?.name
      ? {
          name: p.emergencyContact.name,
          phone: p.emergencyContact.phone,
          relationship: p.emergencyContact.relationship,
        }
      : undefined,
    occupation: p.occupation?.type
      ? {
          type: p.occupation.type,
          company: p.occupation.company || undefined,
          designation: p.occupation.designation || undefined,
          workAddress: p.occupation.workAddress || undefined,
        }
      : undefined,
    documents: p.documents
      ? {
          leaseAgreement: p.documents.leaseAgreement,
          idProof: p.documents.idProof,
        }
      : undefined,
  };
}
