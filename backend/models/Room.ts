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
  housekeepingStatus?: 'clean' | 'dirty' | 'in-progress';
  lastCleanedAt?: Date;
  assignedHousekeeper?: string;
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
  housekeepingStatus: { type: String, enum: ['clean', 'dirty', 'in-progress'], default: 'clean' },
  lastCleanedAt: { type: Date },
  assignedHousekeeper: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Database indexes for frequently queried fields
RoomSchema.index({ isAvailable: 1 }); // Available rooms filter
RoomSchema.index({ roomType: 1 }); // Room type filter
RoomSchema.index({ housekeepingStatus: 1 }); // Housekeeping dashboard
RoomSchema.index({ price: 1 }); // Price sorting/filtering

export const Room = mongoose.model<IRoom>("Room", RoomSchema);
