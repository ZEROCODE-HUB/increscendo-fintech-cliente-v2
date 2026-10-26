import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const PageLoader: React.FC = React.memo(() => (
  <div className="flex items-center justify-center h-full min-h-[200px]">
    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
));
PageLoader.displayName = 'PageLoader';

export const FullScreenLoader: React.FC = React.memo(() => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
));
FullScreenLoader.displayName = 'FullScreenLoader';

interface RequireAuthProps {
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ 
  children, 
  loadingComponent 
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return loadingComponent ? <>{loadingComponent}</> : <FullScreenLoader />;
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

interface RequireGuestProps {
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  redirectTo?: string;
}

export const RequireGuest: React.FC<RequireGuestProps> = ({ 
  children, 
  loadingComponent,
  redirectTo = '/dashboard' 
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return loadingComponent ? <>{loadingComponent}</> : <FullScreenLoader />;
  }

  if (user) {
    const from = (location.state as { from?: Location })?.from?.pathname;
    return <Navigate to={from || redirectTo} replace />;
  }

  return <>{children}</>;
};

interface PublicRouteProps {
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ 
  children, 
  loadingComponent 
}) => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return loadingComponent ? <>{loadingComponent}</> : <FullScreenLoader />;
  }

  return <>{children}</>;
};

type Role = 'admin' | 'client';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: Role[];
  loadingComponent?: React.ReactNode;
  fallbackPath?: string;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  loadingComponent,
  fallbackPath = '/dashboard'
}) => {
  const { user, isLoading, isRoleLoading, userRole } = useAuth();
  const location = useLocation();

  if (isLoading || isRoleLoading) {
    return loadingComponent ? <>{loadingComponent}</> : <FullScreenLoader />;
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  const hasRole = userRole && allowedRoles.includes(userRole as Role);
  if (!hasRole) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

export { AuthGuard, AdminGuard } from './AuthGuard';