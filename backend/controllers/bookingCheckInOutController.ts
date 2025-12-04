import { Response } from 'express';
import mongoose from 'mongoose';
import { Booking } from '../models/Booking';
import { Room } from '../models/Room';
import { NotificationController } from './notificationController';
import { AuthenticatedRequest } from '../middleware/auth';
import { sendAppEmail, buildBookingSummaryHtml, BookingSummaryDetails, buildChargeBreakdownHtml, getBookingReference } from '../services/emailService';

const formatDateShort = (date: Date | string | undefined): string | undefined => {
  if (!date) return undefined;
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString();
};

const buildBookingSummary = (booking: any, overrides: Partial<BookingSummaryDetails> = {}): string => {
  const room: any = booking.room;
  const roomLabel = room ? `Room ${room.roomNumber}${room.roomType ? ` • ${room.roomType}` : ''}` : undefined;
  let nights: number | undefined;
  if (booking.checkInDate && booking.checkOutDate) {
    const inDate = new Date(booking.checkInDate);
    const outDate = new Date(booking.checkOutDate);
    if (!Number.isNaN(inDate.getTime()) && !Number.isNaN(outDate.getTime())) {
      nights = Math.ceil((outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24));
    }
  }
  const totalAmount = booking.totalAmount != null ? `₱${Number(booking.totalAmount).toFixed(2)}` : undefined;
  const base: BookingSummaryDetails = {
    reference: booking._id ? getBookingReference(String(booking._id)) : undefined,
    room: roomLabel,
    checkIn: formatDateShort(booking.checkInDate),
    checkOut: formatDateShort(booking.checkOutDate),
    nights,
    guests: booking.numberOfGuests,
    totalAmount,
    bookingStatus: booking.status,
    paymentStatus: booking.paymentStatus,
  };
  return buildBookingSummaryHtml({ ...base, ...overrides });
};

export { buildBookingSummary, formatDateShort };

// Note: Check-in and check-out methods are complex (~300 lines each).
// They remain in the original bookingController.ts for now.
// This file serves as a placeholder for future refactoring.
