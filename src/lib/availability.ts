import { endOfMonth, startOfMonth } from 'date-fns';
import type { RoomAvailabilityBlock } from '../types';

/** Inclusive range overlap. */
export function rangesOverlap(a0: Date, a1: Date, b0: Date, b1: Date): boolean {
  return a0.getTime() <= b1.getTime() && b0.getTime() <= a1.getTime();
}

/**
 * True if any day in the calendar month overlaps an occupancy / hold block.
 * @param monthIndex0 - 0 = January … 11 = December
 */
export function monthOverlapsBlocks(
  year: number,
  monthIndex0: number,
  blocks: RoomAvailabilityBlock[]
): boolean {
  const anchor = new Date(year, monthIndex0, 1);
  const monthStart = startOfMonth(anchor);
  const monthEnd = endOfMonth(anchor);
  for (const b of blocks) {
    const b0 = new Date(b.start);
    const b1 = new Date(b.end);
    if (rangesOverlap(monthStart, monthEnd, b0, b1)) return true;
  }
  return false;
}

/** Increment a yyyy-MM key by one month. */
export function nextMonthKey(mk: string): string {
  const y = parseInt(mk.slice(0, 4), 10);
  const m = parseInt(mk.slice(5, 7), 10);
  const next = new Date(y, m, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Whether every month from `startKey` (inclusive) to `endKey` (inclusive) is free.
 * `getBlocked(monthKey)` returns true if that month overlaps a block.
 */
export function isMonthRangeAllFree(
  startKey: string,
  endKey: string,
  getBlocked: (monthKey: string) => boolean
): boolean {
  if (endKey < startKey) return false;
  let cursor = startKey;
  while (cursor <= endKey) {
    if (getBlocked(cursor)) return false;
    cursor = nextMonthKey(cursor);
  }
  return true;
}

function parseBlockBounds(b: RoomAvailabilityBlock): { start: Date; end: Date } {
  return { start: new Date(b.start), end: new Date(b.end) };
}

/** Whether [moveIn, leaseEnd] overlaps any availability block. */
export function rangeConflictsWithBlocks(
  moveIn: string,
  leaseEnd: string,
  blocks: RoomAvailabilityBlock[]
): boolean {
  if (!moveIn || !leaseEnd) return true;
  const m0 = new Date(moveIn + 'T00:00:00.000Z');
  const m1 = new Date(leaseEnd + 'T00:00:00.000Z');
  if (Number.isNaN(m0.getTime()) || Number.isNaN(m1.getTime()) || m0 >= m1) return true;
  for (const b of blocks) {
    const { start, end } = parseBlockBounds(b);
    if (rangesOverlap(m0, m1, start, end)) return true;
  }
  return false;
}
