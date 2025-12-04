import type { BookingStatus } from "../api/bookings";

export function getBookingStatusColor(status: BookingStatus): string {
  switch (status) {
    case "pending":
      return "#f59e0b";
    case "confirmed":
      return "#10b981";
    case "checked-in":
      return "#3b82f6";
    case "checked-out":
      return "#6b7280";
    case "cancelled":
      return "#ef4444";
    default:
      return "#6b7280";
  }
}

export function getBookingStatusLabel(status: BookingStatus): string {
  switch (status) {
    case "pending":
      return "Pending Approval";
    case "confirmed":
      return "Confirmed";
    case "checked-in":
      return "Checked In";
    case "checked-out":
      return "Checked Out";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}
