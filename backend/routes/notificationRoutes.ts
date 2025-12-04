import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { NotificationController } from '../controllers/notificationController';
import { validateBody, notificationSchemas } from '../middleware/validate';

const router = Router();

router.get('/', requireAuth, asyncHandler(NotificationController.list));
router.post('/', requireAuth, validateBody(notificationSchemas.createNotification), asyncHandler(NotificationController.create));
router.post('/mark-all-read', requireAuth, asyncHandler(NotificationController.markAllRead));
router.post('/:id/read', requireAuth, asyncHandler(NotificationController.markRead));
router.delete('/:id', requireAuth, asyncHandler(NotificationController.remove));
router.get('/stream', requireAuth, NotificationController.stream);

export default router;


