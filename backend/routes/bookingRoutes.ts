import { Router } from 'express';
import { BookingController } from '../controllers/bookingController';
import { BookingCrudController } from '../controllers/bookingCrudController';
import { BookingCancellationController } from '../controllers/bookingCancellationController';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { requirePermission } from '../middleware/rbac';
import { validateBody, bookingSchemas } from '../middleware/validate';

const router = Router();

// ============================================
// CRUD Operations (bookingCrudController)
// ============================================

// Admin: can manage any booking
router.get(
  '/',
  requireAuth,
  requirePermission('readAny', 'booking'),
  asyncHandler(BookingCrudController.getAllBookings)
);

// User: can work only with own bookings
router.get(
  '/user-bookings',
  requireAuth,
  requirePermission('readOwn', 'booking'),
  asyncHandler(BookingCrudController.getUserBookings)
);

router.post(
  '/',
  (req, res, next) => { console.log("POST /bookings route hit"); next(); },
  requireAuth,
  requirePermission('createOwn', 'booking'),
  validateBody(bookingSchemas.createBooking),
  asyncHandler(BookingCrudController.createBooking)
);

router.put(
  '/:id/status',
  requireAuth,
  requirePermission('updateAny', 'booking'),
  validateBody(bookingSchemas.updateStatus),
  asyncHandler(BookingCrudController.updateBookingStatus)
);

router.put(
  '/:bookingId/payment',
  requireAuth,
  requirePermission('updateOwn', 'booking'),
  validateBody(bookingSchemas.updatePaymentStatus),
  asyncHandler(BookingCrudController.updatePaymentStatus)
);

// ============================================
// Check-in/Check-out (bookingController - complex operations)
// ============================================

router.put(
  '/:id/checkin',
  requireAuth,
  requirePermission('updateAny', 'booking'),
  validateBody(bookingSchemas.checkIn),
  asyncHandler(BookingController.checkInBooking)
);

router.put(
  '/:id/checkout',
  requireAuth,
  requirePermission('updateAny', 'booking'),
  asyncHandler(BookingController.checkOutBooking)
);

// ============================================
// Cancellation Flow (bookingCancellationController)
// ============================================

router.post(
  '/:id/request-cancel',
  requireAuth,
  requirePermission('updateOwn', 'booking'),
  validateBody(bookingSchemas.requestCancellation),
  asyncHandler(BookingCancellationController.requestCancellation)
);

router.post(
  '/:id/approve-cancel',
  requireAuth,
  requirePermission('updateAny', 'booking'),
  asyncHandler(BookingCancellationController.approveCancellation)
);

router.post(
  '/:id/decline-cancel',
  requireAuth,
  requirePermission('updateAny', 'booking'),
  validateBody(bookingSchemas.declineCancellation),
  asyncHandler(BookingCancellationController.declineCancellation)
);

export default router;
