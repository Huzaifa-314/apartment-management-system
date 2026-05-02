import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  CircleDollarSign,
  MessageSquareWarning,
  CalendarCheck,
  FileBarChart,
  UserCircle,
  Menu,
  X,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../shared/NotificationBell';

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/rooms', label: 'Rooms', icon: Building2 },
  { to: '/admin/tenants', label: 'Tenants', icon: Users },
  { to: '/admin/payments', label: 'Payments', icon: CircleDollarSign },
  { to: '/admin/complaints', label: 'Complaints', icon: MessageSquareWarning },
  { to: '/admin/bookings', label: 'Bookings', icon: CalendarCheck },
  { to: '/admin/reports', label: 'Reports', icon: FileBarChart },
] as const;

const pathTitles: Record<string, string> = {
  '/admin/dashboard': 'Dashboard',
  '/admin/rooms': 'Rooms',
  '/admin/tenants': 'Tenants',
  '/admin/payments': 'Payments',
  '/admin/complaints': 'Complaints',
  '/admin/bookings': 'Bookings',
  '/admin/reports': 'Reports',
  '/admin/profile': 'Profile',
};

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const title = pathTitles[location.pathname] ?? 'Admin';

  return (
    <div className="min-h-screen flex bg-slate-100 text-slate-900">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-56 shrink-0 bg-slate-900 text-white flex flex-col border-r border-slate-800 transform transition-transform duration-200 ease-out lg:transform-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-14 flex items-center justify-between px-4 border-b border-slate-800">
          <span className="font-semibold tracking-tight">Master Villa</span>
          <button
            type="button"
            className="lg:hidden p-1 rounded hover:bg-slate-800"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin/dashboard'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0 opacity-90" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-2 border-t border-slate-800">
          <NavLink
            to="/admin/profile"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <UserCircle className="h-5 w-5 shrink-0 opacity-90" />
            Profile
          </NavLink>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <header className="h-14 shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              className="lg:hidden p-2 rounded-md border border-slate-200 hover:bg-slate-50"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5 text-slate-700" />
            </button>
            <h1 className="text-lg font-semibold text-slate-900 truncate">{title}</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <NotificationBell />
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((o) => !o)}
                className="flex items-center gap-2 rounded-lg pl-2 pr-2 py-1.5 hover:bg-slate-100 border border-transparent hover:border-slate-200"
              >
                <img
                  className="h-8 w-8 rounded-full object-cover"
                  src={
                    user?.profileImage ||
                    'https://images.pexels.com/photos/1761279/pexels-photo-1761279.jpeg'
                  }
                  alt=""
                />
                <ChevronDown className="h-4 w-4 text-slate-500 hidden sm:block" />
              </button>
              {profileOpen && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-40 cursor-default"
                    aria-label="Close menu"
                    onClick={() => setProfileOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-52 rounded-lg shadow-lg bg-white ring-1 ring-black/5 z-50 py-1">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-sm font-medium text-slate-900 truncate">{user?.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>
                    <NavLink
                      to="/admin/profile"
                      className="flex items-center px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      onClick={() => setProfileOpen(false)}
                    >
                      <UserCircle className="h-4 w-4 mr-2" />
                      Profile
                    </NavLink>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 py-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
