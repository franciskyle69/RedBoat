import mongoose, { Document, Schema } from 'mongoose';

export interface IRoom extends Document {
  roomNumber: string;
  roomType: 'Standard' | 'Deluxe' | 'Suite' | 'Presidential';
  price: number;
  capacity: number;
  amenities: string[];
  isAvailable: boolean;
  description?: string;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema = new Schema<IRoom>({
  roomNumber: { type: String, required: true, unique: true },
  roomType: { type: String, required: true, enum: ["Standard", "Deluxe", "Suite", "Presidential"] },
  price: { type: Number, required: true },
  capacity: { type: Number, required: true },
  amenities: [{ type: String }],
  isAvailable: { type: Boolean, default: true },
  description: { type: String },
  images: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const Room = mongoose.model<IRoom>("Room", RoomSchema);
