export type PaymentStatus = "pending" | "paid" | "refunded";

export interface UserBooking {
  _id: string;
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
  status: "pending" | "confirmed" | "checked-in" | "checked-out" | "cancelled";
  specialRequests?: string;
  paymentStatus: PaymentStatus;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

const BASE = "http://localhost:5000";

export async function getAll() {
  const res = await fetch(`${BASE}/bookings`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch bookings");
  const json = await res.json();
  return json.data || [];
}

export async function getUserBookings(): Promise<UserBooking[]> {
  const res = await fetch(`${BASE}/bookings/user-bookings`, { credentials: "include" });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to fetch bookings");
  const json = await res.json();
  return json.data || [];
}

export async function updateStatus(id: string, status: string, adminNotes?: string) {
  const res = await fetch(`${BASE}/bookings/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ status, adminNotes }),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to update status");
  return await res.json();
}

export async function updatePayment(id: string, paymentStatus: PaymentStatus) {
  const res = await fetch(`${BASE}/bookings/${id}/payment`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ paymentStatus }),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to update payment");
  return await res.json();
}

export async function requestCheckIn(id: string, body?: { checkinNotes?: string; additionalCharges?: number }) {
  const res = await fetch(`${BASE}/bookings/${id}/checkin`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: body && Object.keys(body).length ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to check in");
  return await res.json();
}

export async function requestCheckOut(id: string, body?: { checkoutNotes?: string; additionalCharges?: number; roomCondition?: string }) {
  const res = await fetch(`${BASE}/bookings/${id}/checkout`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: body && Object.keys(body).length ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to check out");
  return await res.json();
}

export async function approveCancel(id: string) {
  const res = await fetch(`${BASE}/bookings/${id}/approve-cancel`, { method: "POST", credentials: "include" });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to approve cancel");
  return await res.json();
}

export async function declineCancel(id: string, adminNotes?: string) {
  const res = await fetch(`${BASE}/bookings/${id}/decline-cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ adminNotes }),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to decline cancel");
  return await res.json();
}

export async function requestUserCancellation(id: string, reason?: string) {
  const res = await fetch(`${BASE}/bookings/${id}/request-cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ reason }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || "Failed to request cancellation");
  return json;
}
