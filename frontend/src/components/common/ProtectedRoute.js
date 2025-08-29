import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, requiredRole, requiredPermissions }) => {
  const { user, isAuthenticated, isLoading, initializeAuth } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    // Initialize auth listener if not already done
    if (!user && !isLoading) {
      initializeAuth();
    }
  }, [user, isLoading, initializeAuth]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // Check role-based access
  if (requiredRole && user.role !== requiredRole) {
    // Redirect to appropriate dashboard based on user role
    const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  // Check permission-based access
  if (requiredPermissions && requiredPermissions.length > 0) {
    const userPermissions = user.permissions || [];
    const hasRequiredPermissions = requiredPermissions.every(permission =>
      userPermissions.includes(permission)
    );

    if (!hasRequiredPermissions) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Check if user account is active
  if (user.status === 'suspended' || user.status === 'banned') {
    return <Navigate to="/account-suspended" replace />;
  }

  // Check if email is verified for certain actions
  if (user.requireEmailVerification && !user.emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  // All checks passed, render the protected content
  return children;
};

export default ProtectedRoute;