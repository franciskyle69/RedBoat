import { API_BASE_URL } from '../config/api';

const BASE = API_BASE_URL;

export interface RolePermissions {
  manageBookings?: boolean;
  manageRooms?: boolean;
  manageHousekeeping?: boolean;
  manageUsers?: boolean;
  viewReports?: boolean;
}

export interface Role {
  _id: string;
  name: string;
  permissions: RolePermissions;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getRoles(): Promise<Role[]> {
  const res = await fetch(`${BASE}/roles`, { credentials: 'include' });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to load roles');
  const json = await res.json();
  return json.data || [];
}

export async function createRole(name: string, permissions: RolePermissions) {
  const res = await fetch(`${BASE}/roles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name: name.trim(), permissions }),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to create role');
  return (await res.json()).data;
}

export async function updateRole(roleId: string, data: { name?: string; permissions?: RolePermissions }) {
  const res = await fetch(`${BASE}/roles/${roleId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to update role');
  return (await res.json()).data;
}

export async function deleteRole(roleId: string) {
  const res = await fetch(`${BASE}/roles/${roleId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to delete role');
}
