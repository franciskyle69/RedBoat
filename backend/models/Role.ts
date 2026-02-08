import mongoose, { Document, Schema } from 'mongoose';

export interface RolePermissions {
  manageBookings?: boolean;
  manageRooms?: boolean;
  manageHousekeeping?: boolean;
  manageUsers?: boolean;
  viewReports?: boolean;
}

export interface IRole extends Document {
  name: string;
  permissions: RolePermissions;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<IRole>({
  name: { type: String, required: true, unique: true, trim: true },
  permissions: {
    manageBookings: { type: Boolean, default: true },
    manageRooms: { type: Boolean, default: true },
    manageHousekeeping: { type: Boolean, default: true },
    manageUsers: { type: Boolean, default: true },
    viewReports: { type: Boolean, default: true },
  },
  isSystem: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

RoleSchema.index({ name: 1 });

export const Role = mongoose.model<IRole>('Role', RoleSchema);
