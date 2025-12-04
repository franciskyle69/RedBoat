import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { Room } from '../models/Room';
import { RoomReview } from '../models/RoomReview';
import { Booking } from '../models/Booking';

export class RoomReviewController {
  static async createReview(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      const roomId = req.params.id;
      const { rating, comment } = req.body as { rating?: number; comment?: string };

      if (!roomId) {
        return res.status(400).json({ message: 'Room ID is required' });
      }

      if (!rating || !comment) {
        return res.status(400).json({ message: 'Rating and comment are required' });
      }

      const room = await Room.findById(roomId);
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }

      const hasCompletedStay = await Booking.exists({
        user: payload.sub,
        room: roomId,
        status: 'checked-out',
      });

      if (!hasCompletedStay) {
        return res.status(403).json({
          message: 'You can only review rooms after you have completed a stay (checked out).',
        });
      }

      const review = await RoomReview.findOneAndUpdate(
        { user: payload.sub, room: roomId },
        { rating, comment, createdAt: new Date() },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      );

      return res.status(201).json({ message: 'Review submitted', data: review });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  static async getRoomReviews(req: AuthenticatedRequest, res: Response) {
    try {
      const roomId = req.params.id;

      if (!roomId) {
        return res.status(400).json({ message: 'Room ID is required' });
      }

      const items = await RoomReview.find({ room: roomId })
        .populate('user', 'username email firstName lastName')
        .sort({ createdAt: -1 });

      const count = items.length;
      const averageRating =
        count === 0 ? 0 : items.reduce((sum, review) => sum + review.rating, 0) / count;

      return res.json({ data: { items, averageRating, count } });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
}
