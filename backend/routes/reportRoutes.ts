import { Router } from 'express';
import { ReportController } from '../controllers/reportController';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { requirePermission } from '../middleware/rbac';

const router = Router();

// Report routes (admin/superadmin with viewReports permission)
router.get('/occupancy', requireAuth, requirePermission('readAny', 'report'), asyncHandler(ReportController.getOccupancyReport));
router.get('/revenue', requireAuth, requirePermission('readAny', 'report'), asyncHandler(ReportController.getRevenueReport));
router.get('/bookings', requireAuth, requirePermission('readAny', 'report'), asyncHandler(ReportController.getBookingAnalytics));
router.get('/dashboard', requireAuth, requirePermission('readAny', 'report'), asyncHandler(ReportController.getDashboardReport));

// PDF generation routes
router.get('/occupancy/pdf', requireAuth, requirePermission('readAny', 'report'), asyncHandler(ReportController.generateOccupancyPDF));
router.get('/revenue/pdf', requireAuth, requirePermission('readAny', 'report'), asyncHandler(ReportController.generateRevenuePDF));
router.get('/bookings/pdf', requireAuth, requirePermission('readAny', 'report'), asyncHandler(ReportController.generateBookingsPDF));

export default router;
