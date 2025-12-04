import mongoose, { Document, Schema } from 'mongoose';

export interface IRoomReview extends Document {
  user: mongoose.Types.ObjectId;
  room: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
}

const RoomReviewSchema = new Schema<IRoomReview>({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
});

RoomReviewSchema.index({ user: 1, room: 1 }, { unique: true });

export const RoomReview = mongoose.model<IRoomReview>('RoomReview', RoomReviewSchema);
