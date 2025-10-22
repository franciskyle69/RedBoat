import { Request, Response, NextFunction } from 'express';
import { RouteConfig, getRoutesByTag, getRoutesByRole, getPublicRoutes, getProtectedRoutes } from '../config/routes';
import { RouteMetadata, RouteStats } from '../types/routing';

// Using centralized types from ../types/routing

export class BackendRouteManager {
  private static instance: BackendRouteManager;
  private routeStats: RouteStats | null = null;
  private routeMetadata: RouteMetadata[] = [];

  private constructor() {
    this.initializeRouteMetadata();
  }

  public static getInstance(): BackendRouteManager {
    if (!BackendRouteManager.instance) {
      BackendRouteManager.instance = new BackendRouteManager();
    }
    return BackendRouteManager.instance;
  }

  private initializeRouteMetadata(): void {
    // This would be populated from your actual route definitions
    this.routeMetadata = [
      {
        path: '/signup',
        method: 'POST',
        description: 'User registration',
        tags: ['auth'],
        requiresAuth: false
      },
      {
        path: '/login',
        method: 'POST',
        description: 'User login',
        tags: ['auth'],
        requiresAuth: false
      },
      {
        path: '/logout',
        method: 'POST',
        description: 'User logout',
        tags: ['auth'],
        requiresAuth: true
      },
      {
        path: '/profile',
        method: 'GET',
        description: 'Get user profile',
        tags: ['profile'],
        requiresAuth: true
      },
      {
        path: '/profile',
        method: 'PUT',
        description: 'Update user profile',
        tags: ['profile'],
        requiresAuth: true
      },
      {
        path: '/users',
        method: 'GET',
        description: 'Get all users',
        tags: ['admin', 'users'],
        requiresAuth: true,
        requiredRole: 'admin'
      },
      {
        path: '/bookings',
        method: 'GET',
        description: 'Get all bookings',
        tags: ['admin', 'bookings'],
        requiresAuth: true,
        requiredRole: 'admin'
      },
      {
        path: '/user-bookings',
        method: 'GET',
        description: 'Get user bookings',
        tags: ['bookings'],
        requiresAuth: true
      },
      {
        path: '/rooms',
        method: 'GET',
        description: 'Get all rooms',
        tags: ['rooms']
      },
      {
        path: '/reports/occupancy',
        method: 'GET',
        description: 'Get occupancy report',
        tags: ['admin', 'reports'],
        requiresAuth: true,
        requiredRole: 'admin'
      },
      {
        path: '/reports/revenue',
        method: 'GET',
        description: 'Get revenue report',
        tags: ['admin', 'reports'],
        requiresAuth: true,
        requiredRole: 'admin'
      },
      {
        path: '/reports/bookings',
        method: 'GET',
        description: 'Get booking analytics',
        tags: ['admin', 'reports'],
        requiresAuth: true,
        requiredRole: 'admin'
      }
    ];

    this.calculateRouteStats();
  }

  private calculateRouteStats(): void {
    const totalRoutes = this.routeMetadata.length;
    const publicRoutes = this.routeMetadata.filter(route => !route.requiresAuth).length;
    const protectedRoutes = this.routeMetadata.filter(route => route.requiresAuth).length;
    const adminRoutes = this.routeMetadata.filter(route => route.requiredRole === 'admin').length;
    const userRoutes = this.routeMetadata.filter(route => route.requiresAuth && !route.requiredRole).length;

    const routesByTag: Record<string, number> = {};
    this.routeMetadata.forEach(route => {
      route.tags?.forEach(tag => {
        routesByTag[tag] = (routesByTag[tag] || 0) + 1;
      });
    });

    this.routeStats = {
      totalRoutes,
      publicRoutes,
      protectedRoutes,
      adminRoutes,
      userRoutes,
      routesByTag
    };
  }

  public getRouteStats(): RouteStats {
    return this.routeStats!;
  }

  public getRouteMetadata(): RouteMetadata[] {
    return this.routeMetadata;
  }

  public getRoutesByTag(tag: string): RouteMetadata[] {
    return this.routeMetadata.filter(route => route.tags?.includes(tag));
  }

  public getRoutesByRole(role: 'user' | 'admin'): RouteMetadata[] {
    return this.routeMetadata.filter(route => {
      if (!route.requiresAuth) return false;
      return !route.requiredRole || route.requiredRole === role;
    });
  }

  public getPublicRoutes(): RouteMetadata[] {
    return this.routeMetadata.filter(route => !route.requiresAuth);
  }

  public getProtectedRoutes(): RouteMetadata[] {
    return this.routeMetadata.filter(route => route.requiresAuth);
  }

  public getAdminRoutes(): RouteMetadata[] {
    return this.routeMetadata.filter(route => route.requiredRole === 'admin');
  }

  public getRouteByPath(path: string, method?: string): RouteMetadata | undefined {
    return this.routeMetadata.find(route => 
      route.path === path && (!method || route.method === method)
    );
  }

  public validateRoute(path: string, method: string): boolean {
    return this.getRouteByPath(path, method) !== undefined;
  }

  public getRouteDocumentation(): string {
    const stats = this.getRouteStats();
    let doc = `# API Routes Documentation\n\n`;
    doc += `## Overview\n`;
    doc += `- Total Routes: ${stats.totalRoutes}\n`;
    doc += `- Public Routes: ${stats.publicRoutes}\n`;
    doc += `- Protected Routes: ${stats.protectedRoutes}\n`;
    doc += `- Admin Routes: ${stats.adminRoutes}\n`;
    doc += `- User Routes: ${stats.userRoutes}\n\n`;

    // Group by tags
    const tagGroups: Record<string, RouteMetadata[]> = {};
    this.routeMetadata.forEach(route => {
      route.tags?.forEach(tag => {
        if (!tagGroups[tag]) {
          tagGroups[tag] = [];
        }
        if (!tagGroups[tag].find(r => r.path === route.path && r.method === route.method)) {
          tagGroups[tag].push(route);
        }
      });
    });

    Object.entries(tagGroups).forEach(([tag, routes]) => {
      doc += `## ${tag.charAt(0).toUpperCase() + tag.slice(1)} Routes\n\n`;
      routes.forEach(route => {
        doc += `### ${route.method} ${route.path}\n`;
        doc += `- **Description**: ${route.description || 'No description'}\n`;
        doc += `- **Authentication**: ${route.requiresAuth ? 'Required' : 'Not required'}\n`;
        if (route.requiredRole) {
          doc += `- **Role**: ${route.requiredRole}\n`;
        }
        doc += `\n`;
      });
    });

    return doc;
  }

  public generateOpenAPISpec(): object {
    return {
      openapi: '3.0.0',
      info: {
        title: 'Hotel Management API',
        version: '1.0.0',
        description: 'API for Hotel Management System'
      },
      servers: [
        {
          url: 'http://localhost:5000',
          description: 'Development server'
        }
      ],
      paths: this.generatePathsSpec(),
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    };
  }

  private generatePathsSpec(): Record<string, any> {
    const paths: Record<string, any> = {};
    
    this.routeMetadata.forEach(route => {
      if (!paths[route.path]) {
        paths[route.path] = {};
      }
      
      paths[route.path][route.method.toLowerCase()] = {
        summary: route.description,
        tags: route.tags,
        security: route.requiresAuth ? [{ bearerAuth: [] }] : [],
        responses: {
          '200': {
            description: 'Success'
          },
          '401': {
            description: 'Unauthorized'
          },
          '403': {
            description: 'Forbidden'
          }
        }
      };
    });

    return paths;
  }
}

// Export singleton instance
export const backendRouteManager = BackendRouteManager.getInstance();

// Middleware for route validation
export const validateRouteMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const { path, method } = req;
  
  if (!backendRouteManager.validateRoute(path, method)) {
    return res.status(404).json({
      error: 'Route not found',
      path,
      method
    });
  }
  
  next();
};

// Middleware for route logging
export const routeLoggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const route = backendRouteManager.getRouteByPath(req.path, req.method);
    
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms) - ${route?.description || 'Unknown route'}`);
  });
  
  next();
};
