import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET || "dev_secret";

export interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    email: string;
    role?: string;
  };
}

// Auth middleware
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.auth as string | undefined;
    
    // Debug logging
    console.log("Auth check - cookies:", Object.keys(req.cookies || {}));
    console.log("Auth check - has auth token:", !!token);
    
    if (!token) {
      console.log("Auth failed: No token in cookies");
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const payload = jwt.verify(token, jwtSecret) as { sub: string; email: string; role?: string };
    console.log("Auth success for:", payload.email);
    req.user = payload;
    next();
  } catch (err) {
    console.log("Auth failed: Token verification error", err);
    return res.status(401).json({ message: "Unauthorized" });
  }
}

// Role-based middleware
export function requireRole(role: 'user' | 'admin' | 'superadmin') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userRole = req.user?.role;
      if (!userRole) return res.status(401).json({ message: "Unauthorized" });
      if (userRole !== role && userRole !== 'admin' && userRole !== 'superadmin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      next();
    } catch {
      return res.status(401).json({ message: "Unauthorized" });
    }
  };
}

// Admin-only middleware
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userRole = req.user?.role;
    if (!userRole) return res.status(401).json({ message: "Unauthorized" });
    if (userRole !== 'admin' && userRole !== 'superadmin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
}
