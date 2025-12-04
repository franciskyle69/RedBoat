import { Route, Routes } from 'react-router-dom';
import { Suspense } from 'react';
import { RouteConfig } from '../types/routing';
import { RouteGuard, AdminRouteGuard, UserRouteGuard } from '../components/RouteGuard';

interface RouteGeneratorProps {
  routes: RouteConfig[];
  fallback?: React.ReactNode;
}

export function RouteGenerator({ routes, fallback }: RouteGeneratorProps) {
  const defaultFallback = (
    <div style={{ 
      padding: '20px', 
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '50vh'
    }}>
      <div style={{
        width: '32px',
        height: '32px',
        border: '3px solid #f3f3f3',
        borderTop: '3px solid #0ea5e9',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}></div>
      <p style={{ marginTop: '12px', color: '#64748b', fontSize: '14px' }}>Loading...</p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  const renderRoute = (route: RouteConfig): React.ReactNode => {
    const Component = route.component;
    
    if (!Component) {
      return null;
    }

    // Determine the appropriate route guard based on route requirements
    const getRouteGuard = (route: RouteConfig) => {
      if (route.isPublic) {
        return null; // No guard needed for public routes
      }
      
      if (route.requiredRole === 'admin') {
        return AdminRouteGuard;
      }
      
      if (route.requiredRole === 'user' || route.requiresAuth) {
        return UserRouteGuard;
      }
      
      return RouteGuard; // Default guard
    };

    const GuardComponent = getRouteGuard(route);

    return (
      <Route
        key={route.path}
        path={route.path}
        element={
          GuardComponent ? (
            <GuardComponent>
              <Suspense fallback={<>{fallback || defaultFallback}</>}>
                <Component />
              </Suspense>
            </GuardComponent>
          ) : (
            <Suspense fallback={<>{fallback || defaultFallback}</>}>
              <Component />
            </Suspense>
          )
        }
      />
    );
  };

  return (
    <Routes>
      {routes.map(renderRoute)}
    </Routes>
  );
}

// Generate routes by role
export function generateRoutesByRole(role: 'user' | 'admin' | 'public', routes: RouteConfig[]) {
  return routes.filter(route => {
    if (role === 'public') {
      return route.isPublic;
    }
    if (role === 'user') {
      return route.requiredRole === 'user' || route.isPublic;
    }
    if (role === 'admin') {
      return route.requiredRole === 'admin' || route.isPublic;
    }
    return false;
  });
}
