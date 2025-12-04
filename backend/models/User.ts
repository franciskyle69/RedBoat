import mongoose, { Document, Schema } from 'mongoose';

export interface AdminPermissions {
  manageBookings?: boolean;
  manageRooms?: boolean;
  manageHousekeeping?: boolean;
  manageUsers?: boolean;
  viewReports?: boolean;
}

export interface IUser extends Document {
  username?: string;
  email: string;
  password?: string;
  authProvider?: 'local' | 'google';
  firstName: string;
  lastName: string;
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
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: false, unique: true, sparse: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
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
    manageBookings: { type: Boolean, default: true },
    manageRooms: { type: Boolean, default: true },
    manageHousekeeping: { type: Boolean, default: true },
    manageUsers: { type: Boolean, default: true },
    viewReports: { type: Boolean, default: true }
  },
  isEmailVerified: { type: Boolean, default: false },
  emailNotifications: { type: Boolean, default: true },
  profilePicture: { type: String, required: false },
  googleCalendarTokens: {
    accessToken: { type: String, required: false },
    refreshToken: { type: String, required: false },
    expiryDate: { type: Date, required: false }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const User = mongoose.model<IUser>("User", UserSchema);
