import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import PublicRooms from './pages/PublicRooms';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRooms from './pages/admin/AdminRooms';
import AdminPayments from './pages/admin/AdminPayments';
import AdminComplaints from './pages/admin/AdminComplaints';
import AdminTenants from './pages/admin/AdminTenants';
import AdminBookings from './pages/admin/AdminBookings';
import TenantDashboard from './pages/tenant/TenantDashboard';
import TenantComplaints from './pages/tenant/TenantComplaints';
import TenantPayments from './pages/tenant/TenantPayments';
import TenantProfile from './pages/tenant/TenantProfile';
import TenantApplications from './pages/tenant/TenantApplications';
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
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <Toaster position="top-right" />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/rooms" element={<PublicRooms />} />
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
                path="/booking/:roomId"
                element={
                  <ProtectedRoute>
                    <BookingForm />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route 
                path="/admin/dashboard" 
                element={
                  <ProtectedRoute allowedRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/rooms" 
                element={
                  <ProtectedRoute allowedRole="admin">
                    <AdminRooms />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/payments" 
                element={
                  <ProtectedRoute allowedRole="admin">
                    <AdminPayments />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/complaints" 
                element={
                  <ProtectedRoute allowedRole="admin">
                    <AdminComplaints />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/tenants" 
                element={
                  <ProtectedRoute allowedRole="admin">
                    <AdminTenants />
                  </ProtectedRoute>
                } 
              />

              <Route
                path="/admin/bookings"
                element={
                  <ProtectedRoute allowedRole="admin">
                    <AdminBookings />
                  </ProtectedRoute>
                }
              />

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
    </ThemeProvider>
  );
}

export default App;