import { Router } from 'express';
import { ActivityLogController } from '../controllers/activityLogController';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { requirePermission } from '../middleware/rbac';

const router = Router();

// Admin activity logs listing
router.get(
  '/logs',
  requireAuth,
  requirePermission('readAny', 'activity'),
  asyncHandler(ActivityLogController.getLogs)
);

export default router;
