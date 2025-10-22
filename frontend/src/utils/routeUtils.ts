// Consolidated route utilities - replaces multiple redundant files
import { RouteConfig, UserContext, RoutePermission, RouteMetadata } from '../types/routing';
import { getRouteByPath, getRoutesByRole } from '../config/routes';

// Centralized routing manager
class RoutingManager {
  private static instance: RoutingManager;
  private userContext: UserContext | null = null;

  private constructor() {}

  public static getInstance(): RoutingManager {
    if (!RoutingManager.instance) {
      RoutingManager.instance = new RoutingManager();
    }
    return RoutingManager.instance;
  }

  public setUserContext(context: UserContext): void {
    this.userContext = context;
  }

  public getUserContext(): UserContext | null {
    return this.userContext;
  }

  public checkRoutePermission(path: string): RoutePermission {
    const route = getRouteByPath(path);
    
    if (!route) {
      return {
        canAccess: false,
        redirectTo: '/',
        reason: 'Route not found'
      };
    }

    // Public routes
    if (route.isPublic) {
      return { canAccess: true };
    }

    // Check authentication
    if (route.requiresAuth && !this.userContext?.isAuthenticated) {
      return {
        canAccess: false,
        redirectTo: '/login',
        reason: 'Authentication required'
      };
    }

    // Check role requirements
    if (route.requiredRole && this.userContext?.role !== route.requiredRole) {
      const redirectTo = this.userContext?.role === 'admin' ? '/admin' : '/dashboard';
      return {
        canAccess: false,
        redirectTo,
        reason: `Role '${route.requiredRole}' required`
      };
    }

    return { canAccess: true };
  }

  public getAvailableRoutes(): RouteConfig[] {
    if (!this.userContext?.isAuthenticated) {
      return getRoutesByRole('public');
    }

    return getRoutesByRole(this.userContext.role || 'user');
  }

  public getNavigationRoutes(): RouteConfig[] {
    const routes = this.getAvailableRoutes();
    return routes.filter(route => !route.isHidden);
  }

  public getBreadcrumbs(path: string): RouteConfig[] {
    const breadcrumbs: RouteConfig[] = [];
    const pathSegments = path.split('/').filter(Boolean);
    
    let currentPath = '';
    for (const segment of pathSegments) {
      currentPath += `/${segment}`;
      const route = getRouteByPath(currentPath);
      if (route) {
        breadcrumbs.push(route);
      }
    }

    return breadcrumbs;
  }

  public getRouteMetadata(path: string): RouteMetadata {
    const route = getRouteByPath(path);
    return {
      title: route?.title || 'Page Not Found',
      description: route?.description,
      icon: route?.icon
    };
  }

  public generateRouteUrl(path: string, params?: Record<string, string>): string {
    let url = path;
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url = url.replace(`:${key}`, value);
      });
    }

    return url;
  }

  public isAdminRoute(path: string): boolean {
    return path.startsWith('/admin');
  }

  public isUserRoute(path: string): boolean {
    return path.startsWith('/user') || path === '/dashboard';
  }

  public isPublicRoute(path: string): boolean {
    const route = getRouteByPath(path);
    return route?.isPublic || false;
  }

  public getDefaultRoute(role: 'user' | 'admin'): string {
    return role === 'admin' ? '/admin' : '/dashboard';
  }

  public validateRouteParams(path: string, params: Record<string, any>): boolean {
    const route = getRouteByPath(path);
    if (!route) return false;

    // Check if all required parameters are provided
    const pathParams = path.match(/:(\w+)/g);
    if (pathParams) {
      return pathParams.every(param => {
        const paramName = param.slice(1); // Remove ':'
        return params.hasOwnProperty(paramName);
      });
    }

    return true;
  }
}

// Export singleton instance
export const routingManager = RoutingManager.getInstance();

// Route validation utilities
export const validateRoute = (path: string): boolean => {
  const route = getRouteByPath(path);
  return route !== undefined;
};

export const validateRouteParams = (path: string, params: Record<string, any>): boolean => {
  return routingManager.validateRouteParams(path, params);
};

// Route generation utilities
export const generateRoute = (path: string, params?: Record<string, string>): string => {
  return routingManager.generateRouteUrl(path, params);
};

export const generateRouteWithQuery = (
  path: string, 
  params?: Record<string, string>, 
  query?: Record<string, string>
): string => {
  let url = generateRoute(path, params);
  
  if (query && Object.keys(query).length > 0) {
    const searchParams = new URLSearchParams(query);
    url += `?${searchParams.toString()}`;
  }
  
  return url;
};

// Route navigation utilities
export const navigateToRoute = (navigate: (path: string) => void, path: string, params?: Record<string, string>) => {
  const route = generateRoute(path, params);
  navigate(route);
};

export const navigateWithState = (
  navigate: (path: string, options?: { state?: any }) => void, 
  path: string, 
  state?: any,
  params?: Record<string, string>
) => {
  const route = generateRoute(path, params);
  navigate(route, { state });
};

// Route permission utilities
export const canNavigateTo = (path: string): boolean => {
  return routingManager.checkRoutePermission(path).canAccess;
};

export const getRouteRedirect = (path: string): string | undefined => {
  return routingManager.checkRoutePermission(path).redirectTo;
};

// Route metadata utilities
export const getRouteTitle = (path: string): string => {
  return routingManager.getRouteMetadata(path).title;
};

export const getRouteDescription = (path: string): string | undefined => {
  return routingManager.getRouteMetadata(path).description;
};

export const getRouteIcon = (path: string): string | undefined => {
  return routingManager.getRouteMetadata(path).icon;
};

// Route categorization utilities
export const isAdminRoute = (path: string): boolean => {
  return routingManager.isAdminRoute(path);
};

export const isUserRoute = (path: string): boolean => {
  return routingManager.isUserRoute(path);
};

export const isPublicRoute = (path: string): boolean => {
  return routingManager.isPublicRoute(path);
};

// Route comparison utilities
export const isCurrentRoute = (path: string, currentPath: string): boolean => {
  return currentPath === path || currentPath.startsWith(path + '/');
};

export const isParentRoute = (parentPath: string, childPath: string): boolean => {
  return childPath.startsWith(parentPath + '/');
};

export const getRouteDepth = (path: string): number => {
  return path.split('/').filter(segment => segment.length > 0).length;
};

// Route filtering utilities
export const filterRoutesByRole = (routes: RouteConfig[], role: 'user' | 'admin'): RouteConfig[] => {
  return routes.filter(route => {
    if (!route.requiredRole) return true;
    return route.requiredRole === role;
  });
};

export const filterRoutesByAuth = (routes: RouteConfig[], isAuthenticated: boolean): RouteConfig[] => {
  return routes.filter(route => {
    if (route.isPublic) return true;
    return route.requiresAuth === isAuthenticated;
  });
};

export const filterVisibleRoutes = (routes: RouteConfig[]): RouteConfig[] => {
  return routes.filter(route => !route.isHidden);
};

// Route search utilities
export const searchRoutes = (routes: RouteConfig[], query: string): RouteConfig[] => {
  const lowercaseQuery = query.toLowerCase();
  
  return routes.filter(route => 
    route.title.toLowerCase().includes(lowercaseQuery) ||
    route.description?.toLowerCase().includes(lowercaseQuery) ||
    route.path.toLowerCase().includes(lowercaseQuery)
  );
};

// Route analytics utilities
export const getRouteStats = (routes: RouteConfig[]) => {
  const total = routes.length;
  const publicRoutes = routes.filter(route => route.isPublic).length;
  const protectedRoutes = routes.filter(route => route.requiresAuth).length;
  const adminRoutes = routes.filter(route => route.requiredRole === 'admin').length;
  const userRoutes = routes.filter(route => route.requiredRole === 'user').length;
  const hiddenRoutes = routes.filter(route => route.isHidden).length;

  return {
    total,
    publicRoutes,
    protectedRoutes,
    adminRoutes,
    userRoutes,
    hiddenRoutes,
    visibleRoutes: total - hiddenRoutes
  };
};

// Route breadcrumb utilities
export const getBreadcrumbPath = (path: string): string[] => {
  return path.split('/').filter(segment => segment.length > 0);
};

export const getParentPath = (path: string): string => {
  const segments = getBreadcrumbPath(path);
  if (segments.length <= 1) return '/';
  return '/' + segments.slice(0, -1).join('/');
};

export const getChildPaths = (parentPath: string, allRoutes: RouteConfig[]): RouteConfig[] => {
  return allRoutes.filter(route => 
    route.path.startsWith(parentPath + '/') && 
    route.path !== parentPath
  );
};

// Route validation schemas
export const validateRouteParam = (param: string, value: string, type: keyof typeof routeParamSchema): boolean => {
  const pattern = routeParamSchema[type];
  return pattern ? pattern.test(value) : false;
};

// Import routeParamSchema from types
import { routeParamSchema } from '../types/routing';
