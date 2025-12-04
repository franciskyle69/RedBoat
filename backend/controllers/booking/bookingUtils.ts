import { buildBookingSummaryHtml, BookingSummaryDetails, getBookingReference } from '../../services/emailService';

export const formatDateShort = (date: Date | string | undefined): string | undefined => {
  if (!date) return undefined;
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString();
};

export const buildBookingSummary = (booking: any, overrides: Partial<BookingSummaryDetails> = {}): string => {
  const room: any = booking.room;
  const roomLabel = room
    ? `Room ${room.roomNumber}${room.roomType ? ` • ${room.roomType}` : ''}`
    : undefined;

  let nights: number | undefined;
  if (booking.checkInDate && booking.checkOutDate) {
    const inDate = new Date(booking.checkInDate);
    const outDate = new Date(booking.checkOutDate);
    if (!Number.isNaN(inDate.getTime()) && !Number.isNaN(outDate.getTime())) {
      nights = Math.ceil((outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24));
    }
  }

  const totalAmount = booking.totalAmount != null
    ? `₱${Number(booking.totalAmount).toFixed(2)}`
    : undefined;

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
