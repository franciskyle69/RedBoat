import { Request, Response, NextFunction } from 'express';

export interface RouteConfig {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  handler: (req: Request, res: Response, next?: NextFunction) => void | Promise<void>;
  middleware?: Array<(req: Request, res: Response, next: NextFunction) => void>;
  requiresAuth?: boolean;
  requiredRole?: 'user' | 'admin';
  description?: string;
  tags?: string[];
}

// API Route configurations
export const apiRoutes: RouteConfig[] = [
  // Authentication routes
  {
    path: '/signup',
    method: 'POST',
    handler: async (req, res) => {
      // Implementation will be injected
    },
    description: 'User registration',
    tags: ['auth']
  },
  {
    path: '/login',
    method: 'POST',
    handler: async (req, res) => {
      // Implementation will be injected
    },
    description: 'User login',
    tags: ['auth']
  },
  {
    path: '/logout',
    method: 'POST',
    handler: async (req, res) => {
      // Implementation will be injected
    },
    description: 'User logout',
    tags: ['auth']
  },
  {
    path: '/forgot-password',
    method: 'POST',
    handler: async (req, res) => {
      // Implementation will be injected
    },
    description: 'Request password reset',
    tags: ['auth']
  },
  {
    path: '/reset-password',
    method: 'POST',
    handler: async (req, res) => {
      // Implementation will be injected
    },
    description: 'Reset password',
    tags: ['auth']
  },

  // Profile routes
  {
    path: '/profile',
    method: 'GET',
    handler: async (req, res) => {
      // Implementation will be injected
    },
    requiresAuth: true,
    description: 'Get user profile',
    tags: ['profile']
  },
  {
    path: '/profile',
    method: 'PUT',
    handler: async (req, res) => {
      // Implementation will be injected
    },
    requiresAuth: true,
    description: 'Update user profile',
    tags: ['profile']
  },
  {
    path: '/profile/password',
    method: 'PUT',
    handler: async (req, res) => {
      // Implementation will be injected
    },
    requiresAuth: true,
    description: 'Change password',
    tags: ['profile']
  },
  {
    path: '/profile/picture',
    method: 'POST',
    handler: async (req, res) => {
      // Implementation will be injected
    },
    requiresAuth: true,
    description: 'Upload profile picture',
    tags: ['profile']
  },
  {
    path: '/profile/picture',
    method: 'DELETE',
    handler: async (req, res) => {
      // Implementation will be injected
    },
    requiresAuth: true,
    description: 'Delete profile picture',
    tags: ['profile']
  },

  // User management routes (admin only)
  {
    path: '/users',
    method: 'GET',
    handler: async (req, res) => {
      // Implementation will be injected
    },
    requiresAuth: true,
    requiredRole: 'admin',
    description: 'Get all users',
    tags: ['admin', 'users']
  },
  {
    path: '/promote-to-admin',
    method: 'POST',
    handler: async (req, res) => {
      // Implementation will be injected
    },
    requiresAuth: true,
    requiredRole: 'admin',
    description: 'Promote user to admin',
    tags: ['admin', 'users']
  },

  // Booking routes
  {
    path: '/bookings',
    method: 'GET',
    handler: async (req, res) => {
      // Implementation will be injected
    },
    requiresAuth: true,
    requiredRole: 'admin',
    description: 'Get all bookings (admin)',
    tags: ['admin', 'bookings']
  },
  {
    path: '/user-bookings',
    method: 'GET',
    handler: async (req, res) => {
      // Implementation will be injected
    },
    requiresAuth: true,
    description: 'Get user bookings',
    tags: ['bookings']
  },
  {
    path: '/bookings',
    method: 'POST',
    handler: async (req, res) => {
      // Implementation will be injected
    },
    requiresAuth: true,
    description: 'Create booking',
    tags: ['bookings']
  },
  {
    path: '/bookings/:id/status',
    method: 'PUT',
    handler: async (req, res) => {
      // Implementation will be injected
    },
    requiresAuth: true,
    requiredRole: 'admin',
    description: 'Update booking status',
    tags: ['admin', 'bookings']
  },

  // Room routes
  {
    path: '/rooms',
    method: 'GET',
    handler: async (req, res) => {
      // Implementation will be injected
    },
    description: 'Get all rooms',
    tags: ['rooms']
  },
  {
    path: '/rooms/availability',
    method: 'GET',
    handler: async (req, res) => {
      // Implementation will be injected
    },
    description: 'Get room availability',
    tags: ['rooms']
  },
  {
    path: '/rooms/calendar',
    method: 'GET',
    handler: async (req, res) => {
      // Implementation will be injected
    },
    description: 'Get room calendar',
    tags: ['rooms']
  },

  // Report routes (admin only)
  {
    path: '/reports/occupancy',
    method: 'GET',
    handler: async (req, res) => {
      // Implementation will be injected
    },
    requiresAuth: true,
    requiredRole: 'admin',
    description: 'Get occupancy report',
    tags: ['admin', 'reports']
  },
  {
    path: '/reports/revenue',
    method: 'GET',
    handler: async (req, res) => {
      // Implementation will be injected
    },
    requiresAuth: true,
    requiredRole: 'admin',
    description: 'Get revenue report',
    tags: ['admin', 'reports']
  },
  {
    path: '/reports/bookings',
    method: 'GET',
    handler: async (req, res) => {
      // Implementation will be injected
    },
    requiresAuth: true,
    requiredRole: 'admin',
    description: 'Get booking analytics',
    tags: ['admin', 'reports']
  }
];

// Helper function to get routes by tag
export function getRoutesByTag(tag: string): RouteConfig[] {
  return apiRoutes.filter(route => route.tags?.includes(tag));
}

// Helper function to get routes by role
export function getRoutesByRole(role: 'user' | 'admin'): RouteConfig[] {
  return apiRoutes.filter(route => 
    !route.requiredRole || route.requiredRole === role
  );
}

// Helper function to get public routes
export function getPublicRoutes(): RouteConfig[] {
  return apiRoutes.filter(route => !route.requiresAuth);
}

// Helper function to get protected routes
export function getProtectedRoutes(): RouteConfig[] {
  return apiRoutes.filter(route => route.requiresAuth);
}
