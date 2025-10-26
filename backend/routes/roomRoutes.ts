import { Router } from 'express';
import { RoomController } from '../controllers/roomController';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Public room routes
router.get('/', asyncHandler(RoomController.getAllRooms));
router.get('/availability', asyncHandler(RoomController.getRoomAvailability));
router.get('/calendar', asyncHandler(RoomController.getRoomCalendar));

// Admin room management routes
router.post('/', requireAuth, requireAdmin, asyncHandler(RoomController.createRoom));
router.put('/:id', requireAuth, requireAdmin, asyncHandler(RoomController.updateRoom));
router.delete('/:id', requireAuth, requireAdmin, asyncHandler(RoomController.deleteRoom));
router.get('/admin', requireAuth, requireAdmin, asyncHandler(RoomController.getAllRoomsAdmin));
router.post('/sample', requireAuth, requireAdmin, asyncHandler(RoomController.createSampleRooms));

export default router;
