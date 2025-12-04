import React from "react";
import { getBookingReference, getPaymentReference } from "../../api/bookings";

interface BookingDetailsModalProps {
  booking: any;
  formatDate: (d: string) => string;
  adminNotes: string;
  setAdminNotes: (v: string) => void;
  updatePaymentStatus: (bookingId: string, status: "pending" | "paid" | "refunded") => Promise<void> | void;
  updateBookingStatus: (bookingId: string, status: string) => Promise<void> | void;
  onClose: () => void;
}

export default function BookingDetailsModal({ booking, formatDate, adminNotes, setAdminNotes, updatePaymentStatus, updateBookingStatus, onClose }: BookingDetailsModalProps) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Booking Details</h3>
          <button 
            className="modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="booking-details">
            <div className="detail-row">
              <strong>Booking Reference:</strong>{" "}
              <span style={{ 
                fontFamily: 'monospace', 
                fontWeight: 600,
                color: '#6366f1',
                fontSize: '1rem',
                background: '#eef2ff',
                padding: '2px 8px',
                borderRadius: '4px'
              }}>
                {getBookingReference(booking)}
              </span>
            </div>
            <div className="detail-row">
              <strong>Guest:</strong> {booking.user.username}
            </div>
            <div className="detail-row">
              <strong>Room:</strong> {booking.room.roomNumber} ({booking.room.roomType})
            </div>
            <div className="detail-row">
              <strong>Check-in:</strong> {formatDate(booking.checkInDate)}
            </div>
            <div className="detail-row">
              <strong>Check-out:</strong> {formatDate(booking.checkOutDate)}
            </div>
            <div className="detail-row">
              <strong>Guests:</strong> {booking.numberOfGuests}
            </div>
            <div className="detail-row">
              <strong>Total Amount:</strong> ₱{booking.totalAmount}
            </div>
            <div className="detail-row">
              <strong>Status:</strong> 
              <span 
                className="status-badge"
                style={{ backgroundColor: booking.status === "pending" ? "#f59e0b" : booking.status === "confirmed" ? "#10b981" : booking.status === "checked-in" ? "#3b82f6" : booking.status === "checked-out" ? "#6b7280" : "#ef4444" }}
              >
                {booking.status.replace("-", " ").toUpperCase()}
              </span>
            </div>
            <div className="detail-row">
              <strong>Payment Status:</strong> 
              <span 
                className="status-badge"
                style={{ 
                  backgroundColor: booking.paymentStatus === "paid" ? "#10b981" : booking.paymentStatus === "pending" ? "#f59e0b" : "#ef4444",
                  marginLeft: "8px"
                }}
              >
                {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
              </span>
              {booking.paymentStatus === "paid" && (
                <span style={{ 
                  marginLeft: "12px",
                  fontFamily: 'monospace', 
                  fontWeight: 600,
                  color: '#10b981',
                  fontSize: '0.9rem',
                  background: '#ecfdf5',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  {getPaymentReference(booking._id)}
                </span>
              )}
              <div style={{ marginTop: "10px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {booking.paymentStatus !== "paid" && (
                  <button
                    onClick={() => updatePaymentStatus(booking._id, "paid")}
                    style={{
                      backgroundColor: "#10b981",
                      color: "white",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "14px"
                    }}
                  >
                    Mark as Paid
                  </button>
                )}
                {booking.paymentStatus !== "refunded" && booking.paymentStatus === "paid" && (
                  <button
                    onClick={() => updatePaymentStatus(booking._id, "refunded")}
                    style={{
                      backgroundColor: "#ef4444",
                      color: "white",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "14px"
                    }}
                  >
                    Mark as Refunded
                  </button>
                )}
                {/* Only show "Mark as Pending" if payment is refunded (not if paid - unfair to user who already paid) */}
                {booking.paymentStatus === "refunded" && (
                  <button
                    onClick={() => updatePaymentStatus(booking._id, "pending")}
                    style={{
                      backgroundColor: "#f59e0b",
                      color: "white",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "14px"
                    }}
                  >
                    Mark as Pending
                  </button>
                )}
              </div>
            </div>
            {booking.specialRequests && (
              <div className="detail-row">
                <strong>Special Requests:</strong> {booking.specialRequests}
              </div>
            )}
            {booking.adminNotes && (
              <div className="detail-row">
                <strong>Admin Notes:</strong> {booking.adminNotes}
              </div>
            )}
          </div>
          {booking.status === "pending" && (
            <div className="modal-actions">
              <textarea
                placeholder="Add admin notes (optional)"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="admin-notes-input"
              />
              <div className="modal-buttons">
                <button 
                  className="btn-accept"
                  onClick={() => updateBookingStatus(booking._id, "confirmed")}
                >
                  Accept Booking
                </button>
                <button 
                  className="btn-decline"
                  onClick={() => updateBookingStatus(booking._id, "cancelled")}
                >
                  Decline Booking
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
