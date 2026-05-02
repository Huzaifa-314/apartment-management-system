import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import NotificationBell from './NotificationBell';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { settings } = useSiteSettings();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const handleLogout = () => {
    logout();
  };

  const AdminNavLinks = () => (
    <>
      <Link
        to="/admin/dashboard"
        className={`px-3 py-2 rounded-md text-sm font-medium ${
          isActive('/admin/dashboard')
            ? 'bg-blue-700 text-white'
            : 'text-gray-300 hover:bg-blue-600 hover:text-white'
        }`}
      >
        Dashboard
      </Link>
      <Link
        to="/admin/rooms"
        className={`px-3 py-2 rounded-md text-sm font-medium ${
          isActive('/admin/rooms')
            ? 'bg-blue-700 text-white'
            : 'text-gray-300 hover:bg-blue-600 hover:text-white'
        }`}
      >
        Rooms
      </Link>
      <Link
        to="/admin/tenants"
        className={`px-3 py-2 rounded-md text-sm font-medium ${
          isActive('/admin/tenants')
            ? 'bg-blue-700 text-white'
            : 'text-gray-300 hover:bg-blue-600 hover:text-white'
        }`}
      >
        Tenants
      </Link>
      <Link
        to="/admin/payments"
        className={`px-3 py-2 rounded-md text-sm font-medium ${
          isActive('/admin/payments')
            ? 'bg-blue-700 text-white'
            : 'text-gray-300 hover:bg-blue-600 hover:text-white'
        }`}
      >
        Payments
      </Link>
      <Link
        to="/admin/complaints"
        className={`px-3 py-2 rounded-md text-sm font-medium ${
          isActive('/admin/complaints')
            ? 'bg-blue-700 text-white'
            : 'text-gray-300 hover:bg-blue-600 hover:text-white'
        }`}
      >
        Complaints
      </Link>
      <Link
        to="/admin/bookings"
        className={`px-3 py-2 rounded-md text-sm font-medium ${
          isActive('/admin/bookings')
            ? 'bg-blue-700 text-white'
            : 'text-gray-300 hover:bg-blue-600 hover:text-white'
        }`}
      >
        Bookings
      </Link>
      <Link
        to="/admin/reports"
        className={`px-3 py-2 rounded-md text-sm font-medium ${
          isActive('/admin/reports')
            ? 'bg-blue-700 text-white'
            : 'text-gray-300 hover:bg-blue-600 hover:text-white'
        }`}
      >
        Reports
      </Link>
    </>
  );

  const TenantNavLinks = () => (
    <>
      <Link
        to="/tenant/dashboard"
        className={`px-3 py-2 rounded-md text-sm font-medium ${
          isActive('/tenant/dashboard')
            ? 'bg-blue-700 text-white'
            : 'text-gray-300 hover:bg-blue-600 hover:text-white'
        }`}
      >
        Dashboard
      </Link>
      <Link
        to="/tenant/payments"
        className={`px-3 py-2 rounded-md text-sm font-medium ${
          isActive('/tenant/payments')
            ? 'bg-blue-700 text-white'
            : 'text-gray-300 hover:bg-blue-600 hover:text-white'
        }`}
      >
        Payments
      </Link>
      <Link
        to="/tenant/complaints"
        className={`px-3 py-2 rounded-md text-sm font-medium ${
          isActive('/tenant/complaints')
            ? 'bg-blue-700 text-white'
            : 'text-gray-300 hover:bg-blue-600 hover:text-white'
        }`}
      >
        Complaints
      </Link>
      <Link
        to="/tenant/applications"
        className={`px-3 py-2 rounded-md text-sm font-medium ${
          isActive('/tenant/applications')
            ? 'bg-blue-700 text-white'
            : 'text-gray-300 hover:bg-blue-600 hover:text-white'
        }`}
      >
        Applications
      </Link>
      <Link
        to="/tenant/profile"
        className={`px-3 py-2 rounded-md text-sm font-medium ${
          isActive('/tenant/profile')
            ? 'bg-blue-700 text-white'
            : 'text-gray-300 hover:bg-blue-600 hover:text-white'
        }`}
      >
        Profile
      </Link>
    </>
  );

  return (
    <nav className="bg-blue-800 shadow-lg">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to="/" className="text-white font-bold text-xl">
                {settings.propertyName}
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {user?.role === 'admin' ? <AdminNavLinks /> : <TenantNavLinks />}
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              <NotificationBell />

              {/* Profile dropdown */}
              <div className="ml-3 relative">
                <div>
                  <button
                    onClick={toggleProfile}
                    className="max-w-xs flex items-center text-sm rounded-full text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-800 focus:ring-white"
                    id="user-menu"
                    aria-expanded="false"
                    aria-haspopup="true"
                  >
                    <span className="sr-only">Open user menu</span>
                    <img
                      className="h-8 w-8 rounded-full"
                      src={user?.profileImage || 'https://images.pexels.com/photos/1761279/pexels-photo-1761279.jpeg'}
                      alt=""
                    />
                  </button>
                </div>

                {isProfileOpen && (
                  <div
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu"
                  >
                    <div className="px-4 py-2 text-sm text-gray-700 border-b">
                      <p className="font-medium">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <Link
                      to={user?.role === 'admin' ? "/admin/profile" : "/tenant/profile"}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      <User className="mr-2 h-4 w-4" />
                      Your Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="-mr-2 flex md:hidden">
            {/* Mobile menu button */}
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-200 hover:text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-800 focus:ring-white"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {user?.role === 'admin' ? <AdminNavLinks /> : <TenantNavLinks />}
          </div>
          <div className="pt-4 pb-3 border-t border-blue-700">
            <div className="flex items-center px-5">
              <div className="flex-shrink-0">
                <img
                  className="h-10 w-10 rounded-full"
                  src={user?.profileImage || 'https://images.pexels.com/photos/1761279/pexels-photo-1761279.jpeg'}
                  alt=""
                />
              </div>
              <div className="ml-3">
                <div className="text-base font-medium leading-none text-white">
                  {user?.name}
                </div>
                <div className="text-sm font-medium leading-none text-gray-300">
                  {user?.email}
                </div>
              </div>
              <NotificationBell />
            </div>
            <div className="mt-3 px-2 space-y-1">
              <Link
                to={user?.role === 'admin' ? "/admin/profile" : "/tenant/profile"}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-blue-700"
              >
                Your Profile
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-blue-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;