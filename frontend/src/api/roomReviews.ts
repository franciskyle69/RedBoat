import { API_BASE_URL } from '../config/api';

const BASE = API_BASE_URL;

export interface RoomReviewItem {
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

export interface RoomReviewResponse {
  items: RoomReviewItem[];
  averageRating: number;
  count: number;
}

export async function getForRoom(roomId: string): Promise<RoomReviewResponse> {
  const res = await fetch(`${BASE}/rooms/${roomId}/reviews`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to load room reviews');
  const json = await res.json();
  return json.data || { items: [], averageRating: 0, count: 0 };
}

export async function submit(roomId: string, rating: number, comment: string) {
  const res = await fetch(`${BASE}/rooms/${roomId}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ rating, comment }),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to submit review');
  return await res.json();
}
