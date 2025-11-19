import { AccessControl } from 'accesscontrol';

// Define roles and what they can do.
// We keep only two roles: 'user' and 'admin'.
// You can adjust these grants later in this single file.

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
  .createAny('room')
  .updateAny('room')
  .deleteAny('room');
