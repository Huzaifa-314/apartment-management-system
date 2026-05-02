import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, MapPin, Maximize, Users } from 'lucide-react';
import Button from '../components/shared/Button';
import Card from '../components/shared/Card';
import Badge from '../components/shared/Badge';
import { api } from '../lib/api';
import { saveBookingDraftFromPublicRoom } from '../lib/bookingDraft';
import { Room } from '../types';
import PublicSiteHeader from '../components/shared/PublicSiteHeader';
import { useAuth } from '../context/AuthContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { formatCurrency } from '../lib/formatCurrency';
import { getAmenityIcon } from '../lib/amenityIcon';
import PublicFooter from '../components/shared/PublicFooter';

const PublicRooms: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useSiteSettings();
  const dashboardHref = user?.role === 'admin' ? '/admin/dashboard' : '/tenant/dashboard';
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get<{ rooms: Room[] }>('/api/rooms/public?include=all');
        setAvailableRooms(data.rooms);
      } catch {
        setAvailableRooms([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredRooms = availableRooms.filter(room => {
    const typeMatch = selectedType === 'all' || room.type === selectedType;
    const floorMatch = selectedFloor === 'all' || room.floor.toString() === selectedFloor;
    return typeMatch && floorMatch;
  });

  const getRoomTypeColor = (type: Room['type']) => {
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
  };

  const goToBooking = (room: Room) => {
    saveBookingDraftFromPublicRoom(room);
    navigate(`/booking/${room.id}/dates`);
  };

  const visitContactEmail = settings.contactEmail?.trim() || 'info@mastervilla.com';
  const scheduleVisitMailto = `mailto:${encodeURIComponent(visitContactEmail)}?subject=${encodeURIComponent(`Visit request — ${settings.propertyName}`)}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading rooms...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicSiteHeader variant="rooms" />

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Find your perfect room
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">{settings.publicRoomsIntro}</p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              >
                <option value="all">All Types</option>
                <option value="single">Single Room</option>
                <option value="double">Double Room</option>
                <option value="premium">Premium Room</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Floor
              </label>
              <select
                value={selectedFloor}
                onChange={(e) => setSelectedFloor(e.target.value)}
                className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              >
                <option value="all">All Floors</option>
                <option value="1">Floor 1</option>
                <option value="2">Floor 2</option>
                <option value="3">Floor 3</option>
                <option value="4">Floor 4</option>
                <option value="5">Floor 5</option>
              </select>
            </div>

            <div className="flex items-end">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Available Rooms</p>
                <p className="text-3xl font-bold text-blue-600">{filteredRooms.length}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Room Grid */}
        <div id="rooms-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => (
            <Card 
              key={room.id} 
              className="hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="relative">
                {/* Room Image Placeholder */}
                <div className="h-48 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg mb-4 flex items-center justify-center">
                  <Building2 className="h-16 w-16 text-blue-500" />
                </div>

                {/* Room Type Badge */}
                <div className="absolute top-2 right-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoomTypeColor(room.type)}`}>
                    {room.type.charAt(0).toUpperCase() + room.type.slice(1)}
                  </span>
                </div>
              </div>

              {/* Room Details */}
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Room {room.number}</h3>
                    <div className="flex items-center text-gray-600 mt-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="text-sm">Floor {room.floor}</span>
                    </div>
                  </div>
                  <Badge
                    variant={room.status === 'vacant' ? 'success' : 'warning'}
                    size="sm"
                  >
                    {room.status === 'vacant'
                      ? 'Available now'
                      : room.nextAvailableDate
                        ? `From ${room.nextAvailableDate}`
                        : 'Waitlist'}
                  </Badge>
                </div>

                {/* Room Metadata */}
                <div className="grid grid-cols-2 gap-4 py-3 border-t border-b border-gray-100">
                  <div className="flex items-center">
                    <Maximize className="h-4 w-4 text-gray-500 mr-2" />
                    <div>
                      <p className="text-xs text-gray-500">Area</p>
                      <p className="font-medium">{room.area} sq.ft</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-gray-500 mr-2" />
                    <div>
                      <p className="text-xs text-gray-500">Capacity</p>
                      <p className="font-medium">
                        {room.type === 'single' ? '1 Person' : 
                         room.type === 'double' ? '2 People' : '2+ People'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {room.amenities.slice(0, 4).map((amenity, index) => (
                      <div 
                        key={index}
                        className="flex items-center px-2 py-1 bg-gray-50 rounded-full text-xs text-gray-600"
                      >
                        {getAmenityIcon(amenity)}
                        <span className="ml-1">{amenity}</span>
                      </div>
                    ))}
                    {room.amenities.length > 4 && (
                      <span className="px-2 py-1 bg-gray-50 rounded-full text-xs text-gray-500">
                        +{room.amenities.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Monthly Rent */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">Monthly Rent</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(room.rent, settings.currencySymbol)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Includes</p>
                      <p className="text-sm text-gray-600">Utilities & Maintenance</p>
                    </div>
                  </div>
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
                    {room.status === 'vacant' ? 'Book now' : 'Reserve'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* No Rooms Available */}
        {filteredRooms.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms available</h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your filters or check back later for new availability.
            </p>
            <Link to={user ? dashboardHref : '/login'}>
              <Button variant="primary">
                {user ? 'Go to dashboard' : 'Join Waitlist'}
              </Button>
            </Link>
          </div>
        )}

        {/* Call to Action Section */}
        <div className="mt-12 rounded-xl bg-gradient-to-r from-blue-600 to-blue-800 p-8 text-center text-white shadow-sm">
          <h2 className="mb-2 text-2xl font-semibold">{settings.publicRoomsCtaTitle}</h2>
          <p className="mx-auto mb-6 max-w-2xl text-base text-blue-100">{settings.publicRoomsCtaSubtext}</p>
          <div className="flex flex-wrap justify-center gap-3">
            {user ? (
              <Button
                href={scheduleVisitMailto}
                variant="secondary"
                size="lg"
                className="!border !border-white/30 !bg-white !text-blue-700 shadow-sm hover:!bg-blue-50"
              >
                Schedule Visit
              </Button>
            ) : (
              <Button
                to="/login"
                variant="secondary"
                size="lg"
                className="!border !border-white/30 !bg-white !text-blue-700 shadow-sm hover:!bg-blue-50"
              >
                Schedule Visit
              </Button>
            )}
            {user ? (
              <Button
                href="#rooms-grid"
                variant="primary"
                size="lg"
                className="!border !border-white/40 !bg-transparent !text-white hover:!bg-white/15"
              >
                Browse rooms
              </Button>
            ) : (
              <Button
                to="/register"
                variant="primary"
                size="lg"
                className="!border !border-white/40 !bg-transparent !text-white hover:!bg-white/15"
              >
                Apply Now
              </Button>
            )}
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
};

export default PublicRooms;