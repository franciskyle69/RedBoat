# RedBoat Backend API Documentation (v2)

- Base URL: http://localhost:5000
- Auth: JWT via HTTP-only cookie named `auth`. Always send requests with credentials (frontend: `fetch(..., { credentials: 'include' })`; curl: `-b cookie.txt -c cookie.txt`).
- Content-Type: application/json unless stated.
- Static files: GET /uploads/* serves uploaded assets.

---

## Quick Auth Examples

- Login
```bash
curl -X POST http://localhost:5000/login \
  -H "Content-Type: application/json" \
  -c cookie.txt -b cookie.txt \
  -d '{"email":"user@example.com","password":"password"}'
```

- Authenticated request (cookie from prior login)
```bash
curl http://localhost:5000/me -b cookie.txt -c cookie.txt
```

---

## 1) Authentication
Mounted at: /

- POST /signup
- POST /verify-email
- POST /login
- POST /logout
- POST /forgot-password
- POST /verify-reset-code
- POST /reset-password
- POST /google-login
- POST /promote-to-admin
- POST /set-username (Auth required)

Notes
- Cookie name: `auth` (HTTP-only). Verified by `requireAuth` middleware.
- `google-login` expects a Google ID token payload `{ idToken: string }` (see controller).
- Input validation uses zod (see middleware/validate.ts for exact shapes).

Example bodies (selected)
- /signup
```json
{
  "username": "johndoe",
  "email": "user@example.com",
  "password": "StrongPass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```
- /verify-email
```json
{ "email": "user@example.com", "code": "123456" }
```
- /login
```json
{ "email": "user@example.com", "password": "StrongPass123!" }
```
- /set-username (Auth)
```json
{ "username": "new_handle" }
```

---

## 2) Users
Mounted at: /

- GET /me (Auth)
- GET /profile (Auth)
- PUT /profile (Auth)
- PUT /profile/password (Auth)
- POST /profile/avatar (Auth, multipart: field `avatar`)
- GET /users (Auth + permission: readAny user)
- PUT /users/:userId/role (Auth + permission: updateAny user)
- PUT /users/:userId/admin-permissions (Auth + permission: updateAny user)

---

## 3) Rooms
Mounted at: /rooms

Public
- GET /rooms/
- GET /rooms/availability
- GET /rooms/calendar
- GET /rooms/:id/reviews

Auth/Admin
- POST /rooms/ (Auth + permission: createAny room; multipart: field `images` up to 5)
- PUT /rooms/:id (Auth + permission: updateAny room)
- POST /rooms/:id/images (Auth + permission: updateAny room; multipart: field `images`)
- DELETE /rooms/:id (Auth + permission: deleteAny room)
- GET /rooms/admin (Auth + permission: readAny room)
- POST /rooms/sample (Auth + permission: createAny room)
- GET /rooms/housekeeping (Auth + permission: readAny housekeeping)
- PUT /rooms/housekeeping/:id (Auth + permission: updateAny housekeeping)

---

## 4) Bookings
Mounted at: /bookings

- GET /bookings/ (Auth + permission: readAny booking) — Admin overview
- GET /bookings/user-bookings (Auth + permission: readOwn booking)
- POST /bookings/ (Auth + permission: createOwn booking)
- PUT /bookings/:id/status (Auth + permission: updateAny booking)
- PUT /bookings/:bookingId/payment (Auth + permission: updateOwn booking)
- PUT /bookings/:id/checkin (Auth + permission: updateAny booking)
- PUT /bookings/:id/checkout (Auth + permission: updateAny booking)
- POST /bookings/:id/request-cancel (Auth + permission: updateOwn booking)
- POST /bookings/:id/approve-cancel (Auth + permission: updateAny booking)
- POST /bookings/:id/decline-cancel (Auth + permission: updateAny booking)

Selected request bodies
- Create booking
```json
{
  "roomId": "<roomId>",
  "checkInDate": "2025-01-15",
  "checkOutDate": "2025-01-17",
  "numberOfGuests": 2,
  "guestName": "John Doe",
  "contactNumber": "+63...",
  "specialRequests": "Late check-in"
}
```
- Update status (admin)
```json
{ "status": "confirmed" }
```

---

## 5) Reports
Mounted at: /reports (Auth + permission: readAny report)

- GET /reports/occupancy
- GET /reports/revenue
- GET /reports/bookings
- GET /reports/dashboard
- GET /reports/occupancy/pdf
- GET /reports/revenue/pdf
- GET /reports/bookings/pdf

---

## 6) Notifications
Mounted at: /notifications (All require Auth)

- GET /notifications/
- POST /notifications/ (body validated)
- POST /notifications/mark-all-read
- POST /notifications/:id/read
- DELETE /notifications/:id
- GET /notifications/stream (SSE)

SSE sample
```
event: notification
data: {"_id":"...","title":"...","message":"..."}
```

---

## 7) Feedback
Mounted at: /feedback (Auth required)

- POST /feedback/
- GET /feedback/my
- GET /feedback/

---

## 8) Payments (Stripe)
Mounted at: /payments

- POST /payments/create-checkout-session
  - Body: `{ "bookingId": "..." }`
  - Response: `{ "id": "cs_...", "url": "https://checkout.stripe.com/..." }`

- GET /payments/confirm?session_id=...
  - Response when paid: `{ "ok": true, "bookingId": "..." }`

- POST /payments/webhook
  - Raw body endpoint for Stripe webhooks. Set signing secret and send exactly as Stripe sends.

---

## 9) Backups (Superadmin only)
Mounted at: /backup (Auth required; role must be `superadmin`)

- POST /backup/create — Create ZIP of database collections
- GET /backup/ — List available backups
- GET /backup/download/:filename — Download a backup ZIP
- POST /backup/restore/:filename — Restore from a server backup ZIP
- POST /backup/upload-restore — Multipart upload field `backup` to restore from uploaded ZIP
- DELETE /backup/:filename — Delete a backup ZIP

Notes
- Backup directory is configured in code as `C:\\database_backup`.

---

## 10) Optional: Google Calendar integration (present in code, not mounted)
Routes exist in `backend/routes/googleCalendarRoutes.ts` but are not registered in `server.ts`.
To enable, import and mount:
```ts
import googleCalendarRoutes from "./routes/googleCalendarRoutes";
app.use("/google-calendar", googleCalendarRoutes);
```
Endpoints (once enabled; Auth required)
- GET /google-calendar/auth-url
- POST /google-calendar/callback
- GET /google-calendar/events
- POST /google-calendar/create-event
- POST /google-calendar/sync-booking/:bookingId

---

## 11) Errors
Common responses
- 400: `{ "message": "Validation failed", "errors": [...] }`
- 401: `{ "message": "Unauthorized" }`
- 403: `{ "message": "Insufficient permissions" }`
- 404: `{ "message": "Not found" }`
- 500: `{ "message": "Server error" }`

---

## 12) Environment Variables (placeholders only)
Do not use real values in docs. Example `.env` with placeholders:
```env
# Server
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173

# Database
MONGO_URI=mongodb://localhost:27017/redboat

# Auth
JWT_SECRET=YOUR_JWT_SECRET
JWT_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET

# Stripe
STRIPE_SECRET_KEY=YOUR_STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET=YOUR_STRIPE_WEBHOOK_SECRET

# Email (Nodemailer Gmail example)
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_app_password

# reCAPTCHA (use your secret in production)
RECAPTCHA_SECRET_KEY=YOUR_RECAPTCHA_SECRET_KEY
```

Notes
- Keep `payments/webhook` raw body parsing as coded in `server.ts` (registered before `express.json`).
- Cookies use `sameSite: lax` in dev and `sameSite: none` + `secure` in production.

---

## 13) CORS
Configured origins include `CLIENT_ORIGIN` and local dev ports (5173/5174/5175/3000). Credentials enabled for cookies.

---

## 14) Health
- GET / — returns "Backend server is running 🚀"
