import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * ProtectedRoute
 * 
 * Wraps a route to require authentication and/or a specific role.
 * 
 * Usage:
 *   <ProtectedRoute>                         // Any logged in user
 *   <ProtectedRoute requiredRole="Student">  // Only students
 *   <ProtectedRoute requiredRole="Instructor"> // Only instructors
 *   <ProtectedRoute allowedRoles={['Student', 'Instructor']}>
 */
function ProtectedRoute({ children, requiredRole, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Still checking auth state
  if (loading) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '4rem',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p>Loading...</p>
      </div>
    );
  }

  // Not logged in → go to login, remember where they wanted to go
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check required role
  if (requiredRole && user.role !== requiredRole) {
    // Redirect to their own dashboard
    return <Navigate to="/dashboard" replace />;
  }

  // Check allowed roles list
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // All checks passed
  return children;
}

export default ProtectedRoute;