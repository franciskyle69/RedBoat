# RedBoat API Endpoints

**Base URL:** `http://localhost:5000`

---

## Authentication (No prefix)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/signup` | No | Register new user |
| POST | `/verify-email` | No | Verify email with code |
| POST | `/login` | No | User login |
| POST | `/logout` | No | User logout |
| POST | `/forgot-password` | No | Request password reset |
| POST | `/verify-reset-code` | No | Verify reset code |
| POST | `/reset-password` | No | Reset password |
| POST | `/google-login` | No | Google OAuth login |
| POST | `/promote-to-admin` | No | Promote user to admin |
| POST | `/set-username` | Yes | Set username |

---

## Users (No prefix)

| Method | Endpoint | Auth | Permission | Description |
|--------|----------|------|------------|-------------|
| GET | `/me` | Yes | - | Get current user |
| GET | `/profile` | Yes | - | Get user profile |
| PUT | `/profile` | Yes | - | Update profile |
| PUT | `/profile/password` | Yes | - | Change password |
| POST | `/profile/avatar` | Yes | - | Upload avatar |
| DELETE | `/profile` | Yes | - | Delete account |
| GET | `/users` | Yes | readAny:user | Get all users |
| PUT | `/users/:userId/role` | Yes | updateAny:user | Update user role |
| PUT | `/users/:userId/admin-permissions` | Yes | updateAny:user | Update admin permissions |
| GET | `/users/deleted` | Yes | readAny:user | Get deleted users |
| POST | `/users/deleted/:backupId/restore` | Yes | updateAny:user | Restore deleted user |
| DELETE | `/users/deleted/:backupId` | Yes | deleteAny:user | Permanently delete backup |

---

## Rooms (`/rooms`)

| Method | Endpoint | Auth | Permission | Description |
|--------|----------|------|------------|-------------|
| GET | `/rooms` | No | - | Get all rooms (public) |
| GET | `/rooms/availability` | No | - | Check room availability |
| GET | `/rooms/calendar` | No | - | Get room calendar |
| GET | `/rooms/:id/reviews` | No | - | Get room reviews |
| POST | `/rooms/:id/reviews` | Yes | - | Create room review |
| POST | `/rooms` | Yes | createAny:room | Create room |
| PUT | `/rooms/:id` | Yes | updateAny:room | Update room |
| POST | `/rooms/:id/images` | Yes | updateAny:room | Upload room images |
| DELETE | `/rooms/:id` | Yes | deleteAny:room | Delete room |
| GET | `/rooms/admin` | Yes | readAny:room | Get all rooms (admin) |
| POST | `/rooms/sample` | Yes | createAny:room | Create sample rooms |
| GET | `/rooms/housekeeping` | Yes | readAny:housekeeping | Get housekeeping overview |
| PUT | `/rooms/housekeeping/:id` | Yes | updateAny:housekeeping | Update housekeeping status |

---

## Bookings (`/bookings`)

| Method | Endpoint | Auth | Permission | Description |
|--------|----------|------|------------|-------------|
| GET | `/bookings` | Yes | readAny:booking | Get all bookings |
| GET | `/bookings/user-bookings` | Yes | readOwn:booking | Get user's bookings |
| POST | `/bookings` | Yes | createOwn:booking | Create booking |
| PUT | `/bookings/:id/status` | Yes | updateAny:booking | Update booking status |
| PUT | `/bookings/:bookingId/payment` | Yes | updateOwn:booking | Update payment status |
| PUT | `/bookings/:id/checkin` | Yes | updateAny:booking | Check-in guest |
| PUT | `/bookings/:id/checkout` | Yes | updateAny:booking | Check-out guest |
| POST | `/bookings/:id/request-cancel` | Yes | updateOwn:booking | Request cancellation |
| POST | `/bookings/:id/approve-cancel` | Yes | updateAny:booking | Approve cancellation |
| POST | `/bookings/:id/decline-cancel` | Yes | updateAny:booking | Decline cancellation |

---

## Reports (`/reports`)

| Method | Endpoint | Auth | Permission | Description |
|--------|----------|------|------------|-------------|
| GET | `/reports/occupancy` | Yes | readAny:report | Get occupancy report |
| GET | `/reports/revenue` | Yes | readAny:report | Get revenue report |
| GET | `/reports/bookings` | Yes | readAny:report | Get booking analytics |
| GET | `/reports/dashboard` | Yes | readAny:report | Get dashboard summary |
| GET | `/reports/occupancy/pdf` | Yes | readAny:report | Download occupancy PDF |
| GET | `/reports/revenue/pdf` | Yes | readAny:report | Download revenue PDF |
| GET | `/reports/bookings/pdf` | Yes | readAny:report | Download bookings PDF |

---

## Notifications (`/notifications`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/notifications` | Yes | List notifications |
| POST | `/notifications` | Yes | Create notification |
| POST | `/notifications/mark-all-read` | Yes | Mark all as read |
| POST | `/notifications/:id/read` | Yes | Mark one as read |
| DELETE | `/notifications/:id` | Yes | Delete notification |
| GET | `/notifications/stream` | Yes | SSE real-time stream |

---

## Feedback (`/feedback`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/feedback` | Yes | Submit feedback |
| GET | `/feedback/my` | Yes | Get my feedback |
| GET | `/feedback` | Yes | Get all feedback |

---

## Payments (`/payments`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/payments/create-checkout-session` | No | Create Stripe checkout |
| GET | `/payments/confirm` | No | Confirm payment session |
| POST | `/payments/webhook` | No | Stripe webhook (raw body) |

---

## Google Calendar (`/google-calendar`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/google-calendar/auth-url` | Yes | Get Google auth URL |
| POST | `/google-calendar/callback` | Yes | Handle OAuth callback |
| GET | `/google-calendar/events` | Yes | Get calendar events |
| POST | `/google-calendar/create-event` | Yes | Create calendar event |
| POST | `/google-calendar/sync-booking/:bookingId` | Yes | Sync booking to calendar |

---

## Static Files

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/uploads/*` | Serve uploaded files (avatars, room images) |

---

## Utility

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | No | Health check |
| POST | `/test-email` | No | Test email sending |

---

## Summary

| Category | Count |
|----------|-------|
| Authentication | 10 |
| Users | 12 |
| Rooms | 13 |
| Bookings | 10 |
| Reports | 7 |
| Notifications | 6 |
| Feedback | 3 |
| Payments | 3 |
| Google Calendar | 5 |
| Static/Utility | 3 |
| **Total** | **72** |
