import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { Notification } from '../models/Notification';

export class NotificationController {
  static async list(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      const items = await Notification.find({ user: payload.sub })
        .sort({ createdAt: -1 })
        .limit(100);
      res.json({ data: items });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async markAllRead(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      await Notification.updateMany({ user: payload.sub, isRead: false }, { isRead: true });
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async createForUser(userId: string, type: 'info' | 'success' | 'warning' | 'error', message: string, href?: string) {
    try {
      await Notification.create({ user: userId, type, message, href });
    } catch (err) {
      console.error('Failed to create notification:', err);
    }
  }
}


