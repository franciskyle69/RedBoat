import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { uploadUserAvatar } from '../utils/userAvatarUpload';
import { requirePermission } from '../middleware/rbac';

const router = Router();

// User profile routes
router.get('/me', requireAuth, asyncHandler(UserController.getCurrentUser));
router.get('/profile', requireAuth, asyncHandler(UserController.getProfile));
router.put('/profile', requireAuth, asyncHandler(UserController.updateProfile));
router.put('/profile/password', requireAuth, asyncHandler(UserController.changePassword));
router.post('/profile/avatar', requireAuth, uploadUserAvatar.single('avatar'), asyncHandler(UserController.uploadAvatar));

// Admin user management routes (admin permissions via RBAC)
router.get(
  '/users',
  requireAuth,
  requirePermission('readAny', 'user'),
  asyncHandler(UserController.getAllUsers)
);

router.put(
  '/users/:userId/role',
  requireAuth,
  requirePermission('updateAny', 'user'),
  asyncHandler(UserController.updateUserRole)
);

router.put(
  '/users/:userId/admin-permissions',
  requireAuth,
  requirePermission('updateAny', 'user'),
  asyncHandler(UserController.updateAdminPermissions)
);

router.put(
  '/users/:userId/block',
  requireAuth,
  requirePermission('updateAny', 'user'),
  asyncHandler(UserController.blockUser)
);

router.put(
  '/users/:userId/unblock',
  requireAuth,
  requirePermission('updateAny', 'user'),
  asyncHandler(UserController.unblockUser)
);

export default router;
