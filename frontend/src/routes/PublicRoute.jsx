import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Loader = () => (
  <div className="page-loader"><div className="spinner"></div></div>
);

const PublicRoute = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  if (isLoading) return <Loader />;
  if (isAuthenticated && user) {
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'OWNER') return <Navigate to="/owner/dashboard" replace />;
    return <Navigate to="/tenant/dashboard" replace />;
  }
  return children;
};

export default PublicRoute;
