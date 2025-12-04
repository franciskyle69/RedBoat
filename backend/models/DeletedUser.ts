import mongoose, { Document, Schema } from 'mongoose';
import { AdminPermissions } from './User';

export interface IDeletedUser extends Document {
  // Original user ID for reference
  originalUserId: mongoose.Types.ObjectId;
  
  // All original user data
  username?: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  authProvider?: 'local' | 'google';
  phoneNumber?: string;
  dateOfBirth?: Date;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  role: 'user' | 'admin' | 'superadmin';
  adminPermissions?: AdminPermissions;
  isEmailVerified: boolean;
  emailNotifications?: boolean;
  profilePicture?: string;
  googleCalendarTokens?: {
    accessToken?: string;
    refreshToken?: string;
    expiryDate?: Date;
  };
  
  // Original timestamps
  originalCreatedAt: Date;
  originalUpdatedAt: Date;
  
  // Deletion metadata
  deletedAt: Date;
  deletedBy: mongoose.Types.ObjectId; // Who deleted (self or admin)
  deletionReason?: string;
  
  // Auto-purge date (optional - when this backup will be permanently removed)
  expiresAt?: Date;
}

const DeletedUserSchema = new Schema<IDeletedUser>({
  originalUserId: { type: Schema.Types.ObjectId, required: true, index: true },
  
  username: { type: String, required: false },
  email: { type: String, required: true, index: true },
  password: { type: String, required: false },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  authProvider: { type: String, enum: ["local", "google"], required: false },
  phoneNumber: { type: String, required: false },
  dateOfBirth: { type: Date, required: false },
  address: {
    street: { type: String, required: false },
    city: { type: String, required: false },
    state: { type: String, required: false },
    zipCode: { type: String, required: false },
    country: { type: String, required: false }
  },
  role: { type: String, enum: ["user", "admin", "superadmin"], default: "user" },
  adminPermissions: {
    manageBookings: { type: Boolean, required: false },
    manageRooms: { type: Boolean, required: false },
    manageHousekeeping: { type: Boolean, required: false },
    manageUsers: { type: Boolean, required: false },
    viewReports: { type: Boolean, required: false }
  },
  isEmailVerified: { type: Boolean, default: false },
  emailNotifications: { type: Boolean, default: true },
  profilePicture: { type: String, required: false },
  googleCalendarTokens: {
    accessToken: { type: String, required: false },
    refreshToken: { type: String, required: false },
    expiryDate: { type: Date, required: false }
  },
  
  originalCreatedAt: { type: Date, required: true },
  originalUpdatedAt: { type: Date, required: true },
  
  deletedAt: { type: Date, default: Date.now, index: true },
  deletedBy: { type: Schema.Types.ObjectId, required: true },
  deletionReason: { type: String, required: false },
  
  // TTL index - MongoDB will auto-delete documents after expiresAt
  expiresAt: { type: Date, required: false, index: { expireAfterSeconds: 0 } },
});

export const DeletedUser = mongoose.model<IDeletedUser>("DeletedUser", DeletedUserSchema);
