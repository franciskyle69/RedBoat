import { Response } from 'express';
import { Role } from '../models/Role';
import { AuthenticatedRequest } from '../middleware/auth';
import { logActivity } from '../services/activityLogService';

export class RoleController {
  static async list(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      if (payload.role !== 'admin' && payload.role !== 'superadmin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      const roles = await Role.find({}).sort({ isSystem: -1, name: 1 }).lean();
      return res.json({ data: roles });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      if (payload.role !== 'superadmin') {
        return res.status(403).json({ message: 'Superadmin access required to create roles' });
      }
      const { name, permissions } = req.body as { name?: string; permissions?: any };
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ message: 'Role name is required' });
      }
      const n = name.trim().toLowerCase();
      if (['user', 'admin', 'superadmin'].includes(n)) {
        return res.status(400).json({ message: 'Cannot create a system role with the same name' });
      }
      const existing = await Role.findOne({ name: n });
      if (existing) {
        return res.status(400).json({ message: 'A role with this name already exists' });
      }
      const perms = {
        manageBookings: permissions?.manageBookings !== false,
        manageRooms: permissions?.manageRooms !== false,
        manageHousekeeping: permissions?.manageHousekeeping !== false,
        manageUsers: permissions?.manageUsers !== false,
        viewReports: permissions?.viewReports !== false,
      };
      const role = new Role({ name: n, permissions: perms, isSystem: false });
      await role.save();
      await logActivity(req, {
        action: 'create_role',
        resource: 'role',
        resourceId: (role._id as any).toString(),
        details: { name: n, permissions: perms },
      });
      return res.status(201).json({
        message: 'Role created successfully',
        data: role.toObject(),
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      if (payload.role !== 'superadmin') {
        return res.status(403).json({ message: 'Superadmin access required to update roles' });
      }
      const { roleId } = req.params;
      const { name, permissions } = req.body as { name?: string; permissions?: any };
      const role = await Role.findById(roleId);
      if (!role) {
        return res.status(404).json({ message: 'Role not found' });
      }
      if (role.isSystem) {
        return res.status(400).json({ message: 'System roles cannot be modified' });
      }
      if (name !== undefined && typeof name === 'string' && name.trim()) {
        const n = name.trim().toLowerCase();
        if (['user', 'admin', 'superadmin'].includes(n)) {
          return res.status(400).json({ message: 'Cannot rename to a system role name' });
        }
        role.name = n;
      }
      if (permissions && typeof permissions === 'object') {
        (role as any).permissions = {
          manageBookings: permissions.manageBookings !== false,
          manageRooms: permissions.manageRooms !== false,
          manageHousekeeping: permissions.manageHousekeeping !== false,
          manageUsers: permissions.manageUsers !== false,
          viewReports: permissions.viewReports !== false,
        };
      }
      role.updatedAt = new Date();
      await role.save();
      await logActivity(req, {
        action: 'update_role',
        resource: 'role',
        resourceId: (role._id as any).toString(),
        details: { name: role.name, permissions: (role as any).permissions },
      });
      return res.json({
        message: 'Role updated successfully',
        data: role.toObject(),
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      if (payload.role !== 'superadmin') {
        return res.status(403).json({ message: 'Superadmin access required to delete roles' });
      }
      const { roleId } = req.params;
      const role = await Role.findById(roleId);
      if (!role) {
        return res.status(404).json({ message: 'Role not found' });
      }
      if (role.isSystem) {
        return res.status(400).json({ message: 'System roles cannot be deleted' });
      }
      await Role.findByIdAndDelete(roleId);
      await logActivity(req, {
        action: 'delete_role',
        resource: 'role',
        resourceId: roleId,
        details: { name: role.name },
      });
      return res.json({ message: 'Role deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
}
