import { Response } from 'express';
import mongoose from 'mongoose';
import { Booking } from '../models/Booking';
import { Room } from '../models/Room';
import { NotificationController } from './notificationController';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth';
import { sendAppEmail, buildBookingSummaryHtml, BookingSummaryDetails, buildChargeBreakdownHtml, getBookingReference } from '../services/emailService';
import { calculateBookingPricing } from '../services/bookingService';
import { logActivity } from '../services/activityLogService';

const formatDateShort = (date: Date | string | undefined): string | undefined => {
  if (!date) return undefined;
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString();
};

const buildBookingSummary = (booking: any, overrides: Partial<BookingSummaryDetails> = {}): string => {
  const room: any = booking.room;
  const roomLabel = room
    ? `Room ${room.roomNumber}${room.roomType ? ` • ${room.roomType}` : ''}`
    : undefined;

  let nights: number | undefined;
  if (booking.checkInDate && booking.checkOutDate) {
    const inDate = new Date(booking.checkInDate);
    const outDate = new Date(booking.checkOutDate);
    if (!Number.isNaN(inDate.getTime()) && !Number.isNaN(outDate.getTime())) {
      nights = Math.ceil((outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24));
    }
  }

  const totalAmount = booking.totalAmount != null
    ? `₱${Number(booking.totalAmount).toFixed(2)}`
    : undefined;

  const base: BookingSummaryDetails = {
    reference: booking._id ? getBookingReference(String(booking._id)) : undefined,
    room: roomLabel,
    checkIn: formatDateShort(booking.checkInDate),
    checkOut: formatDateShort(booking.checkOutDate),
    nights,
    guests: booking.numberOfGuests,
    totalAmount,
    bookingStatus: booking.status,
    paymentStatus: booking.paymentStatus,
  };

  return buildBookingSummaryHtml({ ...base, ...overrides });
};

export class BookingController {
  // Get all bookings (admin only). Expires pending bookings past TTL and returns pending duration info.
  static async getAllBookings(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;

      if (payload.role !== "admin" && payload.role !== "superadmin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const now = new Date();
      await Booking.updateMany(
        { status: "pending", pendingExpiresAt: { $lt: now } },
        { $set: { status: "cancelled", updatedAt: now } }
      );

      const bookings = await Booking.find({})
        .populate("user", "username")
        .populate("room", "roomNumber roomType price")
        .sort({ createdAt: -1 })
        .lean();

      const data = bookings.map((b: any) => {
        const doc = { ...b };
        if (b.status === "pending" && b.pendingSince) {
          const since = new Date(b.pendingSince).getTime();
          doc.pendingDurationMinutes = Math.floor((now.getTime() - since) / (60 * 1000));
          if (b.pendingExpiresAt) {
            const expires = new Date(b.pendingExpiresAt).getTime();
            doc.pendingExpiresInMinutes = Math.max(0, Math.floor((expires - now.getTime()) / (60 * 1000)));
          }
        }
        return doc;
      });

      res.json({
        message: "Bookings fetched successfully",
        data,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        message: "Server error",
        details: err instanceof Error ? err.message : "An unexpected error occurred",
      });
    }
  }

  // Get bookings for a specific user
  static async getUserBookings(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      
      const bookings = await Booking.find({ user: payload.sub })
        .populate("room", "roomNumber roomType price")
        .sort({ createdAt: -1 });

      res.json({
        message: "User bookings fetched successfully",
        data: bookings,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        message: "Server error",
        details: err instanceof Error ? err.message : "An unexpected error occurred",
      });
    }
  }

  // Create a new booking
  static async createBooking(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      const { roomId, checkInDate, checkOutDate, numberOfGuests, specialRequests, guestName, contactNumber } = req.body;

      if (!roomId || !checkInDate || !checkOutDate || !numberOfGuests || !guestName || !contactNumber) {
        return res.status(400).json({ message: "Room ID, guest name, contact number, check-in date, check-out date, and number of guests are required" });
      }

      // Check if room exists and is available
      const room = await Room.findById(roomId);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      if (!room.isAvailable) {
        return res.status(400).json({ message: "Room is not available" });
      }

      // Check for date conflicts
      const conflictingBooking = await Booking.findOne({
        room: roomId,
        status: { $in: ["confirmed", "checked-in"] },
        $or: [
          {
            checkInDate: { $lte: new Date(checkOutDate) },
            checkOutDate: { $gte: new Date(checkInDate) }
          }
        ]
      });

      if (conflictingBooking) {
        return res.status(400).json({ message: "Room is not available for the selected dates" });
      }

      // Calculate total amount (including extra person charges)
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);

      const pricing = calculateBookingPricing({
        roomPrice: room.price,
        capacity: room.capacity,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numberOfGuests,
      });

      const booking = new Booking({
        user: payload.sub,
        room: roomId,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numberOfGuests,
        totalAmount: pricing.totalAmount,
        guestName,
        contactNumber,
        specialRequests
      });

      const savedBooking = await booking.save();
      await savedBooking.populate("room", "roomNumber roomType price");

      // Notify user (booking received)
      await NotificationController.createForUser(payload.sub, 'success', 'Booking request submitted. Awaiting confirmation.', '/user/bookings');

      // Notify all admins about new booking request and email user/admins
      try {
        const userDoc = await User.findById(payload.sub).select('username firstName lastName email emailNotifications');
        const displayName =
          userDoc?.username ||
          `${userDoc?.firstName || ''} ${userDoc?.lastName || ''}`.trim() ||
          userDoc?.email ||
          'A user';
        const roomNum = (savedBooking as any).room?.roomNumber;
        const nightsForMsg = Math.ceil(
          (new Date(savedBooking.checkOutDate).getTime() - new Date(savedBooking.checkInDate).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        const message = `${displayName} created a new booking request for Room ${roomNum} (${nightsForMsg} night${
          nightsForMsg > 1 ? 's' : ''
        }).`;

        const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
        const userBookingsLink = `${clientOrigin}/user/bookings`;
        const adminBookingsLink = `${clientOrigin}/admin/bookings`;

        // Email user (booking request received) if they enabled email notifications
        if (userDoc?.email && userDoc.emailNotifications !== false) {
          const subject = 'Booking request received';
          const summaryHtml = buildBookingSummary(savedBooking, {
            guestName: guestName || displayName,
            bookingStatus: 'Pending approval',
            paymentStatus: savedBooking.paymentStatus || 'pending',
          });
          const bodyHtml = `
            <p>Hi ${displayName},</p>
            <p>Your booking request for Room ${roomNum} (${nightsForMsg} night${nightsForMsg > 1 ? 's' : ''}) has been received and is pending approval.</p>
            ${summaryHtml}
            <p style="margin-top:12px;">Next steps:</p>
            <ol style="margin:4px 0 12px 20px;padding:0;color:#334155;font-size:14px;">
              <li>An admin will review your request and either confirm or decline it.</li>
              <li>Once confirmed, you can complete payment from your bookings page.</li>
              <li>You will receive another email when the status changes.</li>
            </ol>
            <p>You can review your booking details here:</p>
            <p><a href="${userBookingsLink}">View my bookings</a></p>
          `;

          try {
            await sendAppEmail(userDoc.email, subject, bodyHtml);
          } catch (err) {
            console.error('Failed to send booking received email to user:', err);
          }
        }

        // Email admins and superadmins about the new booking
        const admins = await User.find({ role: { $in: ['admin', 'superadmin'] } }).select('_id email emailNotifications username');
        await Promise.all(
          admins.map(async (a) => {
            await NotificationController.createForUser(
              (a as any)._id.toString(),
              'info',
              message,
              '/admin/bookings'
            );

            const adminEmail = (a as any).email as string | undefined;
            const adminEmailPref = (a as any).emailNotifications as boolean | undefined;
            const adminName = (a as any).username || 'Admin';
            if (adminEmail && adminEmailPref !== false) {
              const subject = '🔔 New Booking Request - Action Required';
              const summaryHtml = buildBookingSummary(savedBooking, {
                guestName: guestName || displayName,
              });
              const bodyHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0;">
                    <h2 style="color: white; margin: 0; font-size: 20px;">New Booking Request</h2>
                  </div>
                  <div style="background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
                    <p style="margin: 0 0 16px 0; color: #334155;">Hi ${adminName},</p>
                    <p style="margin: 0 0 16px 0; color: #334155;">${message}</p>
                    
                    <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 12px; margin-bottom: 16px;">
                      <strong style="color: #856404;">⚠️ Action Required:</strong>
                      <span style="color: #856404;"> Please review and approve or decline this booking.</span>
                    </div>
                    
                    ${summaryHtml}
                    ${specialRequests ? `<p style="margin-top: 12px;"><strong>Special requests:</strong> ${specialRequests}</p>` : ''}
                    
                    <div style="margin-top: 20px; text-align: center;">
                      <a href="${adminBookingsLink}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">Review Booking</a>
                    </div>
                  </div>
                </div>
              `;
              try {
                await sendAppEmail(adminEmail, subject, bodyHtml);
              } catch (err) {
                console.error('Failed to send booking created email to admin:', err);
              }
            }
          })
        );
      } catch (e) {
        console.error('Failed to notify admins of new booking:', e);
      }

      res.status(201).json({ 
        message: "Booking created successfully", 
        data: savedBooking 
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        message: "Server error",
        details: err instanceof Error ? err.message : "An unexpected error occurred",
      });
    }
  }

  // Update booking status (admin only)
  static async updateBookingStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      
      if (payload.role !== "admin" && payload.role !== "superadmin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { status, adminNotes } = req.body;
      const bookingId = req.params.id;

      if (!status || !["pending", "confirmed", "checked-in", "checked-out", "cancelled"].includes(status)) {
        return res.status(400).json({ message: "Valid status is required" });
      }

      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      booking.status = status;
      if (adminNotes) {
        booking.adminNotes = adminNotes;
      }
      booking.updatedAt = new Date();

      await booking.save();
      await booking.populate("user", "username email firstName lastName emailNotifications");
      await booking.populate("room", "roomNumber roomType price");

      // Notify user on key status changes (in-app + optional email)
      try {
        const userId = (booking.user as any)._id?.toString?.() || booking.user.toString();
        const userDoc: any = booking.user;
        const roomNum = (booking.room as any).roomNumber;
        const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
        const userBookingsLink = `${clientOrigin}/user/bookings`;

        if (status === 'confirmed') {
          const msg = `Your booking for Room ${roomNum} is confirmed.`;
          await NotificationController.createForUser(
            userId,
            'success',
            msg,
            '/user/bookings'
          );

          if (userDoc?.email && userDoc.emailNotifications !== false) {
            const subject = 'Booking confirmed';
            const summaryHtml = buildBookingSummary(booking, {
              guestName: userDoc.firstName || userDoc.username || userDoc.email,
              bookingStatus: 'Confirmed',
            });
            const bodyHtml = `
              <p>Hi ${userDoc.firstName || userDoc.username || ''},</p>
              <p>${msg}</p>
              ${summaryHtml}
              <p style="margin-top:12px;">Next steps:</p>
              <ol style="margin:4px 0 12px 20px;padding:0;color:#334155;font-size:14px;">
                <li>If your payment status is still pending, please complete payment from your bookings page.</li>
                <li>Bring a valid ID and your booking reference when you check in.</li>
              </ol>
              <p><a href="${userBookingsLink}">View your booking</a></p>
            `;
            try {
              await sendAppEmail(userDoc.email, subject, bodyHtml);
            } catch (err) {
              console.error('Failed to send booking confirmed email:', err);
            }
          }
        } else if (status === 'cancelled') {
          const msg = `Your booking was cancelled${adminNotes ? `: ${adminNotes}` : ''}.`;
          await NotificationController.createForUser(
            userId,
            'warning',
            msg,
            '/user/bookings'
          );

          if (userDoc?.email && userDoc.emailNotifications !== false) {
            const subject = 'Booking cancelled';
            const summaryHtml = buildBookingSummary(booking, {
              guestName: userDoc.firstName || userDoc.username || userDoc.email,
              bookingStatus: 'Cancelled',
            });
            const bodyHtml = `
              <p>Hi ${userDoc.firstName || userDoc.username || ''},</p>
              <p>${msg}</p>
              ${summaryHtml}
              <p style="margin-top:12px;">If you believe this was a mistake, please contact the front desk or support.</p>
              <p><a href="${userBookingsLink}">View your bookings</a></p>
            `;
            try {
              await sendAppEmail(userDoc.email, subject, bodyHtml);
            } catch (err) {
              console.error('Failed to send booking cancelled email:', err);
            }
          }
        } else if (status === 'pending') {
          await NotificationController.createForUser(
            userId,
            'info',
            `Your booking status was updated to pending.`,
            '/user/bookings'
          );
        }
      } catch (e) {
        console.error('Failed to send status notification:', e);
      }

      res.json({ 
        message: "Booking status updated successfully", 
        data: booking 
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        message: "Server error",
        details: err instanceof Error ? err.message : "An unexpected error occurred",
      });
    }
  }

  // Request cancellation (user)
  static async requestCancellation(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      const bookingId = req.params.id;
      const { reason } = req.body as { reason?: string };

      const booking = await Booking.findById(bookingId)
        .populate("user", "username firstName lastName email emailNotifications")
        .populate("room", "roomNumber roomType");
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Only the owner can request cancellation
      if ((booking.user as any)._id.toString() !== payload.sub) {
        return res.status(403).json({ message: "Not authorized to cancel this booking" });
      }

      // Only pending or confirmed bookings can request cancellation
      if (!['pending', 'confirmed'].includes(booking.status)) {
        return res.status(400).json({ message: "Only pending or confirmed bookings can be cancelled" });
      }

      booking.cancellationRequested = true;
      if (reason) booking.cancellationReason = reason;
      booking.updatedAt = new Date();
      await booking.save();

      const userDoc: any = booking.user;
      const displayName = userDoc?.username || `${userDoc?.firstName || ''} ${userDoc?.lastName || ''}`.trim() || userDoc?.email || 'A user';
      const roomInfo = (booking as any).room ? `Room ${(booking as any).room.roomNumber}` : 'a room';

      // Notify admins of the cancellation request (in-app + email)
      const admins = await User.find({ role: 'admin' }).select('_id email emailNotifications');
      const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
      const adminBookingsLink = `${clientOrigin}/admin/bookings`;
      const adminMessage = `${displayName} requested a cancellation for ${roomInfo}.`;

      await Promise.all(
        admins.map(async (a) => {
          await NotificationController.createForUser((a as any)._id.toString(), 'warning', adminMessage, '/admin/bookings');

          const adminEmail = (a as any).email as string | undefined;
          const adminEmailPref = (a as any).emailNotifications as boolean | undefined;
          if (adminEmail && adminEmailPref !== false) {
            const subject = 'Booking cancellation requested';
            const bodyHtml = `
              <p>${adminMessage}</p>
              <p><a href="${adminBookingsLink}">Review booking in admin panel</a></p>
            `;
            try {
              await sendAppEmail(adminEmail, subject, bodyHtml);
            } catch (err) {
              console.error('Failed to send cancellation request email to admin:', err);
            }
          }
        })
      );

      // Optional email acknowledgement to the user
      if (userDoc?.email && userDoc.emailNotifications !== false) {
        const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
        const userBookingsLink = `${clientOrigin}/user/bookings`;
        const subject = 'Cancellation request received';
        const summaryHtml = buildBookingSummary(booking, {
          guestName: displayName,
          bookingStatus: booking.status,
        });
        const bodyHtml = `
          <p>Hi ${displayName},</p>
          <p>We received your cancellation request for ${roomInfo}.</p>
          ${reason ? `<p><strong>Your reason:</strong> ${reason}</p>` : ''}
          ${summaryHtml}
          <p style="margin-top:12px;">What happens next:</p>
          <ol style="margin:4px 0 12px 20px;padding:0;color:#334155;font-size:14px;">
            <li>An admin will review your request.</li>
            <li>You will receive an email once the request is approved or declined.</li>
          </ol>
          <p>You can review your bookings here:</p>
          <p><a href="${userBookingsLink}">View my bookings</a></p>
        `;
        try {
          await sendAppEmail(userDoc.email, subject, bodyHtml);
        } catch (err) {
          console.error('Failed to send cancellation request email to user:', err);
        }
      }

      res.json({ message: "Cancellation request submitted", data: booking });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        message: "Server error",
        details: err instanceof Error ? err.message : "An unexpected error occurred",
      });
    }
  }

  // Approve cancellation (admin)
  static async approveCancellation(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      if (payload.role !== 'admin' && payload.role !== 'superadmin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const bookingId = req.params.id;
      const booking = await Booking.findById(bookingId).populate('user', 'email emailNotifications username firstName lastName');
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }
      if (!booking.cancellationRequested) {
        return res.status(400).json({ message: 'No cancellation request to approve' });
      }

      booking.status = 'cancelled';
      booking.cancellationRequested = false;
      booking.updatedAt = new Date();
      await booking.save();

      // Notify user (in-app + optional email)
      await NotificationController.createForUser((booking.user as any)._id.toString(), 'success', 'Your booking cancellation was approved.', '/user/bookings');

      const userDoc: any = booking.user;
      const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
      const userBookingsLink = `${clientOrigin}/user/bookings`;
      if (userDoc?.email && userDoc.emailNotifications !== false) {
        const subject = 'Booking cancellation approved';
        const summaryHtml = buildBookingSummary(booking, {
          guestName: userDoc.firstName || userDoc.username || userDoc.email,
          bookingStatus: 'Cancelled',
        });
        const bodyHtml = `
          <p>Hi ${userDoc.firstName || userDoc.username || ''},</p>
          <p>Your booking cancellation was approved.</p>
          ${summaryHtml}
          <p style="margin-top:12px;">If you prepaid, any applicable refunds will be processed according to our policy.</p>
          <p><a href="${userBookingsLink}">View your bookings</a></p>
        `;
        try {
          await sendAppEmail(userDoc.email, subject, bodyHtml);
        } catch (err) {
          console.error('Failed to send cancellation approved email to user:', err);
        }
      }

      res.json({ message: 'Cancellation approved', data: booking });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        message: 'Server error',
        details: err instanceof Error ? err.message : 'An unexpected error occurred',
      });
    }
  }

  // Decline cancellation (admin)
  static async declineCancellation(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      if (payload.role !== 'admin' && payload.role !== 'superadmin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const bookingId = req.params.id;
      const { adminNotes } = req.body as { adminNotes?: string };
      const booking = await Booking.findById(bookingId).populate('user', 'email emailNotifications username firstName lastName');
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }
      if (!booking.cancellationRequested) {
        return res.status(400).json({ message: 'No cancellation request to decline' });
      }

      booking.cancellationRequested = false;
      if (adminNotes) booking.adminNotes = adminNotes;
      booking.updatedAt = new Date();
      await booking.save();

      // Notify user (in-app + optional email)
      const notifMessage = 'Your cancellation request was declined.';
      await NotificationController.createForUser((booking.user as any)._id.toString(), 'warning', notifMessage, '/user/bookings');

      const userDoc: any = booking.user;
      const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
      const userBookingsLink = `${clientOrigin}/user/bookings`;
      if (userDoc?.email && userDoc.emailNotifications !== false) {
        const subject = 'Booking cancellation declined';
        const reasonText = adminNotes ? `: ${adminNotes}` : '.';
        const summaryHtml = buildBookingSummary(booking, {
          guestName: userDoc.firstName || userDoc.username || userDoc.email,
        });
        const bodyHtml = `
          <p>Hi ${userDoc.firstName || userDoc.username || ''},</p>
          <p>Your cancellation request was declined${reasonText}</p>
          ${summaryHtml}
          <p style="margin-top:12px;">If you have questions about this decision, please contact the front desk or support.</p>
          <p><a href="${userBookingsLink}">View your bookings</a></p>
        `;
        try {
          await sendAppEmail(userDoc.email, subject, bodyHtml);
        } catch (err) {
          console.error('Failed to send cancellation declined email to user:', err);
        }
      }

      res.json({ message: 'Cancellation declined', data: booking });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        message: 'Server error',
        details: err instanceof Error ? err.message : 'An unexpected error occurred',
      });
    }
  }

  // Check-in booking - Detailed approach
  static async checkInBooking(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      const { checkinNotes, additionalCharges } = req.body as { checkinNotes?: string; additionalCharges?: number };
      
      // Step 1: Verify admin authorization
      if (payload.role !== "admin" && payload.role !== "superadmin") {
        return res.status(403).json({ 
          message: "Admin access required",
          details: "Only administrators can perform check-in operations"
        });
      }

      const bookingId = req.params.id;

      const session = await mongoose.startSession();
      let booking: any;
      let room: any;
      let now: Date;
      let scheduledCheckIn: Date;
      let daysDifference: number;
      let lateCheckInFee = 0;
      let actualCheckInTime: Date;

      try {
        // Step 2: Fetch booking with all related data (no multi-document transaction)
        booking = await Booking.findById(bookingId)
          .populate("user", "username email firstName lastName phoneNumber")
          .populate("room", "roomNumber roomType price capacity amenities isAvailable housekeepingStatus")
          .session(session);
        
        if (!booking) {
          await session.abortTransaction();
          return res.status(404).json({ 
            message: "Booking not found",
            details: `No booking found with ID: ${bookingId}`
          });
        }

        // Step 3: Validate booking status
        if (booking.status === "checked-in") {
          await session.abortTransaction();
          return res.status(400).json({ 
            message: "Guest is already checked in",
            details: `Guest was checked in on ${booking.actualCheckInTime ? new Date(booking.actualCheckInTime).toLocaleString() : 'previously'}`,
            currentStatus: booking.status
          });
        }

        if (booking.status !== "confirmed") {
          await session.abortTransaction();
          return res.status(400).json({ 
            message: "Invalid booking status for check-in",
            details: `Only confirmed bookings can be checked in. Current status: ${booking.status}`,
            allowedStatuses: ["confirmed"]
          });
        }

        // Step 4: Verify payment status
        if (booking.paymentStatus !== "paid") {
          await session.abortTransaction();
          return res.status(400).json({ 
            message: "Payment required before check-in",
            details: `Payment status is: ${booking.paymentStatus}. Payment must be completed before check-in.`,
            currentPaymentStatus: booking.paymentStatus,
            requiredPaymentStatus: "paid"
          });
        }

        // Step 5: Validate check-in date timing
        now = new Date();
        scheduledCheckIn = new Date(booking.checkInDate);
        daysDifference = Math.floor((now.getTime() - scheduledCheckIn.getTime()) / (1000 * 60 * 60 * 24));
        
        // Allow check-in up to 1 day before or on the scheduled date (flexibility for early/late arrivals)
        const EARLY_CHECKIN_DAYS = 1;
        if (daysDifference < -EARLY_CHECKIN_DAYS) {
          await session.abortTransaction();
          return res.status(400).json({ 
            message: "Check-in too early",
            details: `Scheduled check-in is on ${scheduledCheckIn.toLocaleDateString()}. Early check-in is allowed up to ${EARLY_CHECKIN_DAYS} day(s) before.`,
            scheduledCheckIn: scheduledCheckIn.toISOString(),
            currentDate: now.toISOString()
          });
        }

        // Step 6: Verify room availability and status
        room = await Room.findById(booking.room).session(session);
        if (!room) {
          await session.abortTransaction();
          return res.status(404).json({ 
            message: "Room not found",
            details: "The room assigned to this booking no longer exists"
          });
        }

        if (!room.isAvailable) {
          await session.abortTransaction();
          return res.status(400).json({ 
            message: "Room is not available",
            details: "The assigned room is currently marked as unavailable",
            roomStatus: {
              isAvailable: room.isAvailable,
              housekeepingStatus: room.housekeepingStatus
            }
          });
        }

        if (room.housekeepingStatus !== "clean") {
          await session.abortTransaction();
          return res.status(400).json({ 
            message: "Room not ready for check-in",
            details: `Room housekeeping status: ${room.housekeepingStatus}. Room must be clean before check-in.`,
            currentHousekeepingStatus: room.housekeepingStatus,
            requiredStatus: "clean"
          });
        }

        // Step 7: Check for conflicting bookings
        const conflictingBooking = await Booking.findOne({
          _id: { $ne: bookingId },
          room: booking.room,
          status: { $in: ["confirmed", "checked-in"] },
          $or: [
            {
              checkInDate: { $lte: booking.checkOutDate },
              checkOutDate: { $gte: booking.checkInDate }
            }
          ]
        }).session(session);

        if (conflictingBooking) {
          await session.abortTransaction();
          return res.status(400).json({ 
            message: "Room conflict detected",
            details: "Another active booking exists for this room during the same period",
            conflictingBookingId: conflictingBooking._id
          });
        }

        // Step 8: Calculate late check-in fee if applicable
        let lateCheckInFeeLocal = 0;
        const checkInTime = new Date(booking.checkInDate);
        checkInTime.setHours(15, 0, 0, 0); // Standard check-in time: 3:00 PM
        
        if (now > checkInTime) {
          const hoursLate = Math.ceil((now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60));
          // ₱10 per hour after standard check-in time, max ₱50
          lateCheckInFeeLocal = Math.min(hoursLate * 10, 50);
        }

        lateCheckInFee = lateCheckInFeeLocal;

        // Step 9: Perform check-in
        actualCheckInTime = new Date();
        booking.status = "checked-in";
        booking.actualCheckInTime = actualCheckInTime;
        booking.checkedInBy = payload.sub as any;
        booking.lateCheckInFee = lateCheckInFee;
        booking.updatedAt = actualCheckInTime;

        if (checkinNotes) {
          booking.adminNotes = checkinNotes;
        }

        if (additionalCharges && additionalCharges > 0) {
          booking.additionalCharges = (booking.additionalCharges || 0) + additionalCharges;
        }

        await booking.save({ session });

        // Step 10: Update room status
        room.isAvailable = false;
        room.housekeepingStatus = "dirty"; // Room becomes occupied
        room.updatedAt = new Date();
        await room.save({ session });
      } catch (err) {
        if (session.inTransaction()) {
          await session.abortTransaction();
        }
        throw err;
      } finally {
        session.endSession();
      }

      // Step 11: Populate booking data for response
      await booking.populate("user", "username email firstName lastName phoneNumber emailNotifications");
      await booking.populate("room", "roomNumber roomType price capacity amenities");
      await booking.populate("checkedInBy", "username email firstName lastName");

      const populatedUser: any = booking.user || {};
      const populatedRoom: any = booking.room || {};

      // Step 12: Send notification to user (do not let failures break check-in)
      const roomNumberForMessage = populatedRoom.roomNumber || 'N/A';
      const checkInMessage = `You have been checked in! Room: ${roomNumberForMessage}. Check-in time: ${actualCheckInTime.toLocaleString()}`;

      if (populatedUser && populatedUser._id) {
        try {
          await NotificationController.createForUser(
            populatedUser._id.toString(),
            'success',
            checkInMessage,
            '/user/bookings'
          );
        } catch (err) {
          console.error('[CHECK-IN NOTIFICATION ERROR]', err);
        }
      }

      const checkInUser: any = booking.user;
      if (checkInUser?.email && checkInUser.emailNotifications !== false) {
        const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
        const userBookingsLink = `${clientOrigin}/user/bookings`;
        const subject = 'You have been checked in';
        const summaryHtml = buildBookingSummary(booking, {
          guestName: checkInUser.firstName || checkInUser.username || checkInUser.email,
          bookingStatus: 'Checked in',
        });
        const bodyHtml = `
          <p>Hi ${checkInUser.firstName || checkInUser.username || ''},</p>
          <p>${checkInMessage}</p>
          ${summaryHtml}
          <p style="margin-top:12px;">If any additional charges were applied at check-in, these will appear in your final bill.</p>
          <p><a href="${userBookingsLink}">View your bookings</a></p>
        `;
        try {
          await sendAppEmail(checkInUser.email, subject, bodyHtml);
        } catch (err) {
          console.error('Failed to send check-in email to user:', err);
        }
      }

      // Step 13: Log check-in activity
      const userEmailForLog = populatedUser.email || 'unknown';
      const roomNumberForLog = populatedRoom.roomNumber || 'unknown';
      const adminEmailForLog = payload.email || 'unknown';
      const actualCheckInIsoForLog =
        actualCheckInTime instanceof Date && !Number.isNaN(actualCheckInTime.getTime())
          ? actualCheckInTime.toISOString()
          : '';

      console.log(
        `[CHECK-IN] Booking ${bookingId} - User: ${userEmailForLog} - Room: ${roomNumberForLog} - Admin: ${adminEmailForLog} - Time: ${actualCheckInIsoForLog}` +
          (lateCheckInFee > 0 ? ` - Late Fee: ₱${lateCheckInFee}` : '')
      );

      // Step 14: Return detailed response
      const scheduledCheckInIso =
        scheduledCheckIn instanceof Date && !Number.isNaN(scheduledCheckIn.getTime())
          ? scheduledCheckIn.toISOString()
          : undefined;
      const actualCheckInIso =
        actualCheckInTime instanceof Date && !Number.isNaN(actualCheckInTime.getTime())
          ? actualCheckInTime.toISOString()
          : undefined;

      await logActivity(req, {
        action: 'check_in',
        resource: 'booking',
        resourceId: bookingId,
        details: { lateCheckInFee }
      });

      res.json({
        message: "Guest checked in successfully",
        data: {
          booking: {
            ...booking.toObject(),
            checkInSummary: {
              scheduledCheckIn: scheduledCheckInIso,
              actualCheckIn: actualCheckInIso,
              isEarly: daysDifference < 0,
              isLate: lateCheckInFee > 0,
              lateCheckInFee: lateCheckInFee,
              checkedInBy: {
                id: payload.sub,
                email: payload.email,
              },
            },
            guestInfo: {
              name:
                `${(checkInUser?.firstName || '')} ${(checkInUser?.lastName || '')}`.trim() ||
                checkInUser?.username ||
                checkInUser?.email ||
                'Guest',
              email: checkInUser?.email || 'Not provided',
              phoneNumber: checkInUser?.phoneNumber || 'Not provided',
            },
            roomInfo: {
              roomNumber: populatedRoom.roomNumber,
              roomType: populatedRoom.roomType,
              capacity: populatedRoom.capacity,
              amenities: populatedRoom.amenities,
            },
            totalCharges: {
              baseAmount: booking.totalAmount,
              lateCheckInFee: lateCheckInFee,
              additionalCharges: booking.additionalCharges || 0,
              total: (booking.totalAmount || 0) + lateCheckInFee + (booking.additionalCharges || 0),
            },
          },
        },
      });
    } catch (err) {
      console.error('[CHECK-IN ERROR]', err);
      res.status(500).json({ 
        message: "Server error during check-in",
        details: err instanceof Error ? err.message : "An unexpected error occurred"
      });
    }
  }

  // Check-out booking - Detailed approach
  static async checkOutBooking(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      const { checkoutNotes, additionalCharges, roomCondition } = req.body as { 
        checkoutNotes?: string; 
        additionalCharges?: number;
        roomCondition?: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
      };
      
      // Step 1: Verify admin authorization
      if (payload.role !== "admin" && payload.role !== "superadmin") {
        return res.status(403).json({ 
          message: "Admin access required",
          details: "Only administrators can perform check-out operations"
        });
      }

      const bookingId = req.params.id;

      const session = await mongoose.startSession();
      let booking: any;
      let room: any;
      let now: Date;
      let scheduledCheckOut: Date;
      let scheduledCheckOutEnd: Date;
      let daysDifference: number;
      let isEarlyCheckOut: boolean;
      let lateCheckOutFee = 0;
      let checkInTime: Date;
      let actualNights: number;
      let scheduledNights: number;
      let extendedStayCharge = 0;
      let damageCharges = 0;
      let baseAmount: number;
      let lateCheckInFee: number;
      let previousAdditionalCharges: number;
      let newAdditionalCharges: number;
      let finalAdditionalCharges: number;
      let totalCharges: number;
      let amountPaid: number;
      let balanceDue: number;
      let actualCheckOutTime: Date;

      try {
        // Step 2: Fetch booking with all related data (no multi-document transaction)
        booking = await Booking.findById(bookingId)
          .populate("user", "username email firstName lastName phoneNumber")
          .populate("room", "roomNumber roomType price capacity amenities isAvailable housekeepingStatus")
          .session(session);
        
        if (!booking) {
          await session.abortTransaction();
          return res.status(404).json({ 
            message: "Booking not found",
            details: `No booking found with ID: ${bookingId}`
          });
        }

        // Step 3: Validate booking status
        if (booking.status === "checked-out") {
          await session.abortTransaction();
          return res.status(400).json({ 
            message: "Guest is already checked out",
            details: `Guest was checked out on ${booking.actualCheckOutTime ? new Date(booking.actualCheckOutTime).toLocaleString() : 'previously'}`,
            currentStatus: booking.status
          });
        }

        if (booking.status !== "checked-in") {
          await session.abortTransaction();
          return res.status(400).json({ 
            message: "Invalid booking status for check-out",
            details: `Only checked-in bookings can be checked out. Current status: ${booking.status}`,
            allowedStatuses: ["checked-in"]
          });
        }

        // Step 4: Verify guest was actually checked in
        if (!booking.actualCheckInTime) {
          await session.abortTransaction();
          return res.status(400).json({ 
            message: "Invalid check-in state",
            details: "This booking does not have a recorded check-in time. Please verify the booking status."
          });
        }

        // Step 5: Validate check-out date timing
        now = new Date();
        scheduledCheckOut = new Date(booking.checkOutDate);
        scheduledCheckOutEnd = new Date(scheduledCheckOut);
        scheduledCheckOutEnd.setHours(11, 0, 0, 0); // Standard check-out time: 11:00 AM

        daysDifference = Math.floor((now.getTime() - scheduledCheckOut.getTime()) / (1000 * 60 * 60 * 24));
        isEarlyCheckOut = daysDifference < 0;

        // Step 6: Calculate late check-out fee if applicable
        if (now > scheduledCheckOutEnd && !isEarlyCheckOut) {
          const hoursLate = Math.ceil((now.getTime() - scheduledCheckOutEnd.getTime()) / (1000 * 60 * 60));
          // ₱20 per hour after standard check-out time, max ₱100
          lateCheckOutFee = Math.min(hoursLate * 20, 100);
        }

        // Step 7: Calculate length of stay
        checkInTime = booking.actualCheckInTime ? new Date(booking.actualCheckInTime) : new Date(booking.checkInDate);
        actualNights = Math.ceil((now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60 * 24));
        scheduledNights = Math.ceil((scheduledCheckOut.getTime() - new Date(booking.checkInDate).getTime()) / (1000 * 60 * 60 * 24));

        // Load room once for charges and status updates
        room = await Room.findById(booking.room).session(session);
        if (!room) {
          await session.abortTransaction();
          return res.status(404).json({ 
            message: "Room not found",
            details: "The room assigned to this booking no longer exists"
          });
        }

        // Step 8: Calculate extended stay charges if guest stayed longer
        if (actualNights > scheduledNights) {
          const extraNights = actualNights - scheduledNights;
          extendedStayCharge = extraNights * room.price;
        }

        // Step 9: Handle room condition assessment
        if (roomCondition === "damaged") {
          // Damage charges would typically be assessed by management
          // This is a placeholder - in production, this would be calculated based on actual damage assessment
          damageCharges = 0; // Set by admin if needed
        }

        // Step 10: Calculate final charges
        baseAmount = booking.totalAmount;
        lateCheckInFee = booking.lateCheckInFee || 0;
        previousAdditionalCharges = booking.additionalCharges || 0;
        newAdditionalCharges = additionalCharges || 0;
        finalAdditionalCharges = previousAdditionalCharges + newAdditionalCharges + damageCharges;
        totalCharges = baseAmount + lateCheckInFee + lateCheckOutFee + extendedStayCharge + finalAdditionalCharges;
        amountPaid = booking.paymentStatus === "paid" ? baseAmount : 0;
        balanceDue = totalCharges - amountPaid;

        // Step 11: Perform check-out
        actualCheckOutTime = new Date();
        booking.status = "checked-out";
        booking.actualCheckOutTime = actualCheckOutTime;
        booking.checkedOutBy = payload.sub as any;
        booking.lateCheckOutFee = lateCheckOutFee;
        booking.additionalCharges = finalAdditionalCharges;
        booking.updatedAt = actualCheckOutTime;

        if (checkoutNotes) {
          booking.checkoutNotes = checkoutNotes;
          if (!booking.adminNotes) {
            booking.adminNotes = checkoutNotes;
          } else {
            booking.adminNotes += `\n[Check-out] ${checkoutNotes}`;
          }
        }

        await booking.save({ session });

        // Step 12: Update room status for housekeeping
        room.isAvailable = true; // Room is now available for cleaning/next guest
        room.housekeepingStatus = roomCondition === "damaged" ? "dirty" : "dirty"; // Always dirty after checkout, needs cleaning
        room.lastCleanedAt = roomCondition === "excellent" || roomCondition === "good" ? new Date() : undefined;
        room.updatedAt = new Date();
        await room.save({ session });
      } catch (err) {
        if (session.inTransaction()) {
          await session.abortTransaction();
        }
        throw err;
      } finally {
        session.endSession();
      }

      // Step 13: Populate booking data for response
      await booking.populate("user", "username email firstName lastName phoneNumber emailNotifications");
      await booking.populate("room", "roomNumber roomType price capacity amenities");
      await booking.populate("checkedInBy", "username email firstName lastName");
      await booking.populate("checkedOutBy", "username email firstName lastName");

      // Step 14: Send notification to user
      const checkoutMessage = `You have been checked out! Room: ${(booking.room as any).roomNumber}.${balanceDue > 0 ? ` Balance due: ₱${balanceDue.toFixed(2)}` : ' Thank you for staying with us!'}`;
      await NotificationController.createForUser(
        (booking.user as any)._id.toString(),
        balanceDue > 0 ? 'warning' : 'success',
        checkoutMessage,
        '/user/bookings'
      );

      const checkoutUser: any = booking.user;
      if (checkoutUser?.email && checkoutUser.emailNotifications !== false) {
        const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
        const userBookingsLink = `${clientOrigin}/user/bookings`;
        const subject = 'You have been checked out';
        const summaryHtml = buildBookingSummary(booking, {
          guestName: checkoutUser.firstName || checkoutUser.username || checkoutUser.email,
          bookingStatus: 'Checked out',
          paymentStatus: balanceDue > 0 ? 'Balance due' : booking.paymentStatus,
        });
        const chargesHtml = buildChargeBreakdownHtml({
          baseAmount,
          lateCheckInFee,
          lateCheckOutFee,
          extendedStayCharge,
          additionalCharges: finalAdditionalCharges,
          totalCharges,
          amountPaid,
          balanceDue,
        });
        const bodyHtml = `
          <p>Hi ${checkoutUser.firstName || checkoutUser.username || ''},</p>
          <p>${checkoutMessage}</p>
          ${summaryHtml}
          ${chargesHtml}
          ${balanceDue > 0
            ? `<p style="margin-top:12px;">Please settle the remaining balance at the front desk or via the payment link provided by our staff.</p>`
            : `<p style="margin-top:12px;">We hope you enjoyed your stay. We look forward to welcoming you again!</p>`}
          <p><a href="${userBookingsLink}">View your bookings</a></p>
        `;
        try {
          await sendAppEmail(checkoutUser.email, subject, bodyHtml);
        } catch (err) {
          console.error('Failed to send check-out email to user:', err);
        }
      }

      // Step 15: Log check-out activity
      console.log(`[CHECK-OUT] Booking ${bookingId} - User: ${(booking.user as any).email} - Room: ${(booking.room as any).roomNumber} - Admin: ${payload.email} - Time: ${actualCheckOutTime.toISOString()}${lateCheckOutFee > 0 ? ` - Late Fee: ₱${lateCheckOutFee}` : ''}${extendedStayCharge > 0 ? ` - Extended Stay: ₱${extendedStayCharge}` : ''}${balanceDue > 0 ? ` - Balance Due: ₱${balanceDue.toFixed(2)}` : ''}`);

      // Step 16: Return detailed response
      await logActivity(req, {
        action: 'check_out',
        resource: 'booking',
        resourceId: bookingId,
        details: { lateCheckOutFee, extendedStayCharge, balanceDue }
      });

      res.json({ 
        message: "Guest checked out successfully",
        data: {
          booking: {
            ...booking.toObject(),
            checkOutSummary: {
              scheduledCheckOut: scheduledCheckOut.toISOString(),
              actualCheckOut: actualCheckOutTime.toISOString(),
              isEarlyCheckOut: isEarlyCheckOut,
              isLateCheckOut: lateCheckOutFee > 0,
              lateCheckOutFee: lateCheckOutFee,
              checkedOutBy: {
                id: payload.sub,
                name: payload.email
              },
              lengthOfStay: {
                scheduledNights: scheduledNights,
                actualNights: actualNights,
                extendedStay: actualNights > scheduledNights ? actualNights - scheduledNights : 0,
                extendedStayCharge: extendedStayCharge
              },
              roomCondition: roomCondition || "not assessed"
            },
            guestInfo: {
              name: `${(booking.user as any).firstName} ${(booking.user as any).lastName}`,
              email: (booking.user as any).email,
              phoneNumber: (booking.user as any).phoneNumber || "Not provided"
            },
            roomInfo: {
              roomNumber: (booking.room as any).roomNumber,
              roomType: (booking.room as any).roomType,
              newHousekeepingStatus: room.housekeepingStatus,
              needsCleaning: true
            },
            financialSummary: {
              baseAmount: baseAmount,
              lateCheckInFee: lateCheckInFee,
              lateCheckOutFee: lateCheckOutFee,
              extendedStayCharge: extendedStayCharge,
              additionalCharges: finalAdditionalCharges,
              totalCharges: totalCharges,
              amountPaid: amountPaid,
              balanceDue: balanceDue,
              paymentStatus: balanceDue > 0 ? "partial" : booking.paymentStatus
            },
            nextSteps: balanceDue > 0 
              ? ["Process final payment", "Update payment status", "Send receipt"]
              : ["Mark room for cleaning", "Update housekeeping schedule"]
          }
        }
      });
    } catch (err) {
      console.error('[CHECK-OUT ERROR]', err);
      res.status(500).json({ 
        message: "Server error during check-out",
        details: err instanceof Error ? err.message : "An unexpected error occurred"
      });
    }
  }

  // Update payment status
  static async updatePaymentStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { bookingId } = req.params;
      const { paymentStatus } = req.body;
      const payload = req.user!;

      if (!bookingId || !paymentStatus) {
        return res.status(400).json({ 
          message: "Booking ID and payment status are required" 
        });
      }

      if (!["pending", "paid", "refunded"].includes(paymentStatus)) {
        return res.status(400).json({ 
          message: "Invalid payment status. Must be 'pending', 'paid', or 'refunded'" 
        });
      }

      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Check if user owns the booking or is admin/superadmin
      const isOwner = booking.user.toString() === payload.sub;
      const isAdmin = payload.role === "admin" || payload.role === "superadmin";

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ 
          message: "You don't have permission to update this booking's payment status" 
        });
      }

      // Only allow non-admin users to mark as paid; admins/superadmins can set any status
      if (!isAdmin && paymentStatus !== "paid") {
        return res.status(403).json({ 
          message: "You can only mark bookings as paid" 
        });
      }

      booking.paymentStatus = paymentStatus as "pending" | "paid" | "refunded";
      await booking.save();

      // Notify user if payment was marked as paid by an admin/superadmin
      if (paymentStatus === "paid" && isAdmin) {
        const populated = await booking.populate("room", "roomNumber");
        const roomDoc: any = populated.room;
        const roomNumber = roomDoc && roomDoc.roomNumber ? roomDoc.roomNumber : "";

        await NotificationController.createForUser(
          booking.user.toString(),
          'success',
          `Payment received for booking Room ${roomNumber}. Your booking is confirmed!`,
          '/user/bookings'
        );
      }

      res.json({ 
        message: "Payment status updated successfully",
        data: { booking }
      });
    } catch (error: any) {
      console.error("Error updating payment status:", error);
      res.status(500).json({
        message: "Server error",
        details: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    }
  }
}
