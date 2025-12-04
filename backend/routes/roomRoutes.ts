import { Router } from 'express';
import { RoomController } from '../controllers/roomController';
import { RoomReviewController } from '../controllers/roomReviewController';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { uploadRoomImages } from '../utils/roomImageUpload';
import { requirePermission } from '../middleware/rbac';
import { validateBody, roomSchemas, roomReviewSchemas } from '../middleware/validate';

const router = Router();

// Public room routes
router.get('/', asyncHandler(RoomController.getAllRooms));
router.get('/availability', asyncHandler(RoomController.getRoomAvailability));
router.get('/calendar', asyncHandler(RoomController.getRoomCalendar));

// Room reviews
router.get(
  '/:id/reviews',
  asyncHandler(RoomReviewController.getRoomReviews)
);
router.post(
  '/:id/reviews',
  requireAuth,
  validateBody(roomReviewSchemas.createReview),
  asyncHandler(RoomReviewController.createReview)
);

// Admin room management routes
router.post(
  '/',
  requireAuth,
  requirePermission('createAny', 'room'),
  uploadRoomImages.array('images', 5),
  asyncHandler(RoomController.createRoom)
);
router.put(
  '/:id',
  requireAuth,
  requirePermission('updateAny', 'room'),
  validateBody(roomSchemas.updateRoom),
  asyncHandler(RoomController.updateRoom)
);
router.post(
  '/:id/images',
  requireAuth,
  requirePermission('updateAny', 'room'),
  uploadRoomImages.array('images', 5),
  asyncHandler(RoomController.updateRoomImages)
);
router.delete(
  '/:id',
  requireAuth,
  requirePermission('deleteAny', 'room'),
  asyncHandler(RoomController.deleteRoom)
);
router.get(
  '/admin',
  requireAuth,
  requirePermission('readAny', 'room'),
  asyncHandler(RoomController.getAllRoomsAdmin)
);
router.post(
  '/sample',
  requireAuth,
  requirePermission('createAny', 'room'),
  asyncHandler(RoomController.createSampleRooms)
);
router.get(
  '/housekeeping',
  requireAuth,
  requirePermission('readAny', 'housekeeping'),
  asyncHandler(RoomController.getHousekeepingOverview)
);
router.put(
  '/housekeeping/:id',
  requireAuth,
  requirePermission('updateAny', 'housekeeping'),
  validateBody(roomSchemas.updateHousekeepingStatus),
  asyncHandler(RoomController.updateHousekeepingStatus)
);

export default router;
