import mongoose from 'mongoose';
import { Room } from '../models/Room.js';
import { TenantProfile } from '../models/TenantProfile.js';
import { BookingApplication } from '../models/BookingApplication.js';

/** End of lease display when tenant has no lease end (blocks "indefinitely"). */
const FAR_FUTURE = new Date('9999-12-31T23:59:59.999Z');

const ACTIVE_BOOKING_STATUSES = ['pending_payment', 'pending'];

/**
 * Normalize to UTC midnight for consistent date-only comparison.
 * @param {Date|string|null|undefined} d
 * @returns {Date|null}
 */
export function toUtcDayStart(d) {
  if (d == null) return null;
  const x = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(x.getTime())) return null;
  return new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate()));
}

/**
 * Inclusive range overlap: [a0,a1] vs [b0,b1]
 * @param {Date} a0
 * @param {Date} a1
 * @param {Date} b0
 * @param {Date} b1
 */
export function rangesOverlap(a0, a1, b0, b1) {
  return a0.getTime() <= b1.getTime() && b0.getTime() <= a1.getTime();
}

/**
 * @param {{ start: Date, end: Date }} req
 * @param {{ start: Date, end: Date }} block
 */
function rangeOverlapsBlock(req, block) {
  return rangesOverlap(req.start, req.end, block.start, block.end);
}

/**
 * Current tenant lease as one blocking interval when room is occupied.
 * @param {import('mongoose').Document} roomLean - Room doc with tenantId
 * @returns {Promise<{ start: Date, end: Date, kind: 'tenant' } | null>}
 */
export async function getTenantLeaseBlock(room) {
  if (!room || room.status !== 'occupied' || !room.tenantId) return null;
  const uid = room.tenantId;
  const profile = await TenantProfile.findOne({ userId: uid }).lean();
  if (!profile) {
    const start = toUtcDayStart(new Date()) || new Date();
    return { start, end: FAR_FUTURE, kind: 'tenant' };
  }
  const start = toUtcDayStart(profile.moveInDate) || toUtcDayStart(new Date()) || new Date();
  const end = toUtcDayStart(profile.leaseEndDate) || FAR_FUTURE;
  return { start, end, kind: 'tenant' };
}

/**
 * Active applications for this room with both dates (blocks calendar / overlap).
 * @param {import('mongoose').Types.ObjectId} roomOid
 * @param {string|null} [excludeBookingId]
 */
export async function findActiveApplicationBlocks(roomOid, excludeBookingId) {
  const q = {
    roomId: roomOid,
    status: { $in: ACTIVE_BOOKING_STATUSES },
    moveInDate: { $ne: null },
    leaseEndDate: { $ne: null },
  };
  if (excludeBookingId && mongoose.Types.ObjectId.isValid(excludeBookingId)) {
    q._id = { $ne: new mongoose.Types.ObjectId(excludeBookingId) };
  }
  const apps = await BookingApplication.find(q).lean();
  /** @type {{ start: Date, end: Date, kind: 'pending'|'pending_payment', bookingId: string }[]} */
  const blocks = [];
  for (const b of apps) {
    const s = toUtcDayStart(b.moveInDate);
    const e = toUtcDayStart(b.leaseEndDate);
    if (!s || !e || s > e) continue;
    const kind = b.status === 'pending_payment' ? 'pending_payment' : 'pending';
    blocks.push({
      start: s,
      end: e,
      kind,
      bookingId: b._id.toString(),
    });
  }
  return blocks;
}

/**
 * All blocking intervals for overlap checks (tenant + applications).
 * @param {import('mongoose').Document|object} room - Room document
 * @param {string|null} [excludeBookingId]
 */
export async function getBlockingIntervals(room, excludeBookingId) {
  const roomOid = room._id;
  const blocks = await findActiveApplicationBlocks(roomOid, excludeBookingId);

  const tenantBlock = await getTenantLeaseBlock(room);
  if (tenantBlock) {
    blocks.push({ ...tenantBlock, bookingId: undefined });
  }

  return blocks;
}

/**
 * Filter blocks to window [from, to] for API responses (inclusive window).
 * @param {{ start: Date, end: Date, kind: string, bookingId?: string }[]} blocks
 * @param {Date} from - day start
 * @param {Date} to - day end (inclusive upper bound as day)
 */
export function clipBlocksToWindow(blocks, from, to) {
  const f = toUtcDayStart(from);
  const t = toUtcDayStart(to);
  if (!f || !t) return [];
  const out = [];
  for (const b of blocks) {
    if (b.end < f || b.start > t) continue;
    const start = b.start < f ? f : b.start;
    const end = b.end > t ? t : b.end;
    out.push({
      start: start.toISOString(),
      end: end.toISOString(),
      kind: b.kind,
      ...(b.bookingId ? { bookingId: b.bookingId } : {}),
    });
  }
  return out.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

/**
 * Occupancy blocks for calendar (tenant + active apps), clipped to range.
 * @param {string|import('mongoose').Types.ObjectId} roomId
 * @param {{ from: Date|string, to: Date|string }} range
 */
export async function getOccupancyBlocks(roomId, range) {
  const rid =
    typeof roomId === 'string' && mongoose.Types.ObjectId.isValid(roomId)
      ? new mongoose.Types.ObjectId(roomId)
      : roomId;
  const room = await Room.findById(rid);
  if (!room) return { room: null, blocks: [] };

  const from = toUtcDayStart(range.from);
  const to = toUtcDayStart(range.to);
  if (!from || !to || from > to) return { room, blocks: [] };

  const tenantBlock = await getTenantLeaseBlock(room);
  const appBlocks = await findActiveApplicationBlocks(room._id, null);

  const raw = [];
  if (tenantBlock) {
    raw.push({
      start: tenantBlock.start,
      end: tenantBlock.end,
      kind: tenantBlock.kind,
    });
  }
  for (const a of appBlocks) {
    raw.push({
      start: a.start,
      end: a.end,
      kind: a.kind,
      bookingId: a.bookingId,
    });
  }

  const blocks = clipBlocksToWindow(raw, from, to);
  return { room, blocks };
}

/**
 * Whether a new booking range is allowed for this room.
 * @param {import('mongoose').Document|object} room
 * @param {Date|string} moveInDate
 * @param {Date|string} leaseEndDate
 * @param {string|null} [excludeBookingId] - when editing / finalizing existing booking
 * @returns {Promise<{ ok: boolean, reason?: string }>}
 */
export async function canBookRoomForRange(room, moveInDate, leaseEndDate, excludeBookingId = null) {
  if (!room) return { ok: false, reason: 'Room not found' };
  if (room.status === 'maintenance') {
    return { ok: false, reason: 'Room is under maintenance and cannot be booked' };
  }

  const reqStart = toUtcDayStart(moveInDate);
  const reqEnd = toUtcDayStart(leaseEndDate);
  if (!reqStart || !reqEnd) {
    return { ok: false, reason: 'Move-in and lease end dates are required' };
  }
  if (reqStart >= reqEnd) {
    return { ok: false, reason: 'Move-in date must be before lease end date' };
  }

  const req = { start: reqStart, end: reqEnd };
  const intervals = await getBlockingIntervals(room, excludeBookingId);

  for (const b of intervals) {
    const block = { start: b.start, end: b.end };
    if (rangeOverlapsBlock(req, block)) {
      return {
        ok: false,
        reason: 'Selected dates overlap an existing lease or another pending application',
      };
    }
  }

  return { ok: true };
}

const OPEN_ENDED_THRESHOLD = new Date('9000-01-01T00:00:00.000Z');

/**
 * Earliest calendar day when a new range could start (for listing "book from" hints).
 * @returns {Promise<Date|null>} null when room stays blocked indefinitely (no lease end).
 */
export async function computeNextAvailableDay(room) {
  const intervals = await getBlockingIntervals(room, null);
  if (intervals.length === 0) {
    return toUtcDayStart(new Date());
  }
  let latestEnd = intervals[0].end;
  for (const b of intervals) {
    if (b.end > latestEnd) latestEnd = b.end;
  }
  if (latestEnd >= OPEN_ENDED_THRESHOLD) {
    return null;
  }
  const dayMs = 24 * 60 * 60 * 1000;
  return new Date(latestEnd.getTime() + dayMs);
}
