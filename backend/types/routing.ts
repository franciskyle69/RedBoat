// Backend routing types
export interface RouteConfig {
  path: string;
  method: string;
  handler: (req: any, res: any) => Promise<void>;
  title?: string;
  description?: string;
  tags?: string[];
  requiresAuth?: boolean;
  requiredRole?: 'user' | 'admin';
  middleware?: any[];
}

// Backend-specific types
export interface RouteMetadata {
  path: string;
  method: string;
  description?: string;
  tags?: string[];
  requiresAuth?: boolean;
  requiredRole?: 'user' | 'admin';
}

export interface RouteStats {
  totalRoutes: number;
  publicRoutes: number;
  protectedRoutes: number;
  adminRoutes: number;
  userRoutes: number;
  routesByTag: Record<string, number>;
}

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
