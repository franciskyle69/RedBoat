import { Request, Response, NextFunction } from 'express';
import { backendRouteManager } from './routeManager';

// Route validation middleware
export const validateRouteExists = (req: Request, res: Response, next: NextFunction) => {
  const { path, method } = req;
  
  if (!backendRouteManager.validateRoute(path, method)) {
    return res.status(404).json({
      error: 'Route not found',
      path,
      method,
      availableRoutes: backendRouteManager.getRouteStats()
    });
  }
  
  next();
};

// Route logging middleware
export const logRouteAccess = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const { path, method, ip } = req;
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const route = backendRouteManager.getRouteByPath(path, method);
    
    console.log(`[${new Date().toISOString()}] ${method} ${path} - ${res.statusCode} (${duration}ms) - ${route?.description || 'Unknown route'} - IP: ${ip}`);
  });
  
  next();
};

// Route rate limiting middleware
export const createRateLimit = (windowMs: number, maxRequests: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>();
  
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean up old entries
    for (const [ip, data] of requests.entries()) {
      if (data.resetTime < windowStart) {
        requests.delete(ip);
      }
    }
    
    const userRequests = requests.get(key);
    
    if (!userRequests) {
      requests.set(key, { count: 1, resetTime: now });
      return next();
    }
    
    if (userRequests.resetTime < windowStart) {
      userRequests.count = 1;
      userRequests.resetTime = now;
      return next();
    }
    
    if (userRequests.count >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((userRequests.resetTime + windowMs - now) / 1000)
      });
    }
    
    userRequests.count++;
    next();
  };
};

// Route parameter validation
export const validateRouteParams = (schema: Record<string, RegExp>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];
    
    for (const [param, pattern] of Object.entries(schema)) {
      const value = req.params[param];
      if (value && !pattern.test(value)) {
        errors.push(`Invalid ${param} parameter: ${value}`);
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Invalid route parameters',
        details: errors
      });
    }
    
    next();
  };
};

// Route query validation
export const validateQueryParams = (schema: Record<string, { required?: boolean; type: 'string' | 'number' | 'boolean' | 'date' }>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];
    
    for (const [param, config] of Object.entries(schema)) {
      const value = req.query[param];
      
      if (config.required && (value === undefined || value === '')) {
        errors.push(`Missing required query parameter: ${param}`);
        continue;
      }
      
      if (value !== undefined) {
        switch (config.type) {
          case 'number':
            if (isNaN(Number(value))) {
              errors.push(`Invalid number for parameter ${param}: ${value}`);
            }
            break;
          case 'boolean':
            if (!['true', 'false', '1', '0'].includes(String(value).toLowerCase())) {
              errors.push(`Invalid boolean for parameter ${param}: ${value}`);
            }
            break;
          case 'date':
            if (isNaN(Date.parse(String(value)))) {
              errors.push(`Invalid date for parameter ${param}: ${value}`);
            }
            break;
        }
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: errors
      });
    }
    
    next();
  };
};

// Route body validation
export const validateRequestBody = (schema: Record<string, { required?: boolean; type: string; minLength?: number; maxLength?: number }>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];
    const body = req.body;
    
    for (const [field, config] of Object.entries(schema)) {
      const value = body[field];
      
      if (config.required && (value === undefined || value === null || value === '')) {
        errors.push(`Missing required field: ${field}`);
        continue;
      }
      
      if (value !== undefined && value !== null) {
        if (config.type === 'string') {
          if (typeof value !== 'string') {
            errors.push(`Field ${field} must be a string`);
          } else if (config.minLength && value.length < config.minLength) {
            errors.push(`Field ${field} must be at least ${config.minLength} characters long`);
          } else if (config.maxLength && value.length > config.maxLength) {
            errors.push(`Field ${field} must be no more than ${config.maxLength} characters long`);
          }
        } else if (config.type === 'number') {
          if (typeof value !== 'number' || isNaN(value)) {
            errors.push(`Field ${field} must be a number`);
          }
        } else if (config.type === 'boolean') {
          if (typeof value !== 'boolean') {
            errors.push(`Field ${field} must be a boolean`);
          }
        } else if (config.type === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errors.push(`Field ${field} must be a valid email address`);
          }
        }
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: errors
      });
    }
    
    next();
  };
};

// Route security middleware
export const requireHTTPS = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.status(400).json({
      error: 'HTTPS required',
      message: 'This API requires HTTPS in production'
    });
  }
  next();
};

// Route CORS middleware
export const configureCORS = (allowedOrigins: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    
    if (allowedOrigins.includes(origin || '')) {
      res.header('Access-Control-Allow-Origin', origin);
    }
    
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    next();
  };
};

// Route analytics middleware
export const trackRouteUsage = (req: Request, res: Response, next: NextFunction) => {
  const { path, method } = req;
  const route = backendRouteManager.getRouteByPath(path, method);
  
  if (route) {
    // Here you would typically send analytics data to your analytics service
    console.log(`Route accessed: ${method} ${path} - ${route.description}`);
  }
  
  next();
};

// Route error handling middleware
export const handleRouteErrors = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(`Route error for ${req.method} ${req.path}:`, err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      details: err.message
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid ID format',
      message: 'The provided ID is not valid'
    });
  }
  
  if (err.code === 11000) {
    return res.status(409).json({
      error: 'Duplicate entry',
      message: 'A record with this information already exists'
    });
  }
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
};

// Route documentation middleware
export const generateRouteDocs = (req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/api-docs') {
    const docs = backendRouteManager.getRouteDocumentation();
    return res.set('Content-Type', 'text/markdown').send(docs);
  }
  
  if (req.path === '/api-spec') {
    const spec = backendRouteManager.generateOpenAPISpec();
    return res.json(spec);
  }
  
  next();
};

// Common validation schemas
export const commonSchemas = {
  mongoId: /^[a-f\d]{24}$/i,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s-()]+$/,
  date: /^\d{4}-\d{2}-\d{2}$/,
  slug: /^[a-z0-9-]+$/i,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
};

// Common request body schemas
export const commonBodySchemas = {
  user: {
    username: { required: true, type: 'string', minLength: 3, maxLength: 30 },
    email: { required: true, type: 'email' },
    password: { required: true, type: 'string', minLength: 6 },
    firstName: { required: false, type: 'string', maxLength: 50 },
    lastName: { required: false, type: 'string', maxLength: 50 },
    phoneNumber: { required: false, type: 'string' }
  },
  room: {
    roomNumber: { required: true, type: 'string', minLength: 1, maxLength: 10 },
    roomType: { required: true, type: 'string', maxLength: 50 },
    price: { required: true, type: 'number' },
    capacity: { required: true, type: 'number' },
    amenities: { required: false, type: 'string' },
    images: { required: false, type: 'string' }
  },
  booking: {
    roomId: { required: true, type: 'string' },
    checkInDate: { required: true, type: 'date' },
    checkOutDate: { required: true, type: 'date' },
    guests: { required: true, type: 'number' },
    specialRequests: { required: false, type: 'string', maxLength: 500 }
  }
};
