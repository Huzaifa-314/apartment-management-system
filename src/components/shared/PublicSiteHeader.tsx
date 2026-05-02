import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Home, LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import Button from './Button';

type PublicSiteHeaderProps = {
  /** Landing shows an extra "Browse Rooms" control before auth actions. */
  variant?: 'landing' | 'rooms';
};

const PublicSiteHeader: React.FC<PublicSiteHeaderProps> = ({ variant = 'rooms' }) => {
  const { user, loading, logout } = useAuth();
  const { settings } = useSiteSettings();

  const dashboardHref = user?.role === 'admin' ? '/admin/dashboard' : '/tenant/dashboard';

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center gap-4 flex-wrap">
          <Link to="/" className="flex items-center space-x-2 min-w-0">
            {variant === 'landing' ? (
              <Home className="h-8 w-8 text-blue-600 shrink-0" />
            ) : (
              <Building2 className="h-8 w-8 text-blue-600 shrink-0" />
            )}
            <span className="text-2xl font-bold text-gray-900">{settings.propertyName}</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
            {variant === 'landing' && (
              <Link to="/rooms">
                <Button variant="secondary">Browse Rooms</Button>
              </Link>
            )}

            {loading ? (
              <div className="flex items-center justify-center h-10 px-3">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
              </div>
            ) : user ? (
              <>
                <Link to={dashboardHref}>
                  <Button variant="secondary" leftIcon={<LayoutDashboard className="h-4 w-4" />}>
                    Dashboard
                  </Button>
                </Link>
                <Button
                  type="button"
                  variant="ghost"
                  leftIcon={<LogOut className="h-4 w-4" />}
                  onClick={() => void logout()}
                >
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="secondary">Login</Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default PublicSiteHeader;
