import { Response, NextFunction } from 'express';
import { ac } from '../config/rbac';
import { AuthenticatedRequest } from './auth';
import { User } from '../models/User';

// Allowed actions map directly to accesscontrol API methods
export type RbacAction =
  | 'createOwn'
  | 'readOwn'
  | 'updateOwn'
  | 'deleteOwn'
  | 'createAny'
  | 'readAny'
  | 'updateAny'
  | 'deleteAny';

export function requirePermission(action: RbacAction, resource: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const payload = req.user;
      if (!payload) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const role = payload.role as string | undefined;
      if (!role) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const acRole = role as string;
      const permission = (ac.can(acRole) as any)[action](resource);
      if (!permission || !permission.granted) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      // Superadmin bypasses per-module checks
      if (role === 'superadmin') {
        return next();
      }

      // For admins, also enforce module-level permissions stored on the user record
      if (role === 'admin') {
        const userId = payload.sub;
        if (!userId) {
          return res.status(401).json({ message: 'Unauthorized' });
        }

        const user = await User.findById(userId).select('role adminPermissions');
        if (!user) {
          return res.status(401).json({ message: 'Unauthorized' });
        }

        const perms: any = (user as any).adminPermissions || {};

        let allowed = true;

        // Map resources to module flags; undefined means "allowed" by default
        switch (resource) {
          case 'booking':
            allowed = perms.manageBookings !== false;
            break;
          case 'room':
            allowed = perms.manageRooms !== false;
            break;
          case 'housekeeping':
            allowed = perms.manageHousekeeping !== false;
            break;
          case 'user':
            allowed = perms.manageUsers !== false;
            break;
          case 'report':
            allowed = perms.viewReports !== false;
            break;
          default:
            allowed = true;
        }

        if (!allowed) {
          return res.status(403).json({ message: 'Insufficient module permissions' });
        }
      }

      return next();
    } catch (err) {
      console.error('RBAC middleware error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  };
}
