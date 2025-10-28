import { Router } from 'express';
import { BookingController } from '../controllers/bookingController';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Booking routes
router.get('/', requireAuth, requireAdmin, asyncHandler(BookingController.getAllBookings));
router.get('/user-bookings', requireAuth, asyncHandler(BookingController.getUserBookings));
router.post('/', requireAuth, asyncHandler(BookingController.createBooking));
router.put('/:id/status', requireAuth, requireAdmin, asyncHandler(BookingController.updateBookingStatus));
router.put('/:id/checkin', requireAuth, requireAdmin, asyncHandler(BookingController.checkInBooking));
router.put('/:id/checkout', requireAuth, requireAdmin, asyncHandler(BookingController.checkOutBooking));
router.post('/:id/request-cancel', requireAuth, asyncHandler(BookingController.requestCancellation));
router.post('/:id/approve-cancel', requireAuth, requireAdmin, asyncHandler(BookingController.approveCancellation));
router.post('/:id/decline-cancel', requireAuth, requireAdmin, asyncHandler(BookingController.declineCancellation));

export default router;
