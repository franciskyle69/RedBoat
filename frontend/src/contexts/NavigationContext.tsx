import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { RouteConfig } from '../types/routing';
import { getNavigationRoutes, getRouteByPath } from '../config/routes';

interface NavigationContextType {
  userRole: 'user' | 'admin' | 'superadmin' | null;
  navigationRoutes: RouteConfig[];
  currentRoute: RouteConfig | null;
  setUserRole: (role: 'user' | 'admin' | 'superadmin' | null) => void;
  getRouteByPath: (path: string) => RouteConfig | undefined;
  isRouteAccessible: (path: string) => boolean;
  clearAuthState: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

interface NavigationProviderProps {
  children: ReactNode;
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const [userRole, setUserRole] = useState<'user' | 'admin' | 'superadmin' | null>(null);
  const [navigationRoutes, setNavigationRoutes] = useState<RouteConfig[]>([]);
  const [currentRoute, setCurrentRoute] = useState<RouteConfig | null>(null);

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      try {
        const res = await fetch("http://localhost:5000/me", {
          credentials: "include",
        });
        
        if (res.ok) {
          const data = await res.json();
          const role = data?.data?.role as 'user' | 'admin' | 'superadmin' | undefined;

          // Treat superadmin as admin for navigation routes, but keep raw role exposed
          const effectiveRole: 'user' | 'admin' | null =
            role === 'admin' || role === 'superadmin'
              ? 'admin'
              : role === 'user'
              ? 'user'
              : null;

          setUserRole(role ?? null);
          if (effectiveRole) {
            setNavigationRoutes(getNavigationRoutes(effectiveRole));
          } else {
            setNavigationRoutes([]);
          }
        } else {
          // Clear authentication state
          setUserRole(null);
          setNavigationRoutes([]);
        }
      } catch (error) {
        console.error('Failed to check auth status:', error);
        // Clear authentication state on error
        setUserRole(null);
        setNavigationRoutes([]);
      }
    };

    // Add a timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      console.log('Auth check timeout - proceeding without authentication');
      setUserRole(null);
      setNavigationRoutes([]);
    }, 5000); // 5 second timeout

    checkAuth().finally(() => {
      clearTimeout(timeoutId);
    });
  }, []);

  // Add method to clear authentication state
  const clearAuthState = () => {
    setUserRole(null);
    setNavigationRoutes([]);
  };

  const isRouteAccessible = (path: string): boolean => {
    if (!userRole) return false;

    const route = getRouteByPath(path);
    if (!route) return false;

    // Public routes are always accessible
    if (route.isPublic) return true;

    // Treat superadmin as admin for route access checks
    const effectiveRole = userRole === 'superadmin' ? 'admin' : userRole;

    // Check role requirements
    if (route.requiredRole && route.requiredRole !== effectiveRole) {
      return false;
    }

    return true;
  };

  const contextValue: NavigationContextType = {
    userRole,
    navigationRoutes,
    currentRoute,
    setUserRole,
    getRouteByPath,
    isRouteAccessible,
    clearAuthState,
  };

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}

// Hook to get current route info
export function useCurrentRoute() {
  const { currentRoute } = useNavigation();
  return currentRoute;
}

// Hook to check if user can access a route
export function useRouteAccess(path: string) {
  const { isRouteAccessible } = useNavigation();
  return isRouteAccessible(path);
}
