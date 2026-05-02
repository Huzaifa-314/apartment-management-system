import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { SiteSettingsProvider } from './context/SiteSettingsContext';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import PublicRooms from './pages/PublicRooms';
import PublicRoomDetail from './pages/PublicRoomDetail';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRooms from './pages/admin/AdminRooms';
import AdminPayments from './pages/admin/AdminPayments';
import AdminComplaints from './pages/admin/AdminComplaints';
import AdminTenants from './pages/admin/AdminTenants';
import AdminBookings from './pages/admin/AdminBookings';
import AdminReports from './pages/admin/AdminReports';
import AdminProfile from './pages/admin/AdminProfile';
import AdminSiteSettings from './pages/admin/AdminSiteSettings';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import AdminLayout from './components/admin/AdminLayout';
import TenantDashboard from './pages/tenant/TenantDashboard';
import TenantComplaints from './pages/tenant/TenantComplaints';
import TenantPayments from './pages/tenant/TenantPayments';
import TenantPaymentCheckout from './pages/tenant/TenantPaymentCheckout';
import TenantProfile from './pages/tenant/TenantProfile';
import TenantApplications from './pages/tenant/TenantApplications';
import BookingDatesPage from './pages/BookingDatesPage';
import BookingForm from './pages/BookingForm';
import BookingCheckout from './pages/BookingCheckout';
import BookingSuccess from './pages/BookingSuccess';

// Protected Route component
const ProtectedRoute = ({ children, allowedRole }: { children: React.ReactNode; allowedRole?: string }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/tenant/dashboard'} replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider>
      <SiteSettingsProvider>
        <AuthProvider>
          <NotificationProvider>
            <Router>
              <Toaster position="top-right" />
              <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/rooms" element={<PublicRooms />} />
              <Route path="/rooms/:roomId" element={<PublicRoomDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              {/* Static booking paths must be registered before /booking/:roomId or "success"/"checkout" are captured as room IDs. */}
              <Route path="/booking/success" element={<BookingSuccess />} />
              <Route
                path="/booking/checkout/:bookingId"
                element={
                  <ProtectedRoute>
                    <BookingCheckout />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/booking/:roomId/dates"
                element={
                  <ProtectedRoute>
                    <BookingDatesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/booking/:roomId"
                element={
                  <ProtectedRoute>
                    <BookingForm />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes — traditional sidebar layout */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRole="admin">
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="rooms" element={<AdminRooms />} />
                <Route path="payments" element={<AdminPayments />} />
                <Route path="complaints" element={<AdminComplaints />} />
                <Route path="tenants" element={<AdminTenants />} />
                <Route path="bookings" element={<AdminBookings />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="site-settings" element={<AdminSiteSettings />} />
                <Route path="announcements" element={<AdminAnnouncements />} />
                <Route path="profile" element={<AdminProfile />} />
              </Route>

              {/* Tenant Routes */}
              <Route 
                path="/tenant/dashboard" 
                element={
                  <ProtectedRoute allowedRole="tenant">
                    <TenantDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/tenant/complaints" 
                element={
                  <ProtectedRoute allowedRole="tenant">
                    <TenantComplaints />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/tenant/payments" 
                element={
                  <ProtectedRoute allowedRole="tenant">
                    <TenantPayments />
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/tenant/payments/checkout/:paymentId"
                element={
                  <ProtectedRoute allowedRole="tenant">
                    <TenantPaymentCheckout />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tenant/payments/success"
                element={
                  <ProtectedRoute allowedRole="tenant">
                    <TenantPayments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tenant/profile"
                element={
                  <ProtectedRoute allowedRole="tenant">
                    <TenantProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tenant/applications"
                element={
                  <ProtectedRoute allowedRole="tenant">
                    <TenantApplications />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Router>
          </NotificationProvider>
        </AuthProvider>
      </SiteSettingsProvider>
    </ThemeProvider>
  );
}

export default App;