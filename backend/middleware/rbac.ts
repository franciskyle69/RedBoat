import { Response, NextFunction } from 'express';
import { ac } from '../config/rbac';
import { AuthenticatedRequest } from './auth';
import { Role } from '../models/Role';

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

function getModuleAllowed(perms: any, resource: string): boolean {
  switch (resource) {
    case 'booking':
      return perms.manageBookings !== false;
    case 'room':
      return perms.manageRooms !== false;
    case 'housekeeping':
      return perms.manageHousekeeping !== false;
    case 'user':
      return perms.manageUsers !== false;
    case 'report':
      return perms.viewReports !== false;
    default:
      return true;
  }
}

export function requirePermission(action: RbacAction, resource: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const payload = req.user;
      if (!payload) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const roleName = payload.role as string | undefined;
      if (!roleName) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Only user, admin, superadmin are in accesscontrol; custom roles use Role collection only
      const acRole = ['user', 'admin', 'superadmin'].includes(roleName) ? roleName : 'admin';
      const permission = (ac.can(acRole) as any)[action](resource);
      if (!permission || !permission.granted) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      if (roleName === 'superadmin') {
        return next();
      }

      // For admin and custom roles: enforce module-level permissions from Role collection (per-role, not per-user)
      const roleDoc = await Role.findOne({ name: roleName }).lean();
      const perms = roleDoc?.permissions ?? {};
      const allowed = getModuleAllowed(perms, resource);
      if (!allowed) {
        return res.status(403).json({ message: 'Insufficient module permissions for this role' });
      }

      return next();
    } catch (err) {
      console.error('RBAC middleware error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  };
}
