import { Response, NextFunction } from 'express';
import { ac } from '../rbac';
import { AuthenticatedRequest } from './auth';

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
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!role) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const permission = (ac.can(role as string) as any)[action](resource);
    if (!permission || !permission.granted) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    return next();
  };
}
