import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { monthOverlapsBlocks } from '../../lib/availability';
import type { RoomAvailabilityBlock } from '../../types';

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

function monthKey(year: number, monthIndex0: number): string {
  return `${year}-${String(monthIndex0 + 1).padStart(2, '0')}`;
}

function inRange(mk: string, startKey: string, endKey: string): boolean {
  if (!startKey || !endKey) return false;
  return mk >= startKey && mk <= endKey;
}

type Visual =
  | 'idle'
  | 'preview-start'
  | 'preview-mid'
  | 'preview-end'
  | 'lease-start'
  | 'lease-mid'
  | 'lease-end'
  | 'lease-single';

type Props = {
  year: number;
  blocks: RoomAvailabilityBlock[];
  /** Confirmed move-in (yyyy-MM-dd). Empty while picking the end. */
  moveInDate: string;
  /** Confirmed lease end (yyyy-MM-dd). Empty while picking the end. */
  leaseEndDate: string;
  /** Earliest selectable lease month (yyyy-MM). */
  minMonthKey: string;
  /** While truthy, calendar is in "pick end" mode with this start month. */
  pendingStartMonthKey?: string | null;
  /** Click a month in the calendar. */
  onMonthClick?: (monthKey: string) => void;
};

const RoomAvailabilityCalendar: React.FC<Props> = ({
  year,
  blocks,
  moveInDate,
  leaseEndDate,
  minMonthKey,
  pendingStartMonthKey,
  onMonthClick,
}) => {
  /** Sticky tentative end. Updates as the user moves over a later open month;
   *  does NOT clear on mouse-leave so the pre-selected range remains visible. */
  const [tentativeEndKey, setTentativeEndKey] = useState<string | null>(null);

  const cells = useMemo(() => {
    const blockedByKey = new Map<string, boolean>();
    for (let i = 0; i < 12; i += 1) {
      const mk = monthKey(year, i);
      blockedByKey.set(mk, monthOverlapsBlocks(year, i, blocks));
    }
    return MONTH_LABELS.map((label, i) => {
      const mk = monthKey(year, i);
      return {
        label,
        mk,
        blocked: blockedByKey.get(mk) ?? false,
        beforeMin: mk < minMonthKey,
      };
    });
  }, [year, blocks, minMonthKey]);

  /**
   * Reset the sticky tentative end when the start changes, the flow exits
   * "pick end", or the user navigates to a different year. Without the year
   * reset, hovering in the new year would keep the previous year's tentative
   * end, making the first hover look like a pre-clamped selection.
   */
  useEffect(() => {
    setTentativeEndKey(null);
  }, [pendingStartMonthKey, year]);

  const confirmedStart = moveInDate ? moveInDate.slice(0, 7) : '';
  const confirmedEnd = leaseEndDate ? leaseEndDate.slice(0, 7) : '';

  /**
   * Where the preview ends: clamped from `tentativeEndKey` to before the first
   * blocked / forbidden month after the start.
   */
  const previewEndKey = useMemo(() => {
    if (!pendingStartMonthKey || !tentativeEndKey) return null;
    if (tentativeEndKey < pendingStartMonthKey) return null;
    let last: string | null = pendingStartMonthKey;
    for (const c of cells) {
      if (c.mk <= pendingStartMonthKey) continue;
      if (c.mk > tentativeEndKey) break;
      if (c.blocked || c.beforeMin) break;
      last = c.mk;
    }
    return last;
  }, [pendingStartMonthKey, tentativeEndKey, cells]);

  const visualFor = useCallback(
    (mk: string): Visual => {
      if (pendingStartMonthKey) {
        if (previewEndKey && inRange(mk, pendingStartMonthKey, previewEndKey)) {
          if (mk === pendingStartMonthKey) return 'preview-start';
          if (mk === previewEndKey) return 'preview-end';
          return 'preview-mid';
        }
        if (mk === pendingStartMonthKey) return 'preview-start';
        return 'idle';
      }
      if (confirmedStart && confirmedEnd && inRange(mk, confirmedStart, confirmedEnd)) {
        if (confirmedStart === confirmedEnd) return 'lease-single';
        if (mk === confirmedStart) return 'lease-start';
        if (mk === confirmedEnd) return 'lease-end';
        return 'lease-mid';
      }
      return 'idle';
    },
    [pendingStartMonthKey, previewEndKey, confirmedStart, confirmedEnd]
  );

  /**
   * Cells stay clickable past the preview clamp. Disabled buttons don't fire
   * mouseenter in most browsers, so disabling them here would break forward
   * hovering across years; the parent revalidates the full range on click.
   */
  const isClickable = useCallback(
    (blocked: boolean, beforeMin: boolean): boolean => {
      if (!onMonthClick) return false;
      if (blocked || beforeMin) return false;
      return true;
    },
    [onMonthClick]
  );

  const handleHover = useCallback(
    (mk: string, blocked: boolean, beforeMin: boolean) => {
      if (!pendingStartMonthKey) return;
      if (blocked || beforeMin) return;
      if (mk < pendingStartMonthKey) return;
      setTentativeEndKey(mk);
    },
    [pendingStartMonthKey]
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="mb-1 text-sm font-medium text-gray-800">Year at a glance</p>
      <p className="mb-4 text-sm text-gray-600">
        {pendingStartMonthKey
          ? 'Hover over a later month — the range stays highlighted. Click that month to lock the lease end.'
          : 'Click a month to start your lease, then click another to end it. Red months are unavailable.'}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {cells.map(({ label, mk, blocked, beforeMin }) => {
          const v = visualFor(mk);
          const clickable = isClickable(blocked, beforeMin);

          let cls =
            'min-h-[4.25rem] flex flex-col items-center justify-center rounded-lg border text-sm font-medium transition-colors ';
          if (beforeMin) {
            cls += 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed ';
          } else if (blocked) {
            cls += 'border-red-200 bg-red-100 text-red-900 cursor-not-allowed ';
          } else if (v === 'lease-single') {
            cls += 'border-blue-700 bg-blue-600 text-white ';
          } else if (v === 'lease-start' || v === 'lease-end') {
            cls += 'border-blue-700 bg-blue-600 text-white ';
          } else if (v === 'lease-mid') {
            cls += 'border-blue-200 bg-blue-100 text-blue-900 ';
          } else if (v === 'preview-start') {
            cls += 'border-blue-700 bg-blue-600 text-white ring-2 ring-blue-300 ';
          } else if (v === 'preview-end') {
            cls += 'border-blue-700 bg-blue-500 text-white ring-2 ring-blue-300 ';
          } else if (v === 'preview-mid') {
            cls += 'border-blue-300 bg-blue-200 text-blue-900 ';
          } else if (clickable) {
            cls +=
              'border-gray-200 bg-gray-50 text-gray-800 hover:bg-blue-50 hover:border-blue-300 cursor-pointer ';
          } else {
            cls += 'border-gray-200 bg-gray-50 text-gray-800 ';
          }

          return (
            <button
              key={mk}
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onMonthClick?.(mk)}
              onMouseEnter={() => handleHover(mk, blocked, beforeMin)}
              onMouseMove={() => handleHover(mk, blocked, beforeMin)}
              onFocus={() => handleHover(mk, blocked, beforeMin)}
              className={cls}
              aria-label={`${label} ${year}${blocked ? ', unavailable' : ''}${
                v.startsWith('lease') ? ', in your lease' : ''
              }${v.startsWith('preview') ? ', preview lease' : ''}`}
              aria-pressed={v.startsWith('lease') || v.startsWith('preview')}
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-current opacity-90">
                {label}
              </span>
              <span className="text-[11px] opacity-75 mt-0.5">{year}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-6 rounded bg-red-100 border border-red-200" />
          Unavailable
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-6 rounded bg-blue-200 border border-blue-300" />
          {pendingStartMonthKey ? 'Pre-selected (click end to confirm)' : 'Your lease'}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-6 rounded bg-gray-50 border border-gray-200" />
          Open
        </span>
      </div>
    </div>
  );
};

export default RoomAvailabilityCalendar;
