import { Response } from 'express';
import { ActivityLog } from '../models/ActivityLog';
import { AuthenticatedRequest } from '../middleware/auth';

export class ActivityLogController {
  static async getLogs(req: AuthenticatedRequest, res: Response) {
    try {
      const { page = '1', limit = '20', q, dateFrom, dateTo } = req.query as Record<string, string | undefined>;

      const pageNum = Math.max(parseInt(page, 10) || 1, 1);
      const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
      const skip = (pageNum - 1) * limitNum;

      const filter: any = {};
      if (q && q.trim()) {
        const term = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        filter.$or = [
          { actorEmail: new RegExp(term, 'i') },
          { action: new RegExp(term, 'i') },
          { resource: new RegExp(term, 'i') },
        ];
      }
      if (dateFrom || dateTo) {
        filter.createdAt = {};
        if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
        if (dateTo) filter.createdAt.$lte = new Date(dateTo);
      }

      const [items, total] = await Promise.all([
        ActivityLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
        ActivityLog.countDocuments(filter),
      ]);

      return res.json({
        data: items,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum) || 1,
        },
      });
    } catch (err) {
      console.error('Activity logs fetch error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
}
