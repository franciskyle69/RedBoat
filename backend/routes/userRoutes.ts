import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// User profile routes
router.get('/me', requireAuth, asyncHandler(UserController.getCurrentUser));
router.get('/profile', requireAuth, asyncHandler(UserController.getProfile));
router.put('/profile', requireAuth, asyncHandler(UserController.updateProfile));
router.put('/profile/password', requireAuth, asyncHandler(UserController.changePassword));

// Admin user management routes
router.get('/users', requireAuth, requireAdmin, asyncHandler(UserController.getAllUsers));

export default router;
