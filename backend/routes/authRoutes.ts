import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validateBody, authSchemas } from '../middleware/validate';

const router = Router();

// Authentication routes
router.post('/signup', validateBody(authSchemas.signup), asyncHandler(AuthController.signup));
router.post('/verify-email', validateBody(authSchemas.verifyEmail), asyncHandler(AuthController.verifyEmail));
router.post('/login', validateBody(authSchemas.login), asyncHandler(AuthController.login));
router.post('/logout', asyncHandler(AuthController.logout));
router.post('/forgot-password', validateBody(authSchemas.forgotPassword), asyncHandler(AuthController.forgotPassword));
router.post('/verify-reset-code', validateBody(authSchemas.verifyResetCode), asyncHandler(AuthController.verifyResetCode));
router.post('/reset-password', validateBody(authSchemas.resetPassword), asyncHandler(AuthController.resetPassword));
router.post('/google-login', validateBody(authSchemas.googleLogin), asyncHandler(AuthController.googleLogin));
router.post('/promote-to-admin', validateBody(authSchemas.promoteToAdmin), asyncHandler(AuthController.promoteToAdmin));
router.post('/set-username', requireAuth, validateBody(authSchemas.setUsername), asyncHandler(AuthController.setUsername));

export default router;
