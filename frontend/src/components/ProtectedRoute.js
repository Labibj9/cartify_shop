import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

function ProtectedRoute({ role, requireApproved = false, children }) {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const userRole = user?.role || 'user';

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role) {
    const requestedRoles = Array.isArray(role) ? role : [role];
    const roles = requestedRoles.includes('user')
      ? Array.from(new Set([...requestedRoles, 'admin', 'vendor']))
      : requestedRoles;

    if (!roles.includes(userRole)) {
      return <Navigate to="/" replace />;
    }
  }

  if (requireApproved && userRole === 'vendor' && !user?.isApproved) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
