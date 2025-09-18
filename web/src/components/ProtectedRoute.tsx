import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

type ProtectedRouteProps = {
  allowedRoles?: ('farmer' | 'distributor' | 'consumer' | 'admin')[];
  requireVerified?: boolean;
  children?: React.ReactNode;
};

export const ProtectedRoute = ({ allowedRoles, requireVerified, children }: ProtectedRouteProps) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    // Redirect to login page if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has required role
  if (allowedRoles && !allowedRoles.includes(user.role as any)) {
    // Redirect to unauthorized page or home
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  // Enforce email verification if required
  if (requireVerified && !user.emailVerified) {
    return <Navigate to="/verify-email" state={{ from: location, email: user.email }} replace />;
  }

  // If there are children, render them, otherwise render the outlet
  return children ? <>{children}</> : <Outlet />;
};
