import { Router } from 'express';
import { FeedbackController } from '../controllers/feedbackController';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validateBody, feedbackSchemas } from '../middleware/validate';

const router = Router();

router.post('/', requireAuth, validateBody(feedbackSchemas.createFeedback), asyncHandler(FeedbackController.create));
router.get('/my', requireAuth, asyncHandler(FeedbackController.getMyFeedback));
router.get('/', requireAuth, asyncHandler(FeedbackController.getAllFeedback));

export default router;
