import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { addMonths, endOfMonth, endOfYear, format, parseISO, startOfMonth, startOfYear } from 'date-fns';
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/shared/Navbar';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import RoomAvailabilityCalendar from '../components/booking/RoomAvailabilityCalendar';
import { fetchPublicRoom, fetchRoomAvailability } from '../lib/roomPublicApi';
import {
  loadBookingLeasePickSession,
  saveBookingLeasePickSession,
  updateDraftLeaseDates,
} from '../lib/bookingDraft';
import {
  isMonthRangeAllFree,
  monthOverlapsBlocks,
  rangeConflictsWithBlocks,
} from '../lib/availability';
import type { Room, RoomAvailabilityBlock } from '../types';

function ymdToMonthKey(ymd: string): string {
  return ymd.slice(0, 7);
}

type DatesLocationState = { moveInDate?: string; leaseEndDate?: string } | undefined;

const BookingDatesPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [room, setRoom] = useState<Room | null>(null);
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [blocks, setBlocks] = useState<RoomAvailabilityBlock[]>([]);
  const [moveInDate, setMoveInDate] = useState('');
  const [leaseEndDate, setLeaseEndDate] = useState('');
  /** When set, the user has clicked a start month and is hovering/clicking to set the end. */
  const [pendingStartMonthKey, setPendingStartMonthKey] = useState<string | null>(null);
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [loadingCal, setLoadingCal] = useState(false);

  const loadRoom = useCallback(async () => {
    if (!roomId) return;
    setLoadingRoom(true);
    try {
      const r = await fetchPublicRoom(roomId);
      setRoom(r);
      if (r.status === 'maintenance') {
        toast.error('This room is under maintenance.');
      }
    } catch {
      toast.error('Room not found');
      navigate('/rooms');
    } finally {
      setLoadingRoom(false);
    }
  }, [roomId, navigate]);

  useEffect(() => {
    loadRoom();
  }, [loadRoom]);

  /**
   * Restore lease dates only from navigate state (step 2 "Change dates") or session fallback
   * (same-tab browser Back). Do not pre-fill from the draft snapshot — stale months were annoying
   * when starting booking from room listings again.
   */
  useEffect(() => {
    if (!roomId || !room) return;
    const nav = location.state as DatesLocationState;
    const apply = (moveIn: string, end: string) => {
      setMoveInDate(moveIn);
      setLeaseEndDate(end);
      setCalendarYear(parseISO(moveIn).getFullYear());
      setPendingStartMonthKey(null);
    };

    if (nav?.moveInDate && nav?.leaseEndDate) {
      apply(nav.moveInDate, nav.leaseEndDate);
      return;
    }

    const fromSession = loadBookingLeasePickSession(roomId);
    if (fromSession) {
      apply(fromSession.moveInDate, fromSession.leaseEndDate);
      return;
    }

    setMoveInDate('');
    setLeaseEndDate('');
    setPendingStartMonthKey(null);
    setCalendarYear(new Date().getFullYear());
  }, [roomId, room, location.state]);

  useEffect(() => {
    if (!roomId) return;
    const y = new Date(calendarYear, 0, 1);
    const from = startOfYear(y);
    const to = endOfYear(y);
    let cancelled = false;
    setLoadingCal(true);
    fetchRoomAvailability(roomId, from, to)
      .then((res) => {
        if (!cancelled) setBlocks(res.blocks);
      })
      .catch(() => {
        if (!cancelled) setBlocks([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingCal(false);
      });
    return () => {
      cancelled = true;
    };
  }, [roomId, calendarYear]);

  const minStartMonth = useMemo(() => {
    if (room?.nextAvailableDate) return ymdToMonthKey(room.nextAvailableDate);
    return format(startOfMonth(new Date()), 'yyyy-MM');
  }, [room]);

  const startMonthValue = moveInDate ? ymdToMonthKey(moveInDate) : '';
  const endMonthValue = leaseEndDate ? ymdToMonthKey(leaseEndDate) : '';

  /** Resolve a yyyy-MM start month to an actual yyyy-MM-dd, honoring mid-month `nextAvailableDate`. */
  const resolveStartYmd = useCallback(
    (monthKey: string) => {
      const firstDay = `${monthKey}-01`;
      if (room?.nextAvailableDate) {
        const nav = room.nextAvailableDate.slice(0, 10);
        if (nav.startsWith(monthKey) && nav >= firstDay) return nav;
      }
      return firstDay;
    },
    [room]
  );

  /** Picker: lease start month only — end month must be chosen separately. */
  const onStartMonthChange = (monthKey: string) => {
    if (!monthKey) return;
    const startYmd = resolveStartYmd(monthKey);
    setPendingStartMonthKey(null);
    setMoveInDate(startYmd);
    setLeaseEndDate('');
    setCalendarYear(parseInt(monthKey.slice(0, 4), 10));
  };

  const onEndMonthChange = (monthKey: string) => {
    if (!monthKey) return;
    const last = format(endOfMonth(parseISO(`${monthKey}-01`)), 'yyyy-MM-dd');
    setLeaseEndDate(last);
    setPendingStartMonthKey(null);
  };

  /**
   * Two-step click flow on the year grid:
   *   1st click → arm "pick end" mode (no commit yet).
   *   2nd click on a later month → commit move-in + lease end together.
   *   Earlier-or-same click → restart with that month as the new pending start.
   */
  const onCalendarMonthClick = useCallback(
    (monthKey: string) => {
      const isMonthBlocked = (mk: string) => {
        const y = parseInt(mk.slice(0, 4), 10);
        const m0 = parseInt(mk.slice(5, 7), 10) - 1;
        return monthOverlapsBlocks(y, m0, blocks);
      };

      if (!pendingStartMonthKey) {
        setMoveInDate('');
        setLeaseEndDate('');
        setPendingStartMonthKey(monthKey);
        return;
      }

      if (monthKey <= pendingStartMonthKey) {
        setMoveInDate('');
        setLeaseEndDate('');
        setPendingStartMonthKey(monthKey);
        return;
      }

      if (!isMonthRangeAllFree(pendingStartMonthKey, monthKey, isMonthBlocked)) {
        toast.error(
          'Some months in that range are blocked. Pick an end month before the next blocked period.'
        );
        return;
      }

      const startYmd = resolveStartYmd(pendingStartMonthKey);
      const endYmd = format(endOfMonth(parseISO(`${monthKey}-01`)), 'yyyy-MM-dd');
      setMoveInDate(startYmd);
      setLeaseEndDate(endYmd);
      setPendingStartMonthKey(null);
    },
    [pendingStartMonthKey, resolveStartYmd, blocks]
  );

  const goApply = async () => {
    if (!roomId || !room) return;
    if (room.status === 'maintenance') {
      toast.error('This room cannot be booked while under maintenance.');
      return;
    }
    if (!moveInDate || !leaseEndDate) {
      toast.error('Please choose lease start and end months.');
      return;
    }
    if (moveInDate >= leaseEndDate) {
      toast.error('Lease must end after the period starts.');
      return;
    }

    const from = new Date();
    const to = addMonths(from, 30);
    let allBlocks: RoomAvailabilityBlock[] = blocks;
    try {
      const wide = await fetchRoomAvailability(roomId, from, to);
      allBlocks = wide.blocks;
    } catch {
      /* use month blocks as fallback */
    }

    if (rangeConflictsWithBlocks(moveInDate, leaseEndDate, allBlocks)) {
      toast.error('Your selected months overlap an unavailable period. Adjust the range.');
      return;
    }

    updateDraftLeaseDates(
      roomId,
      { number: room.number, floor: room.floor, type: room.type, rent: room.rent },
      moveInDate,
      leaseEndDate
    );
    saveBookingLeasePickSession(roomId, moveInDate, leaseEndDate);
    navigate(`/booking/${roomId}`, {
      state: { moveInDate, leaseEndDate },
    });
  };

  if (loadingRoom || !room) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center text-gray-500">Loading room…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Button
          variant="secondary"
          leftIcon={<ArrowLeft className="h-5 w-5" />}
          onClick={() => navigate('/rooms')}
          className="mb-4"
        >
          Back to rooms
        </Button>

        <h1 className="text-2xl font-bold text-gray-900">Step 1 — Choose lease months</h1>
        <p className="text-gray-600 mt-1">
          Room {room.number} · Floor {room.floor} ·{' '}
          <span className="capitalize">{room.type}</span>
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Leases are by full months — pick a range on the grid or using the fields below. Red months overlap
          an existing lease or hold.
        </p>
        {room.status === 'occupied' && room.nextAvailableDate && (
          <p className="mt-2 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
            This room is currently occupied. The earliest lease can begin from{' '}
            <strong>{room.nextAvailableDate}</strong>. Admin approval
            still requires the room to be vacant.
          </p>
        )}

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
            onClick={() => setCalendarYear((y) => y - 1)}
            aria-label="Previous year"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold text-gray-800">{calendarYear}</h2>
          <button
            type="button"
            className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
            onClick={() => setCalendarYear((y) => y + 1)}
            aria-label="Next year"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {loadingCal ? (
          <p className="text-sm text-gray-500 my-4">Loading availability…</p>
        ) : (
          <div className="mt-2">
            <RoomAvailabilityCalendar
              year={calendarYear}
              blocks={blocks}
              moveInDate={moveInDate}
              leaseEndDate={leaseEndDate}
              minMonthKey={minStartMonth}
              pendingStartMonthKey={pendingStartMonthKey}
              onMonthClick={onCalendarMonthClick}
            />
            {pendingStartMonthKey && (
              <div className="mt-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
                Lease starts <strong>{pendingStartMonthKey}</strong>. Hover forward, then click a later month
                to set the end.
              </div>
            )}
          </div>
        )}

        <Card title="Monthly lease" className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="lease-start-month" className="block text-sm font-medium text-gray-700 mb-1">
                Lease starts (month)
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="lease-start-month"
                  type="month"
                  min={minStartMonth}
                  value={startMonthValue}
                  onChange={(e) => onStartMonthChange(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 pl-10 pr-4"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Normally starts the <strong>1st</strong>. If the building&apos;s first free day in this month
                is later, we keep that day (see exact dates below and on the calendar).
              </p>
            </div>
            <div>
              <label htmlFor="lease-end-month" className="block text-sm font-medium text-gray-700 mb-1">
                Lease ends (month)
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="lease-end-month"
                  type="month"
                  min={startMonthValue || minStartMonth}
                  value={endMonthValue}
                  onChange={(e) => onEndMonthChange(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 pl-10 pr-4"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Ends on the <strong>last day</strong> of this month.
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-4 rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
            <span className="font-medium text-gray-800">Exact dates sent to the building:</span>{' '}
            {moveInDate || '—'} → {leaseEndDate || '—'}
          </p>
          <p className="text-sm text-gray-500 mt-3">
            Step 2 will ask for your details and documents. Payment is step 3 after you submit the
            application.
          </p>
          <div className="mt-6 flex justify-end">
            <Button onClick={goApply}>Continue to application</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default BookingDatesPage;
