import { Response } from 'express';
import { Booking } from '../models/Booking';
import { Room } from '../models/Room';
import { NotificationController } from './notificationController';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth';
import { sendAppEmail, buildBookingSummaryHtml, BookingSummaryDetails, getBookingReference } from '../services/emailService';
import { calculateBookingPricing } from '../services/bookingService';
import { logActivity } from '../services/activityLogService';
import { PaymentController } from './paymentController';
import { encrypt, decrypt } from '../utils/encryption';

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

export class BookingCrudController {
  // Get all bookings (admin only)
  static async getAllBookings(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      
      if (payload.role !== "admin" && payload.role !== "superadmin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const bookings = await Booking.find({})
        .populate("user", "username")
        .populate("room", "roomNumber roomType price")
        .sort({ createdAt: -1 });

      const enriched = bookings.map((b: any) => {
        const o = b.toObject();
        if (o?.contactNumber) {
          o.contactNumber = decrypt(o.contactNumber) ?? o.contactNumber;
        }
        if (o.status === 'pending') {
          const since: Date | undefined = o.pendingSince ? new Date(o.pendingSince) : (o.createdAt ? new Date(o.createdAt) : undefined);
          if (since && !Number.isNaN(since.getTime())) {
            o.pendingDurationSeconds = Math.max(0, Math.floor((Date.now() - since.getTime()) / 1000));
          }
        }
        return o;
      });

      res.json({
        message: "Bookings fetched successfully",
        data: enriched,
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

      const enriched = bookings.map((b: any) => {
        const o = b.toObject();
        if (o?.contactNumber) {
          o.contactNumber = decrypt(o.contactNumber) ?? o.contactNumber;
        }
        if (o.status === 'pending') {
          const since: Date | undefined = o.pendingSince ? new Date(o.pendingSince) : (o.createdAt ? new Date(o.createdAt) : undefined);
          if (since && !Number.isNaN(since.getTime())) {
            o.pendingDurationSeconds = Math.max(0, Math.floor((Date.now() - since.getTime()) / 1000));
          }
        }
        return o;
      });

      res.json({
        message: "User bookings fetched successfully",
        data: enriched,
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
      console.log("Creating booking - roomId:", roomId);
      const room = await Room.findById(roomId);
      console.log("Room found:", room ? room.roomNumber : "NOT FOUND");
      if (!room) {
        // List all available rooms for debugging
        const allRooms = await Room.find({}).select('_id roomNumber');
        console.log("Available room IDs:", allRooms.map((r) => ({ id: String(r._id), number: r.roomNumber })));
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
        contactNumber: encrypt(contactNumber) ?? contactNumber,
        specialRequests
      });

      const savedBooking = await booking.save();
      await savedBooking.populate("room", "roomNumber roomType price");

      await logActivity(req, {
        action: 'create_booking',
        resource: 'booking',
        resourceId: (savedBooking._id as any).toString(),
        details: { roomId, checkInDate, checkOutDate, numberOfGuests }
      });

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

        // Email admins about the new booking
        const admins = await User.find({ role: 'admin' }).select('_id email emailNotifications');
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
            if (adminEmail && adminEmailPref !== false) {
              const subject = 'New booking request';
              const summaryHtml = buildBookingSummary(savedBooking, {
                guestName: guestName || displayName,
              });
              const bodyHtml = `
                <p>${message}</p>
                ${summaryHtml}
                ${specialRequests ? `<p><strong>Special requests:</strong> ${specialRequests}</p>` : ''}
                <p><a href="${adminBookingsLink}">Review booking in admin panel</a></p>
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

      await logActivity(req, {
        action: 'update_booking_status',
        resource: 'booking',
        resourceId: bookingId,
        details: { status, adminNotes }
      });

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

  // Update payment status
  static async updatePaymentStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { bookingId } = req.params;
      const { paymentStatus, paymentMethod, transactionId } = req.body as {
        paymentStatus: "pending" | "paid" | "refunded";
        paymentMethod?: "stripe" | "cash" | "bank_transfer" | "other";
        transactionId?: string;
      };
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

      // Only allow non-admin users to mark as paid
      if (!isAdmin && paymentStatus !== "paid") {
        return res.status(403).json({ 
          message: "You can only mark bookings as paid" 
        });
      }

      // Prevent marking a paid booking as pending (unfair to user who already paid)
      // Only allow: paid -> refunded, refunded -> pending, pending -> paid
      if (booking.paymentStatus === "paid" && paymentStatus === "pending") {
        return res.status(400).json({ 
          message: "Cannot mark a paid booking as pending. The user has already paid. You can only mark it as refunded if needed." 
        });
      }

      booking.paymentStatus = paymentStatus as "pending" | "paid" | "refunded";
      if (paymentStatus === "paid") {
        booking.paymentDate = new Date();
        if (paymentMethod) {
          booking.paymentMethod = paymentMethod;
        } else if (!booking.paymentMethod) {
          booking.paymentMethod = "other";
        }
        if (transactionId) {
          booking.transactionId = transactionId;
        }
      }
      await booking.save();

      await logActivity(req, {
        action: 'update_payment_status',
        resource: 'booking',
        resourceId: bookingId,
        details: { paymentStatus, paymentMethod, transactionId }
      });

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

      // Email notifications to user and admins when marked as paid (admin or user action)
      if (paymentStatus === "paid") {
        try {
          await PaymentController.notifyAdminsBookingPaid(bookingId);
        } catch (e) {
          console.error('Failed to send payment emails:', e);
        }
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
