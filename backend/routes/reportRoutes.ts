import { Router } from 'express';
import { ReportController } from '../controllers/reportController';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Report routes (admin only)
router.get('/occupancy', requireAuth, requireAdmin, asyncHandler(ReportController.getOccupancyReport));
router.get('/revenue', requireAuth, requireAdmin, asyncHandler(ReportController.getRevenueReport));
router.get('/bookings', requireAuth, requireAdmin, asyncHandler(ReportController.getBookingAnalytics));
router.get('/dashboard', requireAuth, requireAdmin, asyncHandler(ReportController.getDashboardReport));

// PDF generation routes
router.get('/occupancy/pdf', requireAuth, requireAdmin, asyncHandler(ReportController.generateOccupancyPDF));
router.get('/revenue/pdf', requireAuth, requireAdmin, asyncHandler(ReportController.generateRevenuePDF));
router.get('/bookings/pdf', requireAuth, requireAdmin, asyncHandler(ReportController.generateBookingsPDF));

export default router;
