import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { PageSpinner } from '../ui/Spinner';
import { useAuth } from './AuthContext';

export function ProtectedRoute() {
  const { isAuthenticated, ready } = useAuth();
  const location = useLocation();

  if (!ready) return <PageSpinner />;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}

export function GuestRoute() {
  const { isAuthenticated, ready } = useAuth();
  if (!ready) return <PageSpinner />;
  if (isAuthenticated) return <Navigate to="/servers" replace />;
  return <Outlet />;
}
