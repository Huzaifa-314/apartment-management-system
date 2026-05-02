import type { Room } from '../types';

export const BOOKING_DRAFT_STORAGE_KEY = 'rms_booking_draft_v1';

const LEGACY_PENDING_KEY = 'pendingBookingRoomId';

export type BookingRoomSummary = {
  number: string;
  floor: number;
  type: string;
  rent: number;
};

export type BookingDraftFormSnapshot = {
  name: string;
  email: string;
  phone: string;
  alternatePhone: string;
  moveInDate: string;
  leaseEndDate: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  occupation: {
    type: string;
    company: string;
    designation: string;
    workAddress: string;
    monthlyIncome: string;
  };
  preferences: {
    vegetarian: boolean;
    smoking: boolean;
    pets: boolean;
  };
  additionalNotes: string;
};

export type BookingDraft = {
  roomId: string;
  roomSummary?: BookingRoomSummary;
  form?: BookingDraftFormSnapshot;
  savedAt: string;
};

export function removeLegacyPendingBookingKey(): void {
  try {
    localStorage.removeItem(LEGACY_PENDING_KEY);
  } catch {
    /* ignore */
  }
}

export function loadBookingDraft(): BookingDraft | null {
  try {
    const raw = localStorage.getItem(BOOKING_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BookingDraft;
    if (!parsed?.roomId || typeof parsed.roomId !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearBookingDraft(): void {
  try {
    localStorage.removeItem(BOOKING_DRAFT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function roomToSummary(room: Room): BookingRoomSummary {
  return {
    number: room.number,
    floor: room.floor,
    type: room.type,
    rent: room.rent,
  };
}

/** Replace draft with room selection only (e.g. from public listing before login). */
export function saveBookingDraftFromPublicRoom(room: Room): void {
  const draft: BookingDraft = {
    roomId: room.id,
    roomSummary: roomToSummary(room),
    savedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(BOOKING_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    /* ignore quota */
  }
}

export function saveBookingDraftWithForm(
  roomId: string,
  roomSummary: BookingRoomSummary,
  form: BookingDraftFormSnapshot
): void {
  const draft: BookingDraft = {
    roomId,
    roomSummary,
    form,
    savedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(BOOKING_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    /* ignore */
  }
}

const emptyFormSnapshot = (): BookingDraftFormSnapshot => ({
  name: '',
  email: '',
  phone: '',
  alternatePhone: '',
  moveInDate: '',
  leaseEndDate: '',
  address: { street: '', city: '', state: '', pincode: '' },
  emergencyContact: { name: '', phone: '', relationship: '' },
  occupation: {
    type: 'employed',
    company: '',
    designation: '',
    workAddress: '',
    monthlyIncome: '',
  },
  preferences: { vegetarian: false, smoking: false, pets: false },
  additionalNotes: '',
});

/** Step 1 → apply: persist lease dates without dropping other draft fields. */
export function updateDraftLeaseDates(
  roomId: string,
  roomSummary: BookingRoomSummary,
  moveInDate: string,
  leaseEndDate: string
): void {
  const existing = loadBookingDraft();
  const base =
    existing?.roomId === roomId && existing.form
      ? applySnapshotToFormBase(existing.form)
      : emptyFormSnapshot();
  saveBookingDraftWithForm(roomId, roomSummary, {
    ...base,
    moveInDate,
    leaseEndDate,
  });
}

export function snapshotFromFormState(form: {
  name: string;
  email: string;
  phone: string;
  alternatePhone: string;
  moveInDate: string;
  leaseEndDate: string;
  address: BookingDraftFormSnapshot['address'];
  emergencyContact: BookingDraftFormSnapshot['emergencyContact'];
  occupation: BookingDraftFormSnapshot['occupation'];
  preferences: BookingDraftFormSnapshot['preferences'];
  additionalNotes: string;
}): BookingDraftFormSnapshot {
  return {
    name: form.name,
    email: form.email,
    phone: form.phone,
    alternatePhone: form.alternatePhone,
    moveInDate: form.moveInDate,
    leaseEndDate: form.leaseEndDate,
    address: { ...form.address },
    emergencyContact: { ...form.emergencyContact },
    occupation: { ...form.occupation },
    preferences: { ...form.preferences },
    additionalNotes: form.additionalNotes,
  };
}

export function applySnapshotToFormBase(snapshot: BookingDraftFormSnapshot): BookingDraftFormSnapshot {
  return {
    name: snapshot.name,
    email: snapshot.email,
    phone: snapshot.phone,
    alternatePhone: snapshot.alternatePhone,
    moveInDate: snapshot.moveInDate,
    leaseEndDate: snapshot.leaseEndDate,
    address: { ...snapshot.address },
    emergencyContact: { ...snapshot.emergencyContact },
    occupation: { ...snapshot.occupation },
    preferences: { ...snapshot.preferences },
    additionalNotes: snapshot.additionalNotes,
  };
}
