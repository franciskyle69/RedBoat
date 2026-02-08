import { Router } from 'express';
import { RoleController } from '../controllers/roleController';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.get('/roles', requireAuth, asyncHandler(RoleController.list));
router.post('/roles', requireAuth, asyncHandler(RoleController.create));
router.put('/roles/:roleId', requireAuth, asyncHandler(RoleController.update));
router.delete('/roles/:roleId', requireAuth, asyncHandler(RoleController.delete));

export default router;
