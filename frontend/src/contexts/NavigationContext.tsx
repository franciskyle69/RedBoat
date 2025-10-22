import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { RouteConfig, getNavigationRoutes, getRouteByPath } from '../config/routes';

interface NavigationContextType {
  userRole: 'user' | 'admin' | null;
  navigationRoutes: RouteConfig[];
  currentRoute: RouteConfig | null;
  setUserRole: (role: 'user' | 'admin' | null) => void;
  getRouteByPath: (path: string) => RouteConfig | undefined;
  isRouteAccessible: (path: string) => boolean;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

interface NavigationProviderProps {
  children: ReactNode;
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const [userRole, setUserRole] = useState<'user' | 'admin' | null>(null);
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
          const role = data?.data?.role;
          setUserRole(role);
          setNavigationRoutes(getNavigationRoutes(role));
        } else {
          setUserRole(null);
          setNavigationRoutes([]);
        }
      } catch (error) {
        console.error('Failed to check auth status:', error);
        setUserRole(null);
        setNavigationRoutes([]);
      }
    };

    checkAuth();
  }, []);

  const isRouteAccessible = (path: string): boolean => {
    if (!userRole) return false;
    
    const route = getRouteByPath(path);
    if (!route) return false;
    
    // Public routes are always accessible
    if (route.isPublic) return true;
    
    // Check role requirements
    if (route.requiredRole && route.requiredRole !== userRole) {
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
