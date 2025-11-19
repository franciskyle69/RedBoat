import { Response } from 'express';
import { Feedback } from '../models/Feedback';
import { AuthenticatedRequest } from '../middleware/auth';

export class FeedbackController {
  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      const { rating, comment } = req.body as { rating?: number; comment?: string };

      if (!rating || !comment) {
        return res.status(400).json({ message: 'Rating and comment are required' });
      }

      const feedback = await Feedback.create({
        user: payload.sub,
        rating,
        comment,
      });

      return res.status(201).json({ message: 'Feedback submitted', data: feedback });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  static async getMyFeedback(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      const items = await Feedback.find({ user: payload.sub }).sort({ createdAt: -1 });
      return res.json({ data: items });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  static async getAllFeedback(req: AuthenticatedRequest, res: Response) {
    try {
      const items = await Feedback.find({})
        .populate('user', 'username email firstName lastName')
        .sort({ createdAt: -1 });

      return res.json({ data: items });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
}
