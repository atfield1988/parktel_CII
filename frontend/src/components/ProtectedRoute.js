import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles || allowedRoles.length === 0) return <Outlet />;

  const hasPermission = allowedRoles.includes(user.role);
  return hasPermission ? <Outlet /> : <Navigate to="/" replace />;
};

export default ProtectedRoute;
