import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  user: mongoose.Types.ObjectId; // FK to User
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  href?: string;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
  message: { type: String, required: true },
  href: { type: String },
  isRead: { type: Boolean, default: false, index: true },
  createdAt: { type: Date, default: Date.now, index: true }
});

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);


