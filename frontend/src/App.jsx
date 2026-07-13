import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';

// Layouts
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Public Pages
import Home from './pages/Home';
import BrowseListings from './pages/shared/BrowseListings';
import ListingDetail from './pages/shared/ListingDetail';
import Chat from './pages/shared/Chat';
import Notifications from './pages/shared/Notifications';
import NotFound from './pages/shared/NotFound';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Unauthorized from './pages/auth/Unauthorized';

// Owner Pages
import OwnerDashboard from './pages/owner/Dashboard';
import MyListings from './pages/owner/MyListings';
import CreateListing from './pages/owner/CreateListing';
import EditListing from './pages/owner/EditListing';
import OwnerProfile from './pages/owner/OwnerProfile';
import OwnerRequests from './pages/owner/OwnerRequests';

// Tenant Pages
import TenantDashboard from './pages/tenant/Dashboard';
import TenantProfile from './pages/tenant/TenantProfile';
import TenantRequests from './pages/tenant/TenantRequests';

// Route Guards
import PublicRoute from './routes/PublicRoute';
import AdminRoute from './routes/AdminRoute';
import OwnerRoute from './routes/OwnerRoute';
import TenantRoute from './routes/TenantRoute';

// Admin Placeholder
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminListings from './pages/admin/AdminListings';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Landing & Shared */}
          <Route path="/" element={<MainLayout><Home /></MainLayout>} />
          
          {/* We use a route wrapper for BrowseListings based on role, but actually BrowseListings handles its own Layout dynamically so we just render it */}
          <Route path="/listings" element={<BrowseListings />} />
          <Route path="/browse" element={<BrowseListings />} />
          <Route path="/listings/:id" element={<ListingDetail />} />
          
          <Route path="/chats" element={<Chat />} />
          <Route path="/chats/:id" element={<Chat />} />
          <Route path="/notifications" element={<Notifications />} />

          {/* Auth Routes — redirect away if already logged in */}
          <Route path="/login" element={<PublicRoute><MainLayout><Login /></MainLayout></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><MainLayout><Register /></MainLayout></PublicRoute>} />
          <Route path="/unauthorized" element={<MainLayout><Unauthorized /></MainLayout>} />

          {/* Owner-only Routes */}
          <Route path="/owner" element={<Navigate to="/owner/dashboard" replace />} />
          <Route path="/owner/dashboard" element={<OwnerRoute><OwnerDashboard /></OwnerRoute>} />
          <Route path="/owner/listings" element={<OwnerRoute><MyListings /></OwnerRoute>} />
          <Route path="/owner/listings/create" element={<OwnerRoute><CreateListing /></OwnerRoute>} />
          <Route path="/owner/listings/:id/edit" element={<OwnerRoute><EditListing /></OwnerRoute>} />
          <Route path="/owner/profile" element={<OwnerRoute><OwnerProfile /></OwnerRoute>} />
          <Route path="/owner/requests" element={<OwnerRoute><OwnerRequests /></OwnerRoute>} />

          {/* Tenant-only Routes */}
          <Route path="/tenant" element={<Navigate to="/tenant/dashboard" replace />} />
          <Route path="/tenant/dashboard" element={<TenantRoute><TenantDashboard /></TenantRoute>} />
          <Route path="/tenant/profile" element={<TenantRoute><TenantProfile /></TenantRoute>} />
          <Route path="/tenant/requests" element={<TenantRoute><TenantRequests /></TenantRoute>} />

          {/* Admin-only Routes */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/listings" element={<AdminRoute><AdminListings /></AdminRoute>} />
          
          {/* Catch-all 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
