import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Calendar,
  MapPin,
  Maximize,
  Users,
  Wrench,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import Button from '../components/shared/Button';
import Card from '../components/shared/Card';
import Badge from '../components/shared/Badge';
import PublicSiteHeader from '../components/shared/PublicSiteHeader';
import PublicFooter from '../components/shared/PublicFooter';
import { api } from '../lib/api';
import { saveBookingDraftFromPublicRoom } from '../lib/bookingDraft';
import { formatAmount } from '../lib/formatAmount';
import { getAmenityIcon } from '../lib/amenityIcon';
import type { Room } from '../types';

function getRoomTypeColor(type: Room['type']) {
  switch (type) {
    case 'single':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'double':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'premium':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}

const PublicRoomDetail: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!roomId) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const { data } = await api.get<{ room: Room }>(`/api/rooms/public/${roomId}`);
        setRoom(data.room);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [roomId]);

  const goToBooking = (r: Room) => {
    saveBookingDraftFromPublicRoom(r);
    navigate(`/booking/${r.id}/dates`);
  };

  const formatMaint = (iso?: string) => {
    if (!iso) return null;
    try {
      return format(parseISO(iso), 'MMM d, yyyy');
    } catch {
      return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading room…</p>
      </div>
    );
  }

  if (notFound || !room) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PublicSiteHeader variant="rooms" />
        <div className="container mx-auto px-4 py-16 text-center">
          <Building2 className="mx-auto h-14 w-14 text-gray-400" aria-hidden />
          <h1 className="mt-4 text-2xl font-semibold text-gray-900">Room not available</h1>
          <p className="mt-2 max-w-md mx-auto text-gray-600">
            This room may have been booked, is under maintenance, or the link is invalid.
          </p>
          <Link to="/rooms" className="mt-8 inline-block">
            <Button variant="primary" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Back to all rooms
            </Button>
          </Link>
        </div>
        <PublicFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicSiteHeader variant="rooms" />

      <div className="container mx-auto px-4 py-8">
        <Link
          to="/rooms"
          className="mb-6 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="mr-1 h-4 w-4" aria-hidden />
          All rooms
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <div className="relative">
                <div className="flex h-56 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 md:h-72">
                  <Building2 className="h-20 w-20 text-blue-500" aria-hidden />
                </div>
                <div className="absolute right-3 top-3">
                  <span
                    className={`rounded-full border px-3 py-1 text-sm font-medium capitalize ${getRoomTypeColor(room.type)}`}
                  >
                    {room.type}
                  </span>
                </div>
              </div>

              <div className="space-y-6 p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Room {room.number}</h1>
                    <div className="mt-2 flex items-center text-gray-600">
                      <MapPin className="mr-1 h-5 w-5 shrink-0" aria-hidden />
                      Floor {room.floor}
                    </div>
                  </div>
                  <Badge variant="success" size="sm">
                    Available
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 border-y border-gray-100 py-4 sm:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <Maximize className="h-5 w-5 text-gray-500" aria-hidden />
                    <div>
                      <p className="text-xs text-gray-500">Area</p>
                      <p className="font-medium text-gray-900">{room.area} sq.ft</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-gray-500" aria-hidden />
                    <div>
                      <p className="text-xs text-gray-500">Capacity</p>
                      <p className="font-medium text-gray-900">
                        {room.type === 'single' ? '1 Person' : room.type === 'double' ? '2 People' : '2+ People'}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="mb-3 text-lg font-semibold text-gray-900">Amenities</h2>
                  <div className="flex flex-wrap gap-2">
                    {room.amenities.map((amenity, index) => (
                      <div
                        key={index}
                        className="flex items-center rounded-full bg-gray-50 px-3 py-1.5 text-sm text-gray-700"
                      >
                        {getAmenityIcon(amenity)}
                        <span className="ml-1.5">{amenity}</span>
                      </div>
                    ))}
                  </div>
                  {room.amenities.length === 0 && (
                    <p className="text-sm text-gray-500">No amenities listed for this unit.</p>
                  )}
                </div>

                {(room.lastMaintenance || room.nextMaintenance) && (
                  <div className="rounded-lg border border-gray-100 bg-gray-50/80 p-4">
                    <div className="mb-2 flex items-center gap-2 font-medium text-gray-900">
                      <Wrench className="h-4 w-4 text-gray-600" aria-hidden />
                      Maintenance
                    </div>
                    <div className="grid gap-3 text-sm sm:grid-cols-2">
                      {formatMaint(room.lastMaintenance) && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <Calendar className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
                          <span>Last: {formatMaint(room.lastMaintenance)}</span>
                        </div>
                      )}
                      {formatMaint(room.nextMaintenance) && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <Calendar className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
                          <span>Next: {formatMaint(room.nextMaintenance)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <div className="flex flex-col gap-4">
                <div className="rounded-lg bg-blue-50 p-4">
                  <p className="text-sm text-gray-600">Monthly rent</p>
                  <p className="mt-1 text-3xl font-bold text-blue-600">
                    {formatAmount(room.rent)}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">Includes utilities and maintenance.</p>
                </div>
                <div className="flex flex-col gap-3">
                  <Button variant="primary" fullWidth size="lg" onClick={() => goToBooking(room)}>
                    Book now
                  </Button>
                  <Link to="/rooms" className="block">
                    <Button variant="secondary" fullWidth>
                      View other rooms
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
};

export default PublicRoomDetail;
