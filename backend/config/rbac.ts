import { AccessControl } from 'accesscontrol';

// Define roles and what they can do.
// Roles: 'user', 'admin', 'superadmin'.
// Admin and superadmin capabilities can be combined with per-admin module permissions.

export const ac = new AccessControl();

// Base user permissions
ac.grant('user')
  .readOwn('profile')
  .updateOwn('profile')
  .readOwn('booking')
  .createOwn('booking')
  .updateOwn('booking');

// Admin inherits all user permissions and gains extra powers
ac.grant('admin')
  .extend('user')
  // User management
  .readAny('user')
  .updateAny('user')
  // Booking management
  .readAny('booking')
  .updateAny('booking')
  .deleteAny('booking')
  // Room management
  .readAny('room')
  .createAny('room')
  .updateAny('room')
  .deleteAny('room')
  // Housekeeping management
  .readAny('housekeeping')
  .updateAny('housekeeping')
  // Reports
  .readAny('report')
  // Activity logs
  .readAny('activity');

// Superadmin inherits all admin permissions and can be treated as full system owner
ac.grant('superadmin')
  .extend('admin')
  // Only superadmin can permanently delete user backups
  .deleteAny('user');
