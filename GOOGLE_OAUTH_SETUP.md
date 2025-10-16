# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for your WebProj application.

## Prerequisites

1. A Google Cloud Console account
2. A Google Cloud Project

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note down your project ID

## Step 2: Enable Required APIs

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for and enable the following APIs:
   - "Google+ API" (for authentication)
   - "Google Identity" API (for authentication)
   - "Google Calendar API" (for calendar integration)

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application" as the application type
4. Add authorized JavaScript origins:
   - `http://localhost:5173` (for development)
   - `http://localhost:3000` (if using different port)
   - Your production domain (when deploying)
5. Add authorized redirect URIs:
   - `http://localhost:5173` (for development)
   - `http://localhost:5173/auth/google/callback` (for Google Calendar OAuth)
   - Your production domain (when deploying)
6. Click "Create"
7. Copy the Client ID and Client Secret (you'll need both for your environment variables)

## Step 4: Configure Environment Variables

### Backend (.env file)
Add the following to your backend `.env` file:
```
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

### Frontend (.env file)
Create a `.env` file in your frontend directory with:
```
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

**Important:** Make sure to use the same Client ID for both frontend and backend.

## Step 5: Test the Integration

1. Start your backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Start your frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

3. Navigate to `http://localhost:5173`
4. Try logging in with Google OAuth

## Features Implemented

✅ **Login Page**: Google OAuth button integrated
✅ **Signup Page**: Google OAuth button integrated  
✅ **Backend Integration**: Google token verification
✅ **User Creation**: Automatic user creation for new Google users
✅ **Session Management**: JWT token-based authentication
✅ **Role-based Routing**: Admin vs User dashboard routing
✅ **Google Calendar Integration**: Calendar API with OAuth2
✅ **Calendar Sync**: Automatic booking sync with Google Calendar
✅ **Event Management**: Create and view Google Calendar events

## How It Works

1. **Frontend**: Google OAuth button initializes with your Client ID
2. **User Clicks**: Google popup opens for authentication
3. **Google Returns**: ID token to the frontend
4. **Frontend Sends**: ID token to backend `/google-login` endpoint
5. **Backend Verifies**: Token with Google's servers
6. **Backend Creates/Updates**: User in database
7. **Backend Returns**: JWT token and user data
8. **Frontend Redirects**: User to appropriate dashboard

## Google Calendar Integration

### Features
- **Connect Google Calendar**: Users can connect their Google Calendar account
- **View Events**: Display Google Calendar events on the room calendar
- **Sync Bookings**: Automatically create Google Calendar events for hotel bookings
- **Event Management**: View and manage calendar events directly from the app

### How to Use
1. **Connect Calendar**: Click "Connect Google Calendar" button in the calendar view
2. **Authorize Access**: Grant permissions for calendar read/write access
3. **View Events**: Google Calendar events will appear on the room calendar with 📅 indicators
4. **Sync Bookings**: When creating bookings, they can be automatically synced to Google Calendar
5. **Event Details**: Click on dates with events to see Google Calendar event details

### API Endpoints
- `GET /google-calendar/auth-url` - Get Google Calendar authorization URL
- `POST /google-calendar/callback` - Handle OAuth callback
- `GET /google-calendar/events` - Fetch user's Google Calendar events
- `POST /google-calendar/create-event` - Create new calendar event
- `POST /google-calendar/sync-booking/:bookingId` - Sync booking with Google Calendar

## Troubleshooting

### Common Issues

1. **"Google OAuth not configured" warning**
   - Make sure `VITE_GOOGLE_CLIENT_ID` is set in your frontend `.env` file
   - Restart your development server after adding environment variables

2. **"Invalid origin" error**
   - Check that your domain is added to authorized JavaScript origins in Google Console
   - Make sure the protocol (http/https) matches

3. **"Invalid client" error**
   - Verify the Client ID is correct in both frontend and backend
   - Make sure the Client ID is from the correct Google Cloud project

4. **CORS errors**
   - Ensure your backend CORS configuration includes your frontend URL
   - Check that credentials are included in requests

### Development vs Production

- **Development**: Use `http://localhost:5173` in authorized origins
- **Production**: Replace with your actual domain
- **HTTPS**: Production should use HTTPS for security

## Security Notes

- Never commit your `.env` files to version control
- Use different Client IDs for development and production
- Regularly rotate your OAuth credentials
- Monitor your Google Cloud Console for unusual activity

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Identity Services](https://developers.google.com/identity/gsi/web)
- [Google Cloud Console](https://console.cloud.google.com/)
