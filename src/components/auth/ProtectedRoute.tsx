import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles 
}) => {
  const { isAuthenticated, isLoading, user, activeRole, needsRoleSelection } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to role selection if user has multiple roles and hasn't selected one
  if (user && needsRoleSelection) {
    return <Navigate to="/select-role" state={{ from: location }} replace />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role permissions using activeRole
  if (allowedRoles && activeRole && !allowedRoles.includes(activeRole)) {
    // Redirect to appropriate dashboard based on active role
    const dashboardPath = activeRole === 'admin' 
      ? '/admin' 
      : activeRole === 'coordinador' 
        ? '/coordinador'
        : activeRole === 'docente' 
        ? '/docente' 
        : '/estudiante';
    return <Navigate to={dashboardPath} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
