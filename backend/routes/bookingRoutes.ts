import { Router } from 'express';
import { BookingController } from '../controllers/bookingController';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { requirePermission } from '../middleware/rbac';

const router = Router();

// Booking routes
// Admin: can manage any booking
router.get(
  '/',
  requireAuth,
  requirePermission('readAny', 'booking'),
  asyncHandler(BookingController.getAllBookings)
);

// User: can work only with own bookings (controllers already scope by user)
router.get(
  '/user-bookings',
  requireAuth,
  requirePermission('readOwn', 'booking'),
  asyncHandler(BookingController.getUserBookings)
);

router.post(
  '/',
  requireAuth,
  requirePermission('createOwn', 'booking'),
  asyncHandler(BookingController.createBooking)
);

router.put(
  '/:id/status',
  requireAuth,
  requirePermission('updateAny', 'booking'),
  asyncHandler(BookingController.updateBookingStatus)
);

router.put(
  '/:id/checkin',
  requireAuth,
  requirePermission('updateAny', 'booking'),
  asyncHandler(BookingController.checkInBooking)
);

router.put(
  '/:id/checkout',
  requireAuth,
  requirePermission('updateAny', 'booking'),
  asyncHandler(BookingController.checkOutBooking)
);

router.post(
  '/:id/request-cancel',
  requireAuth,
  requirePermission('updateOwn', 'booking'),
  asyncHandler(BookingController.requestCancellation)
);

router.post(
  '/:id/approve-cancel',
  requireAuth,
  requirePermission('updateAny', 'booking'),
  asyncHandler(BookingController.approveCancellation)
);

router.post(
  '/:id/decline-cancel',
  requireAuth,
  requirePermission('updateAny', 'booking'),
  asyncHandler(BookingController.declineCancellation)
);

router.put(
  '/:bookingId/payment',
  requireAuth,
  requirePermission('updateOwn', 'booking'),
  asyncHandler(BookingController.updatePaymentStatus)
);

export default router;
