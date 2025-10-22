import { Router, Request, Response, NextFunction } from 'express';
import { RouteConfig } from '../config/routes';

// Auth middleware
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.auth as string | undefined;
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    
    // You would verify the JWT token here
    // const payload = jwt.verify(token, jwtSecret) as { sub: string; email: string; role?: string };
    // (req as any).user = payload;
    
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

// Role-based middleware
export function requireRole(role: 'user' | 'admin') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const userRole = (req as any).user?.role;
      if (!userRole) return res.status(401).json({ message: "Unauthorized" });
      if (userRole !== role && userRole !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      next();
    } catch {
      return res.status(401).json({ message: "Unauthorized" });
    }
  };
}

// Dynamic route handler
export function createDynamicRouter(routes: RouteConfig[]): Router {
  const router = Router();

  routes.forEach(route => {
    const middlewares: any[] = [];

    // Add auth middleware if required
    if (route.requiresAuth) {
      middlewares.push(requireAuth);
    }

    // Add role middleware if required
    if (route.requiredRole) {
      middlewares.push(requireRole(route.requiredRole));
    }

    // Add custom middlewares
    if (route.middleware) {
      middlewares.push(...route.middleware);
    }

    // Add the route handler
    middlewares.push(route.handler);

    // Register the route
    router[route.method.toLowerCase() as keyof Router](
      route.path,
      ...middlewares
    );
  });

  return router;
}

// Route documentation generator
export function generateRouteDocs(routes: RouteConfig[]): any {
  const docs = {
    openapi: '3.0.0',
    info: {
      title: 'WebProj API',
      version: '1.0.0',
      description: 'Hotel Management System API'
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      }
    ],
    paths: {},
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'auth'
        }
      }
    }
  };

  routes.forEach(route => {
    const path = route.path.replace(/:/g, '{') + '}';
    if (!docs.paths[path]) {
      docs.paths[path] = {};
    }

    docs.paths[path][route.method.toLowerCase()] = {
      summary: route.description,
      tags: route.tags,
      security: route.requiresAuth ? [{ cookieAuth: [] }] : [],
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

  return docs;
}

// Route validation middleware
export function validateRoute(route: RouteConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Add route-specific validation here
    // This is a placeholder for future validation logic
    next();
  };
}

// Rate limiting middleware (placeholder)
export function rateLimit(requests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Implement rate limiting logic here
    // This is a placeholder for future rate limiting
    next();
  };
}
