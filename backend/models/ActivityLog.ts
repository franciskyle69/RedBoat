import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ActivityLogDocument extends Document {
  actorId?: mongoose.Types.ObjectId;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ip?: string;
  userAgent?: string;
  status?: 'success' | 'failure';
  createdAt: Date;
}

const ActivityLogSchema = new Schema<ActivityLogDocument>({
  actorId: { type: Schema.Types.ObjectId, ref: 'User' },
  actorEmail: { type: String },
  actorRole: { type: String },
  action: { type: String, required: true },
  resource: { type: String, required: true },
  resourceId: { type: String },
  details: { type: Schema.Types.Mixed },
  ip: { type: String },
  userAgent: { type: String },
  status: { type: String, enum: ['success', 'failure'], default: 'success' },
  createdAt: { type: Date, default: Date.now }
}, { collection: 'activity_logs' });

ActivityLogSchema.index({ createdAt: -1 });
ActivityLogSchema.index({ action: 1, resource: 1, actorEmail: 1, actorRole: 1 });

export const ActivityLog: Model<ActivityLogDocument> = mongoose.models.ActivityLog || mongoose.model<ActivityLogDocument>('ActivityLog', ActivityLogSchema);
