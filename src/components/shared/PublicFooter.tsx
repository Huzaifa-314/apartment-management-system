import React from 'react';
import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSiteSettings } from '../../context/SiteSettingsContext';

const PublicFooter: React.FC = () => {
  const { user } = useAuth();
  const { settings } = useSiteSettings();
  const dashboardHref = user?.role === 'admin' ? '/admin/dashboard' : '/tenant/dashboard';

  return (
    <footer className="bg-gray-900 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Building2 className="h-6 w-6" />
              <span className="text-xl font-bold">{settings.propertyName}</span>
            </div>
            <p className="text-gray-400">{settings.footerTagline}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <div className="space-y-2 text-gray-400">
              <p>📞 {settings.phone}</p>
              <p>✉️ {settings.contactEmail}</p>
              <p>📍 {settings.footerAddress}</p>
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
              <a
                href={`mailto:${encodeURIComponent(settings.contactEmail)}`}
                className="block text-gray-400 hover:text-white"
              >
                Contact
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>
            &copy; {new Date().getFullYear()} {settings.propertyName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
