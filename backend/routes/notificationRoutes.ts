import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { NotificationController } from '../controllers/notificationController';

const router = Router();

router.get('/', requireAuth, asyncHandler(NotificationController.list));
router.post('/', requireAuth, asyncHandler(NotificationController.create));
router.post('/mark-all-read', requireAuth, asyncHandler(NotificationController.markAllRead));
router.post('/:id/read', requireAuth, asyncHandler(NotificationController.markRead));
router.delete('/:id', requireAuth, asyncHandler(NotificationController.remove));
router.get('/stream', requireAuth, NotificationController.stream);

export default router;


