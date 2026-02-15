import mongoose, { Document, Schema } from 'mongoose';

export interface IBooking extends Document {
  user: mongoose.Types.ObjectId;
  room: mongoose.Types.ObjectId;
  checkInDate: Date;
  checkOutDate: Date;
  numberOfGuests: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled';
  guestName?: string;
  contactNumber?: string;
  specialRequests?: string;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentMethod?: 'stripe' | 'cash' | 'bank_transfer' | 'other';
  paymentDate?: Date;
  stripePaymentIntentId?: string;
  transactionId?: string;
  adminNotes?: string;
  googleCalendarEventId?: string;
  cancellationRequested?: boolean;
  cancellationReason?: string;
  // Check-in/Check-out tracking fields
  actualCheckInTime?: Date;
  actualCheckOutTime?: Date;
  checkedInBy?: mongoose.Types.ObjectId;
  checkedOutBy?: mongoose.Types.ObjectId;
  lateCheckInFee?: number;
  lateCheckOutFee?: number;
  additionalCharges?: number;
  checkoutNotes?: string;
  pendingSince?: Date;
  pendingExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
  checkInDate: { type: Date, required: true },
  checkOutDate: { type: Date, required: true },
  numberOfGuests: { type: Number, required: true, min: 1 },
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ["pending", "confirmed", "checked-in", "checked-out", "cancelled"], 
    default: "pending" 
  },
  guestName: { type: String },
  contactNumber: { type: String },
  specialRequests: { type: String },
  paymentStatus: { 
    type: String, 
    enum: ["pending", "paid", "refunded"], 
    default: "pending" 
  },
  paymentMethod: {
    type: String,
    enum: ["stripe", "cash", "bank_transfer", "other"],
  },
  paymentDate: { type: Date },
  stripePaymentIntentId: { type: String },
  transactionId: { type: String },
  adminNotes: { type: String },
  googleCalendarEventId: { type: String, required: false },
  cancellationRequested: { type: Boolean, default: false },
  cancellationReason: { type: String },
  // Check-in/Check-out tracking fields
  actualCheckInTime: { type: Date },
  actualCheckOutTime: { type: Date },
  checkedInBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  checkedOutBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  lateCheckInFee: { type: Number, default: 0 },
  lateCheckOutFee: { type: Number, default: 0 },
  additionalCharges: { type: Number, default: 0 },
  checkoutNotes: { type: String },
  pendingSince: { type: Date },
  pendingExpiresAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Database indexes for frequently queried fields
BookingSchema.index({ user: 1 }); // User's bookings lookup
BookingSchema.index({ room: 1 }); // Room's bookings lookup
BookingSchema.index({ status: 1 }); // Filter by status
BookingSchema.index({ checkInDate: 1, checkOutDate: 1 }); // Date range queries
BookingSchema.index({ room: 1, status: 1, checkInDate: 1, checkOutDate: 1 }); // Availability check
BookingSchema.index({ createdAt: -1 }); // Recent bookings sort
BookingSchema.index({ cancellationRequested: 1, status: 1 }); // Pending cancellations
BookingSchema.index({ status: 1, pendingSince: 1 });

BookingSchema.pre('save', function(next) {
  try {
    if (this.isNew) {
      if (this.status === 'pending' && !this.pendingSince) {
        this.pendingSince = new Date();
      }
    }
    if (this.isModified('status')) {
      if (this.status === 'pending' && !this.pendingSince) {
        this.pendingSince = new Date();
      }
    }
    // Maintain pendingExpiresAt if pending
    if (this.status === 'pending' && this.pendingSince) {
      const ttlHoursRaw = process.env.PENDING_TTL_HOURS;
      const ttlHours = ttlHoursRaw ? parseInt(ttlHoursRaw, 10) : 24;
      if (Number.isFinite(ttlHours) && ttlHours > 0) {
        const expires = new Date(this.pendingSince.getTime() + ttlHours * 60 * 60 * 1000);
        this.pendingExpiresAt = expires;
      }
    }
    this.updatedAt = new Date();
    next();
  } catch (e) {
    next(e as any);
  }
});

export const Booking = mongoose.model<IBooking>("Booking", BookingSchema);
