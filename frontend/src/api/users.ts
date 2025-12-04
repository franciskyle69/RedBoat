import { API_BASE_URL } from '../config/api';

const BASE = API_BASE_URL;

export interface AdminPermissions {
  manageBookings?: boolean;
  manageRooms?: boolean;
  manageHousekeeping?: boolean;
  manageUsers?: boolean;
  viewReports?: boolean;
}

export interface User {
  _id: string;
  username?: string;
  email: string;
  role: 'user' | 'admin' | 'superadmin';
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  isEmailVerified: boolean;
  createdAt: string;
  adminPermissions?: AdminPermissions;
}

export async function getAllUsers(): Promise<User[]> {
  const res = await fetch(`${BASE}/users`, { credentials: 'include' });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to load users');
  const json = await res.json();
  return json.data || [];
}

export async function updateUserRole(userId: string, role: 'user' | 'admin') {
  const res = await fetch(`${BASE}/users/${userId}/role`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ role }),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to update user role');
  return await res.json();
}

export async function updateAdminPermissions(userId: string, adminPermissions: AdminPermissions) {
  const res = await fetch(`${BASE}/users/${userId}/admin-permissions`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ adminPermissions }),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to update admin permissions');
  return await res.json();
}
