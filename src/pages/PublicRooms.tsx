import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, MapPin, Maximize, Users, Wifi, Car, Shield, Coffee, Dumbbell, Waves } from 'lucide-react';
import Button from '../components/shared/Button';
import Card from '../components/shared/Card';
import Badge from '../components/shared/Badge';
import { api } from '../lib/api';
import { saveBookingDraftFromPublicRoom } from '../lib/bookingDraft';
import { Room } from '../types';
import PublicSiteHeader from '../components/shared/PublicSiteHeader';
import { useAuth } from '../context/AuthContext';

const PublicRooms: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const dashboardHref = user?.role === 'admin' ? '/admin/dashboard' : '/tenant/dashboard';
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get<{ rooms: Room[] }>('/api/rooms/public');
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

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'wifi':
      case 'internet':
        return <Wifi className="h-4 w-4" />;
      case 'parking':
        return <Car className="h-4 w-4" />;
      case 'security':
        return <Shield className="h-4 w-4" />;
      case 'cafeteria':
      case 'cafe':
        return <Coffee className="h-4 w-4" />;
      case 'gym':
      case 'fitness':
        return <Dumbbell className="h-4 w-4" />;
      case 'swimming pool':
      case 'pool':
        return <Waves className="h-4 w-4" />;
      default:
        return <Building2 className="h-4 w-4" />;
    }
  };

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
    navigate(`/booking/${room.id}`);
  };

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
            Find Your Perfect Room
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover comfortable and affordable rooms at Master Villa. 
            Modern amenities, prime location, and excellent service.
          </p>
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
                  <Badge variant="success" size="sm">Available</Badge>
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
                      <p className="text-2xl font-bold text-blue-600">₹{room.rent.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Includes</p>
                      <p className="text-sm text-gray-600">Utilities & Maintenance</p>
                    </div>
                  </div>
                </div>

                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => goToBooking(room)}
                >
                  Book Now
                </Button>

                {/* Contact Info */}
                <div className="text-center pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Need more info?{' '}
                    <a href="mailto:info@mastervilla.com" className="text-blue-600 hover:text-blue-800">
                      Contact us
                    </a>
                  </p>
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
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Move In?</h2>
          <p className="text-xl text-blue-100 mb-6">
            Join hundreds of satisfied residents at Master Villa
          </p>
          <div className="flex justify-center flex-wrap gap-4">
            {user ? (
              <a href="mailto:info@mastervilla.com?subject=Visit%20request%20%E2%80%94%20Master%20Villa">
                <Button variant="secondary" size="lg">
                  Schedule Visit
                </Button>
              </a>
            ) : (
              <Link to="/login">
                <Button variant="secondary" size="lg">
                  Schedule Visit
                </Button>
              </Link>
            )}
            {user ? (
              <a href="#rooms-grid">
                <Button variant="primary" size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                  Browse rooms
                </Button>
              </a>
            ) : (
              <Link to="/register">
                <Button variant="primary" size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                  Apply Now
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Building2 className="h-6 w-6" />
                <span className="text-xl font-bold">Master Villa</span>
              </div>
              <p className="text-gray-400">
                Premium room management system for modern living.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <div className="space-y-2 text-gray-400">
                <p>📞 +91 12345 67890</p>
                <p>✉️ info@mastervilla.com</p>
                <p>📍 123 Main Street, City</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link to={user ? dashboardHref : '/login'} className="block text-gray-400 hover:text-white">
                  {user ? 'Dashboard' : 'Login'}
                </Link>
                <Link to="/rooms#rooms-grid" className="block text-gray-400 hover:text-white">
                  Browse rooms
                </Link>
                <a href="mailto:info@mastervilla.com" className="block text-gray-400 hover:text-white">
                  Contact
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Master Villa. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicRooms;