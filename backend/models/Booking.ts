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
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const Booking = mongoose.model<IBooking>("Booking", BookingSchema);
