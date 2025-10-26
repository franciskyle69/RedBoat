import { Router } from 'express';
import { Request, Response } from 'express';
import { User } from '../models/User';
import { Booking } from '../models/Booking';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";

// Google Calendar API setup
const { google } = require('googleapis');
const oauth2Client = new google.auth.OAuth2(
  googleClientId,
  googleClientSecret,
  `${clientOrigin}/auth/google/callback`
);

// Get Google Calendar authorization URL
router.get('/auth-url', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  try {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });

    res.json({ authUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}));

// Handle Google Calendar OAuth callback
router.post('/callback', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    const payload = (req as any).user as { sub: string; email: string; role?: string };
    
    if (!code) {
      return res.status(400).json({ message: "Authorization code is required" });
    }

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Save tokens to user
    await User.findByIdAndUpdate(payload.sub, {
      googleCalendarTokens: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null
      }
    });

    res.json({ message: "Google Calendar connected successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}));

// Get user's Google Calendar events
router.get('/events', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  try {
    const payload = (req as any).user as { sub: string; email: string; role?: string };
    const user = await User.findById(payload.sub);
    
    if (!user || !user.googleCalendarTokens?.accessToken) {
      return res.status(400).json({ message: "Google Calendar not connected" });
    }

    // Set credentials from stored tokens
    oauth2Client.setCredentials({
      access_token: user.googleCalendarTokens.accessToken,
      refresh_token: user.googleCalendarTokens.refreshToken,
      expiry_date: user.googleCalendarTokens.expiryDate?.getTime()
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const { timeMin, timeMax, maxResults = 10 } = req.query;
    
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin as string || new Date().toISOString(),
      timeMax: timeMax as string,
      maxResults: parseInt(maxResults as string),
      singleEvents: true,
      orderBy: 'startTime',
    });

    res.json({ events: response.data.items || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}));

// Create Google Calendar event for booking
router.post('/create-event', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  try {
    const payload = (req as any).user as { sub: string; email: string; role?: string };
    const { bookingId, title, description, startTime, endTime, roomNumber } = req.body;
    
    const user = await User.findById(payload.sub);
    
    if (!user || !user.googleCalendarTokens?.accessToken) {
      return res.status(400).json({ message: "Google Calendar not connected" });
    }

    // Set credentials from stored tokens
    oauth2Client.setCredentials({
      access_token: user.googleCalendarTokens.accessToken,
      refresh_token: user.googleCalendarTokens.refreshToken,
      expiry_date: user.googleCalendarTokens.expiryDate?.getTime()
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const event = {
      summary: title || `Hotel Booking - Room ${roomNumber}`,
      description: description || `Hotel booking for Room ${roomNumber}`,
      start: {
        dateTime: startTime,
        timeZone: 'UTC',
      },
      end: {
        dateTime: endTime,
        timeZone: 'UTC',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 60 }, // 1 hour before
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    // Update booking with Google Calendar event ID
    if (bookingId) {
      await Booking.findByIdAndUpdate(bookingId, {
        googleCalendarEventId: response.data.id
      });
    }

    res.json({ 
      message: "Event created successfully", 
      eventId: response.data.id,
      event: response.data
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}));

// Sync booking with Google Calendar
router.post('/sync-booking/:bookingId', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const payload = (req as any).user as { sub: string; email: string; role?: string };
    
    const booking = await Booking.findById(bookingId)
      .populate('room', 'roomNumber roomType')
      .populate('user', 'firstName lastName email');
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const user = await User.findById(payload.sub);
    
    if (!user || !user.googleCalendarTokens?.accessToken) {
      return res.status(400).json({ message: "Google Calendar not connected" });
    }

    // Set credentials from stored tokens
    oauth2Client.setCredentials({
      access_token: user.googleCalendarTokens.accessToken,
      refresh_token: user.googleCalendarTokens.refreshToken,
      expiry_date: user.googleCalendarTokens.expiryDate?.getTime()
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const event = {
      summary: `Hotel Booking - Room ${(booking.room as any).roomNumber}`,
      description: `Hotel booking for ${(booking.room as any).roomType} room ${(booking.room as any).roomNumber}\nGuest: ${(booking.user as any).firstName} ${(booking.user as any).lastName}\nStatus: ${booking.status}`,
      start: {
        dateTime: booking.checkInDate.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: booking.checkOutDate.toISOString(),
        timeZone: 'UTC',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 60 }, // 1 hour before
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    // Update booking with Google Calendar event ID
    await Booking.findByIdAndUpdate(bookingId, {
      googleCalendarEventId: response.data.id
    });

    res.json({ 
      message: "Booking synced with Google Calendar", 
      eventId: response.data.id,
      event: response.data
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}));

export default router;
