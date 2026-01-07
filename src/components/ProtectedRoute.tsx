import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSubscription?: boolean;
}

export const ProtectedRoute = ({ children, requireSubscription = false }: ProtectedRouteProps) => {
  const { user, isLoading, isSubscribed } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in → redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but needs subscription and doesn't have one → redirect to paywall
  if (requireSubscription && !isSubscribed) {
    return <Navigate to="/paywall" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
