import { Request, Response } from 'express';
import Stripe from 'stripe';
import { Booking } from '../models/Booking';
import { User } from '../models/User';
import { NotificationController } from './notificationController';
import { sendAppEmail, buildBookingSummaryHtml, BookingSummaryDetails, getBookingReference, getPaymentReference } from '../services/emailService';

const formatDateShort = (date: Date | string | undefined): string | undefined => {
  if (!date) return undefined;
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString();
};

const buildPaymentBookingSummary = (booking: any, overrides: Partial<BookingSummaryDetails> = {}): string => {
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
    paymentReference: booking._id && booking.paymentStatus === 'paid' ? getPaymentReference(String(booking._id)) : undefined,
    room: roomLabel,
    checkIn: formatDateShort(booking.checkInDate),
    checkOut: formatDateShort(booking.checkOutDate),
    nights,
    guests: booking.numberOfGuests,
    totalAmount,
    bookingStatus: booking.status,
    paymentStatus: booking.paymentStatus,
    paymentMethod: booking.paymentMethod,
    paymentDate: booking.paymentDate ? formatDateShort(booking.paymentDate) : undefined,
  };

  return buildBookingSummaryHtml({ ...base, ...overrides });
};

function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  return new Stripe(key, { apiVersion: '2024-06-20' as any });
}

export class PaymentController {
  private static async notifyAdminsBookingPaid(bookingId: string) {
    try {
      const booking = await Booking.findById(bookingId)
        .populate('user', 'username firstName lastName email emailNotifications')
        .populate('room', 'roomNumber roomType');
      if (!booking) return;
      const u: any = booking.user;
      const username = u?.username || `${u?.firstName || ''} ${u?.lastName || ''}`.trim() || 'A user';
      const roomInfo = (booking as any).room ? `Room ${(booking as any).room.roomNumber}` : 'a room';
      const message = `${username} completed payment for ${roomInfo} (₱${Number(booking.totalAmount).toFixed(0)}).`;

      const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
      const adminBookingsLink = `${clientOrigin}/admin/bookings`;
      const userBookingsLink = `${clientOrigin}/user/bookings`;

      const admins = await User.find({ role: 'admin' }).select('_id email emailNotifications');
      for (const admin of admins) {
        await NotificationController.createForUser(String((admin as any)._id), 'success', message, '/admin/bookings');

        const adminEmail = (admin as any).email as string | undefined;
        const adminEmailPref = (admin as any).emailNotifications as boolean | undefined;
        if (adminEmail && adminEmailPref !== false) {
          const subject = 'Booking paid';
          const summaryHtml = buildPaymentBookingSummary(booking, {
            guestName: username,
            paymentStatus: 'Paid',
          });
          const html = `
            <p>${message}</p>
            ${summaryHtml}
            <p style="margin-top:12px;">Next steps:</p>
            <ol style="margin:4px 0 12px 20px;padding:0;color:#334155;font-size:14px;">
              <li>Verify that the booking status is still correct (typically confirmed).</li>
              <li>Prepare the room for the guest based on the check-in date.</li>
            </ol>
            <p><a href="${adminBookingsLink}">View booking in admin panel</a></p>
          `;
          try {
            await sendAppEmail(adminEmail, subject, html);
          } catch (err) {
            console.error('Failed to send paid-booking email to admin:', err);
          }
        }
      }

      // Email user (payment confirmation) if they enabled email notifications
      if (u?.email && u.emailNotifications !== false) {
        const subject = 'Payment received for your booking';
        const summaryHtml = buildPaymentBookingSummary(booking, {
          guestName: u.firstName || u.username || u.email,
          paymentStatus: 'Paid',
        });
        const html = `
          <p>Hi ${u.firstName || u.username || ''},</p>
          <p>We received your payment for ${roomInfo} (₱${Number(booking.totalAmount).toFixed(0)}).</p>
          ${summaryHtml}
          <p style="margin-top:12px;">What happens next:</p>
          <ol style="margin:4px 0 12px 20px;padding:0;color:#334155;font-size:14px;">
            <li>Your booking remains ${booking.status || 'confirmed'} unless changed by an admin.</li>
            <li>Please bring a valid ID and your booking reference when you arrive.</li>
          </ol>
          <p>You can review your booking details here:</p>
          <p><a href="${userBookingsLink}">View my bookings</a></p>
        `;
        try {
          await sendAppEmail(u.email, subject, html);
        } catch (err) {
          console.error('Failed to send payment confirmation email to user:', err);
        }
      }
    } catch (e) {
      console.error('Failed to notify admins for paid booking:', e);
    }
  }
  static async createCheckoutSession(req: Request, res: Response) {
    try {
      const { bookingId } = req.body;
      if (!bookingId) return res.status(400).json({ message: 'bookingId is required' });

      const booking = await Booking.findById(bookingId).populate('room', 'roomNumber roomType');
      if (!booking) return res.status(404).json({ message: 'Booking not found' });
      if (booking.paymentStatus === 'paid') return res.status(400).json({ message: 'Booking is already paid' });
      if (booking.status !== 'confirmed') {
        return res.status(400).json({ message: 'Booking must be approved by admin before payment' });
      }

      const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

      const bookingIdStr = String(booking._id);
      const userIdStr = String(booking.user);

      const stripe = getStripeClient();
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: 'php',
              unit_amount: Math.round(Number(booking.totalAmount) * 100),
              product_data: {
                name: `Room ${((booking.room as any)?.roomNumber) || ''} • ${((booking.room as any)?.roomType) || 'Room'}`,
                description: `Booking ${booking._id}`,
              },
            },
          },
        ],
        success_url: `${clientOrigin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${clientOrigin}/checkout/cancel?bookingId=${bookingIdStr}`,
        metadata: {
          bookingId: bookingIdStr,
          userId: userIdStr,
        },
      });

      return res.json({ id: session.id, url: session.url });
    } catch (err) {
      console.error('[Stripe] createCheckoutSession error:', err);
      return res.status(500).json({ message: 'Failed to create checkout session' });
    }
  }

  static async webhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: Stripe.Event;

    try {
      const stripe = getStripeClient();
      event = stripe.webhooks.constructEvent((req as any).body, sig, webhookSecret!);
    } catch (err) {
      console.error('[Stripe] webhook signature verification failed:', err);
      return res.status(400).send(`Webhook Error: ${(err as any).message}`);
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const bookingId = (session.metadata && session.metadata.bookingId) || '';
          if (bookingId) {
            await Booking.findByIdAndUpdate(bookingId, { 
              paymentStatus: 'paid',
              paymentMethod: 'stripe',
              paymentDate: new Date(),
              stripePaymentIntentId: session.payment_intent as string,
            });
            await PaymentController.notifyAdminsBookingPaid(bookingId);
          }
          break;
        }
        default:
          break;
      }
      res.json({ received: true });
    } catch (err) {
      console.error('[Stripe] webhook handling error:', err);
      res.status(500).send('Webhook handler failed');
    }
  }

  static async confirmSession(req: Request, res: Response) {
    try {
      const { session_id } = req.query as { session_id?: string };
      if (!session_id) return res.status(400).json({ message: 'session_id is required' });

      const stripe = getStripeClient();
      const session = await stripe.checkout.sessions.retrieve(session_id);

      // Prefer metadata bookingId when present
      const bookingId = (session.metadata && session.metadata.bookingId) || '';

      // Determine if paid
      const isPaid = session.payment_status === 'paid' || session.status === 'complete';
      if (!isPaid) {
        return res.status(409).json({ message: 'Session not paid yet' });
      }

      if (bookingId) {
        await Booking.findByIdAndUpdate(bookingId, { 
          paymentStatus: 'paid',
          paymentMethod: 'stripe',
          paymentDate: new Date(),
          stripePaymentIntentId: session.payment_intent as string,
        });
        await PaymentController.notifyAdminsBookingPaid(bookingId);
      }

      return res.json({ ok: true, bookingId });
    } catch (err) {
      console.error('[Stripe] confirmSession error:', err);
      return res.status(500).json({ message: 'Failed to confirm session' });
    }
  }
}
