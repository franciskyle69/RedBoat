import React from "react";

interface CheckInModalProps {
  booking: any;
  formatDate: (d: string) => string;
  paymentStatus: string;
  updatePaymentStatus: (bookingId: string, status: "pending" | "paid" | "refunded") => Promise<void> | void;
  checkInNotes: string;
  setCheckInNotes: (v: string) => void;
  checkInAdditionalCharges: string;
  setCheckInAdditionalCharges: (v: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export default function CheckInModal({ booking, formatDate, paymentStatus, updatePaymentStatus, checkInNotes, setCheckInNotes, checkInAdditionalCharges, setCheckInAdditionalCharges, onConfirm, onClose }: CheckInModalProps) {
  const paymentBg = paymentStatus === "paid" ? "#10b981" : paymentStatus === "pending" ? "#f59e0b" : "#ef4444";
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Check-in Guest</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="booking-details">
            <div className="detail-row">
              <strong>Guest:</strong> {booking.user.username}
            </div>
            <div className="detail-row">
              <strong>Room:</strong> {booking.room.roomNumber} ({booking.room.roomType})
            </div>
            <div className="detail-row">
              <strong>Scheduled Check-in:</strong> {formatDate(booking.checkInDate)}
            </div>
            <div className="detail-row">
              <strong>Payment Status:</strong>
              <span className="status-badge" style={{ backgroundColor: paymentBg, marginLeft: "8px" }}>
                {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
              </span>
              <div style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
                {paymentStatus !== "paid" && (
                  <button onClick={() => updatePaymentStatus(booking._id, "paid")} style={{ backgroundColor: "#10b981", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "14px" }}>Mark as Paid</button>
                )}
                {paymentStatus !== "refunded" && paymentStatus === "paid" && (
                  <button onClick={() => updatePaymentStatus(booking._id, "refunded")} style={{ backgroundColor: "#ef4444", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "14px" }}>Mark as Refunded</button>
                )}
                {paymentStatus !== "pending" && (
                  <button onClick={() => updatePaymentStatus(booking._id, "pending")} style={{ backgroundColor: "#f59e0b", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "14px" }}>Mark as Pending</button>
                )}
              </div>
            </div>
          </div>
          <div style={{ marginTop: '20px' }}>
            <label>
              Check-in Notes (Optional):
              <textarea
                value={checkInNotes}
                onChange={(e) => setCheckInNotes(e.target.value)}
                placeholder="Add any notes about the check-in process..."
                style={{ width: '100%', minHeight: '80px', marginTop: '8px', padding: '8px' }}
              />
            </label>
            <label style={{ display: 'block', marginTop: '15px' }}>
              Additional Charges (Optional):
              <input
                type="number"
                step="0.01"
                min="0"
                value={checkInAdditionalCharges}
                onChange={(e) => setCheckInAdditionalCharges(e.target.value)}
                placeholder="0.00"
                style={{ width: '100%', marginTop: '8px', padding: '8px' }}
              />
            </label>
          </div>
          <div className="modal-footer" style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-checkin" onClick={onConfirm}>Confirm Check-in</button>
          </div>
        </div>
      </div>
    </div>
  );
}
