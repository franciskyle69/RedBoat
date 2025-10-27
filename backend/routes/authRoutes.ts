import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Authentication routes
router.post('/signup', asyncHandler(AuthController.signup));
router.post('/verify-email', asyncHandler(AuthController.verifyEmail));
router.post('/login', asyncHandler(AuthController.login));
router.post('/logout', asyncHandler(AuthController.logout));
router.post('/forgot-password', asyncHandler(AuthController.forgotPassword));
router.post('/verify-reset-code', asyncHandler(AuthController.verifyResetCode));
router.post('/reset-password', asyncHandler(AuthController.resetPassword));
router.post('/google-login', asyncHandler(AuthController.googleLogin));
router.post('/promote-to-admin', asyncHandler(AuthController.promoteToAdmin));
router.post('/set-username', requireAuth, asyncHandler(AuthController.setUsername));

export default router;
