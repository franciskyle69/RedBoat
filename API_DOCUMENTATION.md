# RedBoat Hotel Management System - API Documentation

**Base URL:** `http://localhost:5000/api`

**Authentication:** Most endpoints require JWT authentication via HTTP-only cookies. Include `credentials: 'include'` in fetch requests.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Users](#users)
3. [Rooms](#rooms)
4. [Bookings](#bookings)
5. [Feedback](#feedback)
6. [Reports](#reports)
7. [Notifications](#notifications)
8. [Payments](#payments)
9. [Google Calendar](#google-calendar)

---

## Authentication

Base path: `/api/auth`

### POST `/signup`
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe"
}
```

**Response:** `201 Created`
```json
{
  "message": "Verification code sent to email",
  "userId": "64a..."
}
```

---

### POST `/verify-email`
Verify email address with the code sent during signup.

**Request Body:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response:** `200 OK`
```json
{
  "message": "Email verified successfully"
}
```

---

### POST `/login`
Authenticate user and receive JWT cookie.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:** `200 OK`
```json
{
  "message": "Login successful",
  "user": {
    "_id": "64a...",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user"
  }
}
```

---

### POST `/logout`
Clear authentication cookie.

**Response:** `200 OK`
```json
{
  "message": "Logged out successfully"
}
```

---

### POST `/forgot-password`
Request a password reset code.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:** `200 OK`
```json
{
  "message": "Reset code sent to email"
}
```

---

### POST `/verify-reset-code`
Verify the password reset code.

**Request Body:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response:** `200 OK`
```json
{
  "message": "Code verified",
  "resetToken": "abc123..."
}
```

---

### POST `/reset-password`
Reset password using verified token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "resetToken": "abc123...",
  "newPassword": "newSecurePassword123"
}
```

**Response:** `200 OK`
```json
{
  "message": "Password reset successfully"
}
```

---

### POST `/google-login`
Authenticate using Google OAuth.

**Request Body:**
```json
{
  "credential": "google_id_token_here"
}
```

**Response:** `200 OK`
```json
{
  "message": "Login successful",
  "user": {
    "_id": "64a...",
    "email": "user@gmail.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user"
  }
}
```

---

### POST `/promote-to-admin`
Promote a user to admin role (requires secret key).

**Request Body:**
```json
{
  "email": "user@example.com",
  "secretKey": "ADMIN_SECRET_KEY"
}
```

**Response:** `200 OK`
```json
{
  "message": "User promoted to admin"
}
```

---

### POST `/set-username`
Set username for authenticated user.

**Auth Required:** Yes

**Request Body:**
```json
{
  "username": "newusername"
}
```

**Response:** `200 OK`
```json
{
  "message": "Username set successfully"
}
```

---

## Users

Base path: `/api/users`

### GET `/me`
Get current authenticated user.

**Auth Required:** Yes

**Response:** `200 OK`
```json
{
  "_id": "64a...",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe",
  "role": "user",
  "avatar": "/uploads/avatars/user123.jpg"
}
```

---

### GET `/profile`
Get detailed user profile.

**Auth Required:** Yes

**Response:** `200 OK`
```json
{
  "_id": "64a...",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe",
  "phone": "+1234567890",
  "address": "123 Main St",
  "role": "user",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### PUT `/profile`
Update user profile.

**Auth Required:** Yes

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "address": "123 Main St"
}
```

**Response:** `200 OK`
```json
{
  "message": "Profile updated successfully",
  "user": { ... }
}
```

---

### PUT `/profile/password`
Change user password.

**Auth Required:** Yes

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword123"
}
```

**Response:** `200 OK`
```json
{
  "message": "Password changed successfully"
}
```

---

### POST `/profile/avatar`
Upload user avatar image.

**Auth Required:** Yes

**Content-Type:** `multipart/form-data`

**Form Data:**
- `avatar`: Image file (JPEG, PNG, etc.)

**Response:** `200 OK`
```json
{
  "message": "Avatar uploaded successfully",
  "avatar": "/uploads/avatars/user123.jpg"
}
```

---

### DELETE `/profile`
Delete user account.

**Auth Required:** Yes

**Response:** `200 OK`
```json
{
  "message": "Account deleted successfully"
}
```

---

### GET `/users`
Get all users (admin only).

**Auth Required:** Yes  
**Permission:** `readAny:user`

**Response:** `200 OK`
```json
{
  "users": [
    {
      "_id": "64a...",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### PUT `/users/:userId/role`
Update user role (admin only).

**Auth Required:** Yes  
**Permission:** `updateAny:user`

**Request Body:**
```json
{
  "role": "admin"
}
```

**Response:** `200 OK`
```json
{
  "message": "User role updated",
  "user": { ... }
}
```

---

### PUT `/users/:userId/admin-permissions`
Update admin permissions (admin only).

**Auth Required:** Yes  
**Permission:** `updateAny:user`

**Request Body:**
```json
{
  "permissions": {
    "canManageUsers": true,
    "canManageRooms": true,
    "canManageBookings": true,
    "canViewReports": true
  }
}
```

**Response:** `200 OK`
```json
{
  "message": "Permissions updated",
  "user": { ... }
}
```

---

### GET `/users/deleted`
Get deleted users for recovery (admin only).

**Auth Required:** Yes  
**Permission:** `readAny:user`

**Response:** `200 OK`
```json
{
  "deletedUsers": [
    {
      "backupId": "backup123",
      "email": "deleted@example.com",
      "deletedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### POST `/users/deleted/:backupId/restore`
Restore a deleted user (admin only).

**Auth Required:** Yes  
**Permission:** `updateAny:user`

**Response:** `200 OK`
```json
{
  "message": "User restored successfully"
}
```

---

### DELETE `/users/deleted/:backupId`
Permanently delete user backup (admin only).

**Auth Required:** Yes  
**Permission:** `deleteAny:user`

**Response:** `200 OK`
```json
{
  "message": "Backup permanently deleted"
}
```

---

## Rooms

Base path: `/api/rooms`

### GET `/`
Get all available rooms (public).

**Response:** `200 OK`
```json
{
  "data": [
    {
      "_id": "64a...",
      "roomNumber": "101",
      "roomType": "Standard",
      "price": 1000,
      "capacity": 2,
      "amenities": ["Air conditioned", "Hot and cold shower"],
      "description": "Comfortable standard room",
      "isAvailable": true,
      "images": ["/uploads/rooms/room101.jpg"],
      "averageRating": 4.5,
      "reviewCount": 10
    }
  ]
}
```

---

### GET `/availability`
Check room availability for date range.

**Query Parameters:**
- `checkIn`: Check-in date (YYYY-MM-DD)
- `checkOut`: Check-out date (YYYY-MM-DD)

**Response:** `200 OK`
```json
{
  "availableRooms": [
    {
      "_id": "64a...",
      "roomNumber": "101",
      "roomType": "Standard",
      "price": 1000
    }
  ]
}
```

---

### GET `/calendar`
Get room calendar data for availability display.

**Query Parameters:**
- `month`: Month (1-12)
- `year`: Year (YYYY)

**Response:** `200 OK`
```json
{
  "calendar": {
    "2024-01-15": {
      "101": { "status": "booked", "bookingId": "64a..." },
      "102": { "status": "available" }
    }
  }
}
```

---

### GET `/:id/reviews`
Get reviews for a specific room.

**Response:** `200 OK`
```json
{
  "reviews": [
    {
      "_id": "64a...",
      "rating": 5,
      "comment": "Great room!",
      "user": {
        "firstName": "John",
        "lastName": "Doe"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### POST `/:id/reviews`
Create a review for a room.

**Auth Required:** Yes

**Request Body:**
```json
{
  "rating": 5,
  "comment": "Excellent stay!"
}
```

**Response:** `201 Created`
```json
{
  "message": "Review created successfully",
  "review": { ... }
}
```

---

### POST `/`
Create a new room (admin only).

**Auth Required:** Yes  
**Permission:** `createAny:room`

**Request Body:**
```json
{
  "roomNumber": "101",
  "roomType": "Standard",
  "price": 1000,
  "capacity": 2,
  "amenities": ["Air conditioned", "Hot and cold shower"],
  "description": "Comfortable standard room"
}
```

**Response:** `201 Created`
```json
{
  "message": "Room created successfully",
  "room": { ... }
}
```

---

### PUT `/:id`
Update a room (admin only).

**Auth Required:** Yes  
**Permission:** `updateAny:room`

**Request Body:**
```json
{
  "price": 1200,
  "description": "Updated description",
  "isAvailable": true
}
```

**Response:** `200 OK`
```json
{
  "message": "Room updated successfully",
  "room": { ... }
}
```

---

### POST `/:id/images`
Upload room images (admin only).

**Auth Required:** Yes  
**Permission:** `updateAny:room`

**Content-Type:** `multipart/form-data`

**Form Data:**
- `images`: Image files (max 5)

**Response:** `200 OK`
```json
{
  "message": "Images uploaded successfully",
  "images": ["/uploads/rooms/room101_1.jpg", "/uploads/rooms/room101_2.jpg"]
}
```

---

### DELETE `/:id`
Delete a room (admin only).

**Auth Required:** Yes  
**Permission:** `deleteAny:room`

**Response:** `200 OK`
```json
{
  "message": "Room deleted successfully"
}
```

---

### GET `/admin`
Get all rooms with admin details.

**Auth Required:** Yes  
**Permission:** `readAny:room`

**Response:** `200 OK`
```json
{
  "data": [
    {
      "_id": "64a...",
      "roomNumber": "101",
      "roomType": "Standard",
      "price": 1000,
      "isAvailable": true,
      "housekeepingStatus": "clean",
      "lastCleanedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### POST `/sample`
Create sample rooms for testing (admin only).

**Auth Required:** Yes  
**Permission:** `createAny:room`

**Response:** `201 Created`
```json
{
  "message": "Sample rooms created",
  "rooms": [ ... ]
}
```

---

### GET `/housekeeping`
Get housekeeping overview (admin only).

**Auth Required:** Yes  
**Permission:** `readAny:housekeeping`

**Response:** `200 OK`
```json
{
  "rooms": [
    {
      "_id": "64a...",
      "roomNumber": "101",
      "housekeepingStatus": "dirty",
      "assignedHousekeeper": "Jane Doe",
      "lastCleanedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### PUT `/housekeeping/:id`
Update housekeeping status (admin only).

**Auth Required:** Yes  
**Permission:** `updateAny:housekeeping`

**Request Body:**
```json
{
  "housekeepingStatus": "clean",
  "assignedHousekeeper": "Jane Doe"
}
```

**Response:** `200 OK`
```json
{
  "message": "Housekeeping status updated",
  "room": { ... }
}
```

---

## Bookings

Base path: `/api/bookings`

### GET `/`
Get all bookings (admin only).

**Auth Required:** Yes  
**Permission:** `readAny:booking`

**Query Parameters:**
- `status`: Filter by status (pending, confirmed, checked-in, checked-out, cancelled)
- `page`: Page number
- `limit`: Items per page

**Response:** `200 OK`
```json
{
  "bookings": [
    {
      "_id": "64a...",
      "room": {
        "roomNumber": "101",
        "roomType": "Standard"
      },
      "user": {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      },
      "checkInDate": "2024-01-15T14:00:00.000Z",
      "checkOutDate": "2024-01-17T12:00:00.000Z",
      "totalPrice": 2000,
      "status": "confirmed",
      "paymentStatus": "paid"
    }
  ],
  "total": 50,
  "page": 1,
  "pages": 5
}
```

---

### GET `/user-bookings`
Get current user's bookings.

**Auth Required:** Yes  
**Permission:** `readOwn:booking`

**Response:** `200 OK`
```json
{
  "bookings": [
    {
      "_id": "64a...",
      "room": {
        "roomNumber": "101",
        "roomType": "Standard"
      },
      "checkInDate": "2024-01-15T14:00:00.000Z",
      "checkOutDate": "2024-01-17T12:00:00.000Z",
      "totalPrice": 2000,
      "status": "confirmed"
    }
  ]
}
```

---

### POST `/`
Create a new booking.

**Auth Required:** Yes  
**Permission:** `createOwn:booking`

**Request Body:**
```json
{
  "roomId": "64a...",
  "checkInDate": "2024-01-15",
  "checkOutDate": "2024-01-17",
  "numberOfGuests": 2,
  "guestName": "John Doe",
  "contactNumber": "+1234567890",
  "specialRequests": "Late check-in"
}
```

**Response:** `201 Created`
```json
{
  "message": "Booking created successfully",
  "booking": {
    "_id": "64a...",
    "totalPrice": 2000,
    "status": "pending"
  }
}
```

---

### PUT `/:id/status`
Update booking status (admin only).

**Auth Required:** Yes  
**Permission:** `updateAny:booking`

**Request Body:**
```json
{
  "status": "confirmed"
}
```

**Response:** `200 OK`
```json
{
  "message": "Booking status updated",
  "booking": { ... }
}
```

---

### PUT `/:bookingId/payment`
Update payment status.

**Auth Required:** Yes  
**Permission:** `updateOwn:booking`

**Request Body:**
```json
{
  "paymentStatus": "paid",
  "paymentMethod": "card",
  "transactionId": "txn_123..."
}
```

**Response:** `200 OK`
```json
{
  "message": "Payment status updated",
  "booking": { ... }
}
```

---

### PUT `/:id/checkin`
Check in a guest (admin only).

**Auth Required:** Yes  
**Permission:** `updateAny:booking`

**Request Body:**
```json
{
  "actualCheckInTime": "2024-01-15T14:30:00.000Z"
}
```

**Response:** `200 OK`
```json
{
  "message": "Guest checked in successfully",
  "booking": { ... }
}
```

---

### PUT `/:id/checkout`
Check out a guest (admin only).

**Auth Required:** Yes  
**Permission:** `updateAny:booking`

**Response:** `200 OK`
```json
{
  "message": "Guest checked out successfully",
  "booking": { ... }
}
```

---

### POST `/:id/request-cancel`
Request booking cancellation.

**Auth Required:** Yes  
**Permission:** `updateOwn:booking`

**Request Body:**
```json
{
  "reason": "Change of plans"
}
```

**Response:** `200 OK`
```json
{
  "message": "Cancellation request submitted",
  "booking": { ... }
}
```

---

### POST `/:id/approve-cancel`
Approve cancellation request (admin only).

**Auth Required:** Yes  
**Permission:** `updateAny:booking`

**Response:** `200 OK`
```json
{
  "message": "Cancellation approved",
  "booking": { ... }
}
```

---

### POST `/:id/decline-cancel`
Decline cancellation request (admin only).

**Auth Required:** Yes  
**Permission:** `updateAny:booking`

**Request Body:**
```json
{
  "reason": "Within 24 hours of check-in"
}
```

**Response:** `200 OK`
```json
{
  "message": "Cancellation declined",
  "booking": { ... }
}
```

---

## Feedback

Base path: `/api/feedback`

### POST `/`
Submit feedback.

**Auth Required:** Yes

**Request Body:**
```json
{
  "rating": 5,
  "comment": "Great service!"
}
```

**Response:** `201 Created`
```json
{
  "message": "Feedback submitted successfully",
  "feedback": { ... }
}
```

---

### GET `/my`
Get current user's feedback.

**Auth Required:** Yes

**Response:** `200 OK`
```json
{
  "feedback": [
    {
      "_id": "64a...",
      "rating": 5,
      "comment": "Great service!",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### GET `/`
Get all feedback.

**Auth Required:** Yes

**Response:** `200 OK`
```json
{
  "feedback": [
    {
      "_id": "64a...",
      "rating": 5,
      "comment": "Great service!",
      "user": {
        "firstName": "John",
        "lastName": "Doe"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

## Reports

Base path: `/api/reports`

### GET `/occupancy`
Get occupancy report (admin only).

**Auth Required:** Yes  
**Permission:** `readAny:report`

**Query Parameters:**
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)

**Response:** `200 OK`
```json
{
  "occupancyRate": 75.5,
  "totalRooms": 20,
  "occupiedRooms": 15,
  "dailyOccupancy": [
    { "date": "2024-01-01", "rate": 80 },
    { "date": "2024-01-02", "rate": 70 }
  ]
}
```

---

### GET `/revenue`
Get revenue report (admin only).

**Auth Required:** Yes  
**Permission:** `readAny:report`

**Query Parameters:**
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)

**Response:** `200 OK`
```json
{
  "totalRevenue": 150000,
  "averageDaily": 5000,
  "revenueByRoomType": {
    "Standard": 50000,
    "Deluxe": 60000,
    "Presidential": 40000
  },
  "dailyRevenue": [
    { "date": "2024-01-01", "revenue": 5000 }
  ]
}
```

---

### GET `/bookings`
Get booking analytics (admin only).

**Auth Required:** Yes  
**Permission:** `readAny:report`

**Query Parameters:**
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)

**Response:** `200 OK`
```json
{
  "totalBookings": 100,
  "confirmedBookings": 80,
  "cancelledBookings": 10,
  "pendingBookings": 10,
  "bookingsByStatus": {
    "confirmed": 80,
    "cancelled": 10,
    "pending": 10
  }
}
```

---

### GET `/dashboard`
Get dashboard summary (admin only).

**Auth Required:** Yes  
**Permission:** `readAny:report`

**Response:** `200 OK`
```json
{
  "todayCheckIns": 5,
  "todayCheckOuts": 3,
  "currentOccupancy": 75,
  "pendingBookings": 10,
  "monthlyRevenue": 150000,
  "recentBookings": [ ... ]
}
```

---

### GET `/occupancy/pdf`
Download occupancy report as PDF (admin only).

**Auth Required:** Yes  
**Permission:** `readAny:report`

**Query Parameters:**
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)

**Response:** PDF file download

---

### GET `/revenue/pdf`
Download revenue report as PDF (admin only).

**Auth Required:** Yes  
**Permission:** `readAny:report`

**Query Parameters:**
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)

**Response:** PDF file download

---

### GET `/bookings/pdf`
Download bookings report as PDF (admin only).

**Auth Required:** Yes  
**Permission:** `readAny:report`

**Query Parameters:**
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)

**Response:** PDF file download

---

## Notifications

Base path: `/api/notifications`

### GET `/`
Get user's notifications.

**Auth Required:** Yes

**Response:** `200 OK`
```json
{
  "notifications": [
    {
      "_id": "64a...",
      "title": "Booking Confirmed",
      "message": "Your booking for Room 101 has been confirmed",
      "type": "booking",
      "read": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### POST `/`
Create a notification.

**Auth Required:** Yes

**Request Body:**
```json
{
  "userId": "64a...",
  "title": "Booking Confirmed",
  "message": "Your booking has been confirmed",
  "type": "booking"
}
```

**Response:** `201 Created`
```json
{
  "message": "Notification created",
  "notification": { ... }
}
```

---

### POST `/mark-all-read`
Mark all notifications as read.

**Auth Required:** Yes

**Response:** `200 OK`
```json
{
  "message": "All notifications marked as read"
}
```

---

### POST `/:id/read`
Mark a single notification as read.

**Auth Required:** Yes

**Response:** `200 OK`
```json
{
  "message": "Notification marked as read"
}
```

---

### DELETE `/:id`
Delete a notification.

**Auth Required:** Yes

**Response:** `200 OK`
```json
{
  "message": "Notification deleted"
}
```

---

### GET `/stream`
Server-Sent Events stream for real-time notifications.

**Auth Required:** Yes

**Response:** SSE stream
```
event: notification
data: {"_id": "64a...", "title": "New Booking", "message": "..."}
```

---

## Payments

Base path: `/api/payments`

### POST `/create-checkout-session`
Create a Stripe checkout session.

**Request Body:**
```json
{
  "bookingId": "64a...",
  "amount": 2000,
  "currency": "php"
}
```

**Response:** `200 OK`
```json
{
  "sessionId": "cs_...",
  "url": "https://checkout.stripe.com/..."
}
```

---

### GET `/confirm`
Confirm payment session after Stripe redirect.

**Query Parameters:**
- `session_id`: Stripe session ID

**Response:** `200 OK`
```json
{
  "message": "Payment confirmed",
  "booking": { ... }
}
```

---

## Google Calendar

Base path: `/api/google-calendar`

### GET `/auth-url`
Get Google OAuth authorization URL.

**Auth Required:** Yes

**Response:** `200 OK`
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/..."
}
```

---

### POST `/callback`
Handle Google OAuth callback.

**Auth Required:** Yes

**Request Body:**
```json
{
  "code": "authorization_code_from_google"
}
```

**Response:** `200 OK`
```json
{
  "message": "Google Calendar connected successfully"
}
```

---

### GET `/events`
Get user's Google Calendar events.

**Auth Required:** Yes

**Query Parameters:**
- `timeMin`: Start time (ISO 8601)
- `timeMax`: End time (ISO 8601)
- `maxResults`: Maximum events to return (default: 10)

**Response:** `200 OK`
```json
{
  "events": [
    {
      "id": "event123",
      "summary": "Hotel Booking - Room 101",
      "start": { "dateTime": "2024-01-15T14:00:00Z" },
      "end": { "dateTime": "2024-01-17T12:00:00Z" }
    }
  ]
}
```

---

### POST `/create-event`
Create a Google Calendar event.

**Auth Required:** Yes

**Request Body:**
```json
{
  "bookingId": "64a...",
  "title": "Hotel Booking - Room 101",
  "description": "Booking details...",
  "startTime": "2024-01-15T14:00:00Z",
  "endTime": "2024-01-17T12:00:00Z",
  "roomNumber": "101"
}
```

**Response:** `200 OK`
```json
{
  "message": "Event created successfully",
  "eventId": "event123",
  "event": { ... }
}
```

---

### POST `/sync-booking/:bookingId`
Sync a booking to Google Calendar.

**Auth Required:** Yes

**Response:** `200 OK`
```json
{
  "message": "Booking synced with Google Calendar",
  "eventId": "event123",
  "event": { ... }
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "message": "Validation error message",
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
```

### 401 Unauthorized
```json
{
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "message": "You don't have permission to perform this action"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Server error"
}
```

---

## Rate Limiting

API requests are rate-limited to prevent abuse:
- **General endpoints:** 100 requests per minute
- **Authentication endpoints:** 10 requests per minute

---

## CORS

The API supports CORS for the following origins:
- `http://localhost:5173` (development)
- Production domain (configured via `CLIENT_ORIGIN` env variable)

---

## Environment Variables

Required environment variables for the backend:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/redboat
JWT_SECRET=your_jwt_secret
CLIENT_ORIGIN=http://localhost:5173
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password
```
