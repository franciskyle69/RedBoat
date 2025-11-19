const BASE = 'http://localhost:5000';

export interface User {
  _id: string;
  username?: string;
  email: string;
  role: 'user' | 'admin';
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  isEmailVerified: boolean;
  createdAt: string;
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
