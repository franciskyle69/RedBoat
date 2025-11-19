import React from "react";

interface CheckOutModalProps {
  booking: any;
  formatDate: (d: string) => string;
  roomCondition: "excellent" | "good" | "fair" | "poor" | "damaged";
  setRoomCondition: (v: "excellent" | "good" | "fair" | "poor" | "damaged") => void;
  checkOutNotes: string;
  setCheckOutNotes: (v: string) => void;
  checkOutAdditionalCharges: string;
  setCheckOutAdditionalCharges: (v: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export default function CheckOutModal({ booking, formatDate, roomCondition, setRoomCondition, checkOutNotes, setCheckOutNotes, checkOutAdditionalCharges, setCheckOutAdditionalCharges, onConfirm, onClose }: CheckOutModalProps) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Check-out Guest</h3>
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
              <strong>Scheduled Check-out:</strong> {formatDate(booking.checkOutDate)}
            </div>
            <div className="detail-row">
              <strong>Total Amount:</strong> ₱{booking.totalAmount.toFixed(2)}
            </div>
          </div>
          <div style={{ marginTop: '20px' }}>
            <label>
              Room Condition:
              <select
                value={roomCondition}
                onChange={(e) => setRoomCondition(e.target.value as any)}
                style={{ width: '100%', marginTop: '8px', padding: '8px' }}
              >
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
                <option value="damaged">Damaged</option>
              </select>
            </label>
            <label style={{ display: 'block', marginTop: '15px' }}>
              Check-out Notes (Optional):
              <textarea
                value={checkOutNotes}
                onChange={(e) => setCheckOutNotes(e.target.value)}
                placeholder="Add any notes about the check-out process, damages, or additional information..."
                style={{ width: '100%', minHeight: '80px', marginTop: '8px', padding: '8px' }}
              />
            </label>
            <label style={{ display: 'block', marginTop: '15px' }}>
              Additional Charges (Optional):
              <input
                type="number"
                step="0.01"
                min="0"
                value={checkOutAdditionalCharges}
                onChange={(e) => setCheckOutAdditionalCharges(e.target.value)}
                placeholder="0.00"
                style={{ width: '100%', marginTop: '8px', padding: '8px' }}
              />
              <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
                Enter any additional charges (e.g., damages, extra services)
              </small>
            </label>
          </div>
          <div className="modal-footer" style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-checkout" onClick={onConfirm}>Confirm Check-out</button>
          </div>
        </div>
      </div>
    </div>
  );
}
