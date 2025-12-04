import { API_BASE_URL } from '../config/api';

const BASE = API_BASE_URL;

export interface FeedbackItem {
  _id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user?: {
    username?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

export async function submit(rating: number, comment: string) {
  const res = await fetch(`${BASE}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ rating, comment }),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to submit feedback');
  return await res.json();
}

export async function getMine(): Promise<FeedbackItem[]> {
  const res = await fetch(`${BASE}/feedback/my`, { credentials: 'include' });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to load feedback');
  const json = await res.json();
  return json.data || [];
}

export async function getAll(): Promise<FeedbackItem[]> {
  const res = await fetch(`${BASE}/feedback`, { credentials: 'include' });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to load feedback');
  const json = await res.json();
  return json.data || [];
}
