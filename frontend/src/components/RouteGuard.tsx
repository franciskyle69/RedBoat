// Consolidated route guard component - replaces multiple redundant guard files
import React, { useState, useEffect, Suspense } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { routingManager } from '../utils/routeUtils';
import { API_BASE_URL } from '../config/api';
import { RoutePermission } from '../types/routing';
import { UserContext } from '../types/routing';

interface RouteGuardProps {
  children?: React.ReactNode;
  requiredRole?: 'user' | 'admin';
  fallback?: React.ReactNode;
}

export function RouteGuard({ 
  children, 
  requiredRole, 
  fallback 
}: RouteGuardProps): JSX.Element | null {
  const [userContext, setUserContext] = useState<UserContext>({
    isAuthenticated: false,
    loading: true
  });
  const [blocked, setBlocked] = useState<boolean>(false);
  const [permission, setPermission] = useState<RoutePermission | null>(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/me`, {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          const context: UserContext = {
            isAuthenticated: true,
            role: data.data?.role || 'user',
            loading: false
          };
          setUserContext(context);
          routingManager.setUserContext(context);
        } else {
          // If server indicates account is blocked (403), mark blocked
          if (response.status === 403) {
            setBlocked(true);
          }
          setUserContext({
            isAuthenticated: false,
            loading: false
          });
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUserContext({
          isAuthenticated: false,
          loading: false
        });
      }
    };

    // Add timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      console.log('RouteGuard auth check timeout - proceeding without authentication');
      setUserContext({
        isAuthenticated: false,
        loading: false
      });
    }, 3000); // 3 second timeout

    checkAuth().finally(() => {
      clearTimeout(timeoutId);
    });
  }, []);

  useEffect(() => {
    if (!userContext.loading) {
      const routePermission = routingManager.checkRoutePermission(location.pathname);
      setPermission(routePermission);
    }
  }, [location.pathname, userContext.loading]);

  // Show loading spinner while checking authentication
  if (userContext.loading) {
    return <>{fallback || <LoadingSpinner />}</>;
  }

  // If blocked, redirect to /blocked (allow viewing the blocked page itself)
  if (blocked && location.pathname !== '/blocked') {
    return <Navigate to="/blocked" replace />;
  }

  // Debug logging
  console.log("RouteGuard check:", {
    path: location.pathname,
    isAuthenticated: userContext.isAuthenticated,
    role: userContext.role,
    requiredRole,
    isPublicRoute: routingManager.isPublicRoute(location.pathname)
  });

  // Check if user is authenticated for protected routes
  if (!userContext.isAuthenticated && !routingManager.isPublicRoute(location.pathname)) {
    console.log("RouteGuard: Redirecting to login - not authenticated");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requiredRole && userContext.role !== requiredRole) {
    const effectiveRole = userContext.role === 'superadmin' ? 'admin' : userContext.role;
    if (requiredRole && effectiveRole !== requiredRole) {
      const redirectTo = effectiveRole === 'admin' ? '/admin' : '/dashboard';
      return <Navigate to={redirectTo} replace />;
    }
  }

  // Check route-specific permissions
  if (permission && !permission.canAccess) {
    return <Navigate to={permission.redirectTo || '/'} replace />;
  }

  return (
    <Suspense fallback={fallback || <LoadingSpinner />}>
      {children || <Outlet />}
    </Suspense>
  );
}

// Specific route guards
export function AdminRouteGuard({ children }: { children?: React.ReactNode }) {
  return (
    <RouteGuard requiredRole="admin">
      {children}
    </RouteGuard>
  );
}

export function UserRouteGuard({ children }: { children?: React.ReactNode }) {
  return (
    <RouteGuard requiredRole="user">
      {children}
    </RouteGuard>
  );
}

export function PublicRouteGuard({ children }: { children?: React.ReactNode }) {
  return (
    <RouteGuard>
      {children}
    </RouteGuard>
  );
}

// Loading spinner component
function LoadingSpinner() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '50vh',
      padding: '20px'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #0ea5e9',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}></div>
      <p style={{
        marginTop: '16px',
        color: '#64748b',
        fontSize: '14px'
      }}>Loading...</p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Hook for route permissions
export function useRoutePermission(path: string): RoutePermission {
  const [permission, setPermission] = useState<RoutePermission>({ canAccess: false });

  useEffect(() => {
    const routePermission = routingManager.checkRoutePermission(path);
    setPermission(routePermission);
  }, [path]);

  return permission;
}

// Hook for navigation routes
export function useNavigationRoutes() {
  const [routes, setRoutes] = useState(routingManager.getNavigationRoutes());

  useEffect(() => {
    const updateRoutes = () => {
      const availableRoutes = routingManager.getNavigationRoutes();
      setRoutes(availableRoutes);
    };

    updateRoutes();
  }, []);

  return routes;
}

// Hook for breadcrumbs
export function useBreadcrumbs() {
  const location = useLocation();
  const [breadcrumbs, setBreadcrumbs] = useState(routingManager.getBreadcrumbs(location.pathname));

  useEffect(() => {
    const currentBreadcrumbs = routingManager.getBreadcrumbs(location.pathname);
    setBreadcrumbs(currentBreadcrumbs);
  }, [location.pathname]);

  return breadcrumbs;
}
