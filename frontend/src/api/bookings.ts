export type BookingStatus = "pending" | "confirmed" | "checked-in" | "checked-out" | "cancelled";

export type PaymentStatus = "pending" | "paid" | "refunded";

export interface BaseBooking {
  _id: string;
  bookingReference?: string;
  room: {
    _id: string;
    roomNumber: string;
    roomType: string;
    price: number;
  };
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  totalAmount: number;
  status: BookingStatus;
  specialRequests?: string;
  paymentStatus: PaymentStatus;
  paymentMethod?: 'stripe' | 'cash' | 'bank_transfer' | 'other';
  paymentDate?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// Generate a booking reference from the booking ID
// Format: RB-XXXXXX (last 6 chars of ID, uppercase)
export function getBookingReference(booking: { _id: string; bookingReference?: string }): string {
  if (booking.bookingReference) return booking.bookingReference;
  return `RB-${booking._id.slice(-6).toUpperCase()}`;
}

// Generate a payment reference from the booking ID
// Format: PAY-XXXXXX (last 6 chars of ID, uppercase)
export function getPaymentReference(bookingId: string): string {
  return `PAY-${bookingId.slice(-6).toUpperCase()}`;
}

export interface UserBooking extends BaseBooking {
  pendingSince?: string;
  pendingExpiresAt?: string;
  pendingDurationSeconds?: number;
  pendingDurationMinutes?: number;
  pendingExpiresInMinutes?: number;
  actualCheckInTime?: string;
  actualCheckOutTime?: string;
}

export interface AdminBooking extends BaseBooking {
  user: {
    _id: string;
    username: string;
  };
  guestName?: string;
  contactNumber?: string;
  actualCheckInTime?: string;
  actualCheckOutTime?: string;
  lateCheckInFee?: number;
  lateCheckOutFee?: number;
  additionalCharges?: number;
  checkoutNotes?: string;
  cancellationRequested?: boolean;
  /** Set when status is pending: minutes since booking entered pending */
  pendingDurationMinutes?: number;
  /** Set when status is pending: minutes until pending expires (0 = expired) */
  pendingExpiresInMinutes?: number;
  pendingSince?: string;
  pendingExpiresAt?: string;
}

import { API_BASE_URL } from '../config/api';

const BASE = API_BASE_URL;

export async function getAll(): Promise<AdminBooking[]> {
  const res = await fetch(`${BASE}/bookings`, { credentials: "include" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (json as any).details || (json as any).message || "Failed to fetch bookings";
    throw new Error(message);
  }
  return (json as any).data || [];
}

export async function getUserBookings(): Promise<UserBooking[]> {
  const res = await fetch(`${BASE}/bookings/user-bookings`, { credentials: "include" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (json as any).details || (json as any).message || "Failed to fetch bookings";
    throw new Error(message);
  }
  return (json as any).data || [];
}

export async function updateStatus(id: string, status: string, adminNotes?: string) {
  const res = await fetch(`${BASE}/bookings/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ status, adminNotes }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (json as any).details || (json as any).message || "Failed to update status";
    throw new Error(message);
  }
  return json;
}

export async function updatePayment(id: string, paymentStatus: PaymentStatus) {
  const res = await fetch(`${BASE}/bookings/${id}/payment`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ paymentStatus }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (json as any).details || (json as any).message || "Failed to update payment";
    throw new Error(message);
  }
  return json;
}

export async function requestCheckIn(id: string, body?: { checkinNotes?: string; additionalCharges?: number }) {
  const res = await fetch(`${BASE}/bookings/${id}/checkin`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: body && Object.keys(body).length ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (json as any).details || (json as any).message || "Failed to check in";
    throw new Error(message);
  }
  return json;
}

export async function requestCheckOut(id: string, body?: { checkoutNotes?: string; additionalCharges?: number; roomCondition?: string }) {
  const res = await fetch(`${BASE}/bookings/${id}/checkout`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: body && Object.keys(body).length ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (json as any).details || (json as any).message || "Failed to check out";
    throw new Error(message);
  }
  return json;
}

export async function approveCancel(id: string) {
  const res = await fetch(`${BASE}/bookings/${id}/approve-cancel`, { method: "POST", credentials: "include" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (json as any).details || (json as any).message || "Failed to approve cancel";
    throw new Error(message);
  }
  return json;
}

export async function declineCancel(id: string, adminNotes?: string) {
  const res = await fetch(`${BASE}/bookings/${id}/decline-cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ adminNotes }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (json as any).details || (json as any).message || "Failed to decline cancel";
    throw new Error(message);
  }
  return json;
}

export async function requestUserCancellation(id: string, reason?: string) {
  const res = await fetch(`${BASE}/bookings/${id}/request-cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ reason }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (json as any).details || (json as any).message || "Failed to request cancellation";
    throw new Error(message);
  }
  return json;
}

export interface CreateBookingPayload {
  roomId: string;
  guestName: string;
  contactNumber: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  specialRequests?: string;
}

export async function createBooking(payload: CreateBookingPayload): Promise<AdminBooking> {
  const res = await fetch(`${BASE}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (json as any).details || (json as any).message || "Failed to create booking";
    throw new Error(message);
  }
  return (json as any).data;
}
