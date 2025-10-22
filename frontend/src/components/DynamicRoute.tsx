import { Suspense, useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { RouteConfig, getRoutesByRole } from '../config/routes';

interface DynamicRouteProps {
  requiredRole?: 'user' | 'admin';
  children?: React.ReactNode;
}

type MeResponse = { data?: { username: string; email: string; role?: string } };

export function DynamicRoute({ requiredRole, children }: DynamicRouteProps) {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [userRole, setUserRole] = useState<string | undefined>(undefined);
  const [userData, setUserData] = useState<any>(null);
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    
    const checkAuth = async () => {
      try {
        const res = await fetch("http://localhost:5000/me", {
          credentials: "include",
        });
        
        if (!cancelled) {
          setAuthed(res.ok);
          if (res.ok) {
            const body: MeResponse = await res.json();
            setUserRole(body?.data?.role);
            setUserData(body?.data);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        if (!cancelled) setAuthed(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    checkAuth();
    
    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  // Loading state
  if (loading) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #0ea5e9',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ marginTop: '16px', color: '#64748b' }}>Loading...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Not authenticated
  if (!authed) {
    return <Navigate to="/" replace />;
  }

  // Role-based access control
  if (requiredRole && userRole !== requiredRole) {
    // Redirect to appropriate dashboard based on user role
    if (userRole === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (userRole === 'user') {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Check if user has access to current route
  const currentPath = location.pathname;
  const availableRoutes = getRoutesByRole(userRole as 'user' | 'admin');
  const hasAccess = availableRoutes.some(route => route.path === currentPath);

  if (!hasAccess && !currentPath.startsWith('/admin') && userRole === 'user') {
    return <Navigate to="/dashboard" replace />;
  }

  if (!hasAccess && currentPath.startsWith('/admin') && userRole !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Suspense fallback={
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
        <p style={{ marginTop: '12px', color: '#64748b', fontSize: '14px' }}>Loading page...</p>
      </div>
    }>
      {children || <Outlet />}
    </Suspense>
  );
}

// Specific route guards
export function UserRoute() {
  return <DynamicRoute requiredRole="user" />;
}

export function AdminRoute() {
  return <DynamicRoute requiredRole="admin" />;
}

export function ProtectedRoute() {
  return <DynamicRoute />;
}
