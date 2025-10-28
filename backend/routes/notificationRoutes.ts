import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { NotificationController } from '../controllers/notificationController';

const router = Router();

router.get('/', requireAuth, asyncHandler(NotificationController.list));
router.post('/mark-all-read', requireAuth, asyncHandler(NotificationController.markAllRead));

export default router;


