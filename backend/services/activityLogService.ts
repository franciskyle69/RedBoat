import { Request } from 'express';
import { ActivityLog } from '../models/ActivityLog';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth';

interface LogParams {
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  status?: 'success' | 'failure';
  actorEmail?: string;
}

export async function logActivity(req: Request | AuthenticatedRequest, params: LogParams) {
  try {
    const authReq = req as AuthenticatedRequest;
    const actorId = authReq.user?.sub ? new mongoose.Types.ObjectId(authReq.user.sub) : undefined;
    const actorEmail = params.actorEmail || authReq.user?.email;
    const actorRole = authReq.user?.role;

    await ActivityLog.create({
      actorId,
      actorEmail,
      actorRole,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      details: params.details,
      status: params.status || 'success',
      ip: (req.headers['x-forwarded-for'] as string) || req.ip,
      userAgent: req.headers['user-agent'] as string,
    });
  } catch (err) {
    console.error('Failed to write activity log', err);
  }
}
