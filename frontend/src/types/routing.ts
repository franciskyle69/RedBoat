// Centralized routing types to eliminate redundancy

export interface RouteConfig {
  path: string;
  component?: React.ComponentType;
  title: string;
  description?: string;
  icon?: string;
  requiresAuth?: boolean;
  requiredRole?: 'user' | 'admin';
  isPublic?: boolean;
  isHidden?: boolean;
  children?: RouteConfig[];
  // Backend-specific properties
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  handler?: (req: any, res: any, next?: any) => void | Promise<void>;
  middleware?: Array<(req: any, res: any, next: any) => void>;
  tags?: string[];
}

export interface UserContext {
  isAuthenticated: boolean;
  role?: 'user' | 'admin' | 'superadmin';
  permissions?: string[];
  loading?: boolean;
}

export interface RoutePermission {
  canAccess: boolean;
  redirectTo?: string;
  reason?: string;
}

export interface RouteMetadata {
  title: string;
  description?: string;
  icon?: string;
}

export interface RouteStats {
  totalRoutes: number;
  publicRoutes: number;
  protectedRoutes: number;
  adminRoutes: number;
  userRoutes: number;
  hiddenRoutes: number;
  visibleRoutes: number;
}

export interface NavigationContextType {
  userRole: 'user' | 'admin' | 'superadmin' | null;
  navigationRoutes: RouteConfig[];
  currentRoute: RouteConfig | null;
  setUserRole: (role: 'user' | 'admin' | 'superadmin' | null) => void;
  getRouteByPath: (path: string) => RouteConfig | undefined;
  isRouteAccessible: (path: string) => boolean;
}

// Route validation schemas
export const routeParamSchema = {
  id: /^[a-f\d]{24}$/i, // MongoDB ObjectId
  slug: /^[a-z0-9-]+$/i, // URL-friendly slug
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s-()]+$/,
  date: /^\d{4}-\d{2}-\d{2}$/
};

// Route constants
export const ROUTE_PATTERNS = {
  ADMIN: '/admin',
  USER: '/user',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  LOGIN: '/login',
  SIGNUP: '/signup',
  HOME: '/'
} as const;

export const ROUTE_ICONS = {
  DASHBOARD: 'dashboard',
  USER: 'user',
  USERS: 'users',
  HOME: 'home',
  CALENDAR: 'calendar',
  MESSAGE: 'message',
  SETTINGS: 'settings',
  CHART: 'chart',
  CLEANING: 'cleaning',
  LOGIN: 'login',
  SIGNUP: 'signup',
  PASSWORD: 'password',
  EMAIL: 'email',
  PHONE: 'phone',
  LOCATION: 'location',
  STAR: 'star',
  HEART: 'heart',
  BELL: 'bell',
  SEARCH: 'search',
  FILTER: 'filter',
  SORT: 'sort',
  EDIT: 'edit',
  DELETE: 'delete',
  ADD: 'add',
  REMOVE: 'remove',
  CHECK: 'check',
  CROSS: 'cross',
  WARNING: 'warning',
  INFO: 'info',
  QUESTION: 'question',
  EXCLAMATION: 'exclamation'
} as const;
