import { API_BASE_URL } from '../config/api';

const BASE = API_BASE_URL;

export interface CheckoutSessionResponse {
  url?: string;
}

export async function createCheckoutSession(bookingId: string): Promise<CheckoutSessionResponse> {
  const res = await fetch(`${BASE}/payments/create-checkout-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ bookingId }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.message || "Failed to create checkout session");
  }
  return json;
}
