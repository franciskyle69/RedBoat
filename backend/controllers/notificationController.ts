import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { Notification } from '../models/Notification';

export class NotificationController {
  // In-memory SSE client registry keyed by userId
  private static sseClients: Map<string, Set<Response>> = new Map();

  static async list(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      const { lastId, limit } = (req.query as any) as { lastId?: string; limit?: string };
      const take = Math.max(1, Math.min(parseInt(limit || '20', 10) || 20, 100));

      const query: any = { user: payload.sub };
      if (lastId) {
        query._id = { $lt: lastId };
      }
      const items = await Notification.find(query)
        .sort({ _id: -1 })
        .limit(take + 1);

      const hasMore = items.length > take;
      const sliced = hasMore ? items.slice(0, take) : items;
      res.json({ data: sliced, hasMore });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      const { type, message, href } = req.body as { type?: 'info' | 'success' | 'warning' | 'error'; message?: string; href?: string };
      const t = (type || 'info');
      const msg = (message || '').toString().trim();
      if (!msg) return res.status(400).json({ message: 'Message is required' });
      if (!['info', 'success', 'warning', 'error'].includes(t)) return res.status(400).json({ message: 'Invalid type' });
      const safeMsg = msg.slice(0, 500);
      const safeHref = href && typeof href === 'string' ? href.slice(0, 300) : undefined;
      const created = await Notification.create({ user: payload.sub, type: t as any, message: safeMsg, href: safeHref });
      NotificationController.broadcastToUser(payload.sub, created);
      res.status(201).json({ data: created });
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
      const created = await Notification.create({ user: userId, type, message, href });
      NotificationController.broadcastToUser(userId, created);
    } catch (err) {
      console.error('Failed to create notification:', err);
    }
  }

  static async markRead(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      const id = (req.params as any).id as string;
      const notif = await Notification.findOne({ _id: id, user: payload.sub });
      if (!notif) return res.status(404).json({ message: 'Not found' });
      if (!notif.isRead) {
        notif.isRead = true;
        await notif.save();
      }
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async remove(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      const id = (req.params as any).id as string;
      const deleted = await Notification.findOneAndDelete({ _id: id, user: payload.sub });
      if (!deleted) return res.status(404).json({ message: 'Not found' });
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }

  static stream(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      const userId = payload.sub;
      const set = NotificationController.sseClients.get(userId) || new Set<Response>();
      set.add(res);
      NotificationController.sseClients.set(userId, set);

      const keepAlive = setInterval(() => {
        try { res.write(`:\n\n`); } catch {}
      }, 25000);

      req.on('close', () => {
        clearInterval(keepAlive);
        const clients = NotificationController.sseClients.get(userId);
        if (clients) {
          clients.delete(res);
          if (clients.size === 0) NotificationController.sseClients.delete(userId);
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).end();
    }
  }

  private static broadcastToUser(userId: string, notification: any) {
    const clients = NotificationController.sseClients.get(userId);
    if (!clients || clients.size === 0) return;
    const payload = JSON.stringify(notification);
    for (const client of clients) {
      try {
        client.write(`data: ${payload}\n\n`);
      } catch {}
    }
  }
}


