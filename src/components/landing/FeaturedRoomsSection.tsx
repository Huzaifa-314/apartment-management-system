import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, MapPin, Maximize } from 'lucide-react';
import Button from '../shared/Button';
import Card from '../shared/Card';
import { formatAmount } from '../../lib/formatAmount';
import { saveBookingDraftFromPublicRoom } from '../../lib/bookingDraft';
import type { Room } from '../../types';

function getRoomTypeColor(type: Room['type']): string {
  switch (type) {
    case 'single':
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800';
    case 'double':
      return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800';
    case 'premium':
      return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300';
  }
}

type FeaturedRoomsSectionProps = {
  rooms: Room[];
  loading: boolean;
  homepageUnavailable: boolean;
};

const FeaturedRoomsSection: React.FC<FeaturedRoomsSectionProps> = ({
  rooms,
  loading,
  homepageUnavailable,
}) => {
  const navigate = useNavigate();

  const goToBooking = (room: Room) => {
    saveBookingDraftFromPublicRoom(room);
    navigate(`/booking/${room.id}/dates`);
  };

  return (
    <section className="bg-gray-50 py-10 dark:bg-gray-900/40">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex flex-col items-start justify-between gap-3 md:flex-row md:items-end">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Featured rooms</h2>
            <p className="mt-1 max-w-xl text-sm text-gray-600 dark:text-gray-400">
              Vacant units you can book today.
            </p>
          </div>
          <Link
            to="/rooms"
            className="text-sm font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            View all rooms →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
            ))}
          </div>
        ) : homepageUnavailable ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            Room listings couldn&apos;t be loaded. Use <Link className="font-semibold underline" to="/rooms">Browse rooms</Link> to try again.
          </p>
        ) : rooms.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-950">
            <Building2 className="mx-auto mb-4 h-12 w-12 text-gray-400" aria-hidden />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No vacancies right now</h3>
            <p className="mx-auto mt-2 max-w-md text-gray-600 dark:text-gray-400">
              Check back soon or contact us for waitlist options.
            </p>
            <div className="mt-6">
              <Link to="/rooms">
                <Button variant="secondary">Browse rooms</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <Card
                key={room.id}
                className="overflow-hidden border-gray-200 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-950"
              >
                <div className="relative">
                  <div className="flex h-44 items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-950 dark:to-indigo-950">
                    <Building2 className="h-14 w-14 text-blue-600 dark:text-blue-400" aria-hidden />
                  </div>
                  <div className="absolute right-3 top-3">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${getRoomTypeColor(room.type)}`}
                    >
                      {room.type}
                    </span>
                  </div>
                </div>
                <div className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Room {room.number}</h3>
                      <div className="mt-1 flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <MapPin className="mr-1 h-4 w-4 shrink-0" aria-hidden />
                        Floor {room.floor}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 border-y border-gray-100 py-3 text-sm dark:border-gray-800">
                    <Maximize className="h-4 w-4 text-gray-500" aria-hidden />
                    <span className="text-gray-700 dark:text-gray-300">{room.area} sq.ft</span>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950/40">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Monthly rent</p>
                    <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                      {formatAmount(room.rent)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Link to={`/rooms/${room.id}`} className="block flex-1 min-w-0">
                      <Button variant="secondary" fullWidth>
                        View details
                      </Button>
                    </Link>
                    <Button
                      className="flex-1"
                      variant="primary"
                      fullWidth
                      onClick={() => goToBooking(room)}
                    >
                      Book now
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedRoomsSection;
