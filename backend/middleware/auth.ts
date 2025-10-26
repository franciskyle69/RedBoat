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
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    
    const payload = jwt.verify(token, jwtSecret) as { sub: string; email: string; role?: string };
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

// Role-based middleware
export function requireRole(role: 'user' | 'admin') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userRole = req.user?.role;
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

// Admin-only middleware
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userRole = req.user?.role;
    if (!userRole) return res.status(401).json({ message: "Unauthorized" });
    if (userRole !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
}
