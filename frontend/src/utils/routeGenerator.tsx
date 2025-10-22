import { Route, Routes } from 'react-router-dom';
import { Suspense } from 'react';
import { allRoutes, RouteConfig } from '../config/routes';

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
    
    return (
      <Route
        key={route.path}
        path={route.path}
        element={
          <Suspense fallback={fallback || defaultFallback}>
            <Component />
          </Suspense>
        }
      />
    );
  };

  return (
    <>
      {routes.map(renderRoute)}
    </>
  );
}

// Generate routes by role
export function generateRoutesByRole(role: 'user' | 'admin' | 'public') {
  const routes = allRoutes.filter(route => {
    if (role === 'public') {
      return route.isPublic;
    }
    if (role === 'user') {
      return route.requiredRole === 'user' || route.requiredRole === undefined;
    }
    if (role === 'admin') {
      return route.requiredRole === 'admin' || route.requiredRole === undefined;
    }
    return false;
  });

  return routes;
}

// Generate all routes
export function generateAllRoutes() {
  return allRoutes;
}
