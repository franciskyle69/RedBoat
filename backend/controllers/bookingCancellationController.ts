import { Response } from 'express';
import { Booking } from '../models/Booking';
import { NotificationController } from './notificationController';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth';
import { sendAppEmail } from '../services/emailService';
import { buildBookingSummary } from './booking/bookingUtils';

export class BookingCancellationController {
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
      const admins = await User.find({ role: { $in: ['admin', 'superadmin'] } }).select('_id email emailNotifications');
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
}
