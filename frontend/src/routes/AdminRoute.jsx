import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Loader = () => (
  <div className="page-loader"><div className="spinner"></div></div>
);

const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <Loader />;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  if (user.role !== 'ADMIN') return <Navigate to="/unauthorized" replace />;
  return children;
};

export default AdminRoute;
