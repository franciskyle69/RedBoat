import React, { useState, useEffect } from "react";

interface Room {
  _id: string;
  roomNumber: string;
  roomType: string;
  price: number;
  capacity: number;
  isAvailable: boolean;
}

interface WalkInBookingModalProps {
  onSubmit: (data: {
    roomId: string;
    guestName: string;
    contactNumber: string;
    checkInDate: string;
    checkOutDate: string;
    numberOfGuests: number;
    specialRequests?: string;
  }) => Promise<void>;
  onClose: () => void;
  preselectedRoomId?: string;
  preselectedCheckInDate?: string;
}

// Format price with comma separators for consistency
const formatPrice = (price: number) => {
  return price.toLocaleString('en-PH');
};

export default function WalkInBookingModal({ 
  onSubmit, 
  onClose,
  preselectedRoomId,
  preselectedCheckInDate 
}: WalkInBookingModalProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    roomId: preselectedRoomId || "",
    guestName: "",
    contactNumber: "",
    checkInDate: preselectedCheckInDate || new Date().toISOString().split("T")[0],
    checkOutDate: "",
    numberOfGuests: 1,
    specialRequests: "",
  });

  const selectedRoom = rooms.find(r => r._id === formData.roomId);

  useEffect(() => {
    fetchRooms();
  }, []);

  // Update form when preselected values change
  useEffect(() => {
    if (preselectedRoomId && !formData.roomId) {
      setFormData(prev => ({ ...prev, roomId: preselectedRoomId }));
    }
  }, [preselectedRoomId, rooms]);

  useEffect(() => {
    if (preselectedCheckInDate && formData.checkInDate !== preselectedCheckInDate) {
      setFormData(prev => ({ ...prev, checkInDate: preselectedCheckInDate }));
    }
  }, [preselectedCheckInDate]);

  const fetchRooms = async () => {
    try {
      const response = await fetch("http://localhost:5000/rooms", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        // Filter to only available rooms
        const availableRooms = (data.data || []).filter((r: Room) => r.isAvailable);
        setRooms(availableRooms);
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoadingRooms(false);
    }
  };

  const calculateTotal = () => {
    if (!selectedRoom || !formData.checkInDate || !formData.checkOutDate) return 0;
    
    const checkIn = new Date(formData.checkInDate);
    const checkOut = new Date(formData.checkOutDate);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    
    if (nights <= 0) return 0;
    
    const baseAmount = selectedRoom.price * nights;
    const extraPersons = Math.max(0, formData.numberOfGuests - selectedRoom.capacity);
    const extraPersonCharge = extraPersons * 300 * nights;
    
    return baseAmount + extraPersonCharge;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.roomId || !formData.guestName || !formData.contactNumber || 
        !formData.checkInDate || !formData.checkOutDate) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        roomId: formData.roomId,
        guestName: formData.guestName,
        contactNumber: formData.contactNumber,
        checkInDate: formData.checkInDate,
        checkOutDate: formData.checkOutDate,
        numberOfGuests: formData.numberOfGuests,
        specialRequests: formData.specialRequests || undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const nights = formData.checkInDate && formData.checkOutDate
    ? Math.ceil((new Date(formData.checkOutDate).getTime() - new Date(formData.checkInDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: "600px" }}>
        <div className="modal-header">
          <h3>Create Walk-in Booking</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {loadingRooms ? (
            <div className="loading">Loading rooms...</div>
          ) : rooms.length === 0 ? (
            <div className="no-rooms">
              <p>No available rooms at the moment.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="booking-form">
              <div className="form-group">
                <label>Room *</label>
                <select
                  value={formData.roomId}
                  onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                  required
                >
                  <option value="">Select a room</option>
                  {rooms.map((room) => (
                    <option key={room._id} value={room._id}>
                      Room {room.roomNumber} - {room.roomType} (₱{formatPrice(room.price)}/night, up to {room.capacity} guests)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Guest Name *</label>
                <input
                  type="text"
                  value={formData.guestName}
                  onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                  placeholder="Full name of the guest"
                  required
                />
              </div>

              <div className="form-group">
                <label>Contact Number *</label>
                <input
                  type="tel"
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  placeholder="09xx xxx xxxx"
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="form-group">
                  <label>Check-in Date *</label>
                  <input
                    type="date"
                    value={formData.checkInDate}
                    onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Check-out Date *</label>
                  <input
                    type="date"
                    value={formData.checkOutDate}
                    onChange={(e) => setFormData({ ...formData, checkOutDate: e.target.value })}
                    min={formData.checkInDate || new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Number of Guests *</label>
                <select
                  value={formData.numberOfGuests}
                  onChange={(e) => setFormData({ ...formData, numberOfGuests: parseInt(e.target.value) })}
                  required
                >
                  {Array.from({ length: Math.max(8, (selectedRoom?.capacity || 2) + 4) }, (_, i) => {
                    const guestCount = i + 1;
                    const isOverCapacity = selectedRoom && guestCount > selectedRoom.capacity;
                    return (
                      <option key={guestCount} value={guestCount}>
                        {guestCount} {guestCount === 1 ? "Guest" : "Guests"}
                        {isOverCapacity && " (+₱300/night per extra person)"}
                      </option>
                    );
                  })}
                </select>
                {selectedRoom && formData.numberOfGuests > selectedRoom.capacity && (
                  <small style={{ color: "#f59e0b", marginTop: "4px", display: "block" }}>
                    ⚠️ {formData.numberOfGuests - selectedRoom.capacity} extra guest(s) will incur additional charges.
                  </small>
                )}
              </div>

              <div className="form-group">
                <label>Special Requests (Optional)</label>
                <textarea
                  value={formData.specialRequests}
                  onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                  placeholder="Any special requests or notes..."
                  rows={3}
                />
              </div>

              {selectedRoom && nights > 0 && (
                <div className="booking-summary" style={{ 
                  background: "#f8fafc", 
                  padding: "16px", 
                  borderRadius: "8px",
                  marginBottom: "16px"
                }}>
                  <h4 style={{ marginBottom: "12px", color: "#334155" }}>Booking Summary</h4>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span>Room:</span>
                    <span>Room {selectedRoom.roomNumber} ({selectedRoom.roomType})</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span>Price per night:</span>
                    <span>₱{formatPrice(selectedRoom.price)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span>Nights:</span>
                    <span>{nights}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span>Base Amount:</span>
                    <span>₱{formatPrice(selectedRoom.price * nights)}</span>
                  </div>
                  {formData.numberOfGuests > selectedRoom.capacity && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", color: "#f59e0b" }}>
                      <span>Extra Person Charge:</span>
                      <span>₱{formatPrice((formData.numberOfGuests - selectedRoom.capacity) * 300 * nights)}</span>
                    </div>
                  )}
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    fontWeight: "bold",
                    borderTop: "1px solid #e2e8f0",
                    paddingTop: "8px",
                    marginTop: "8px"
                  }}>
                    <span>Total Amount:</span>
                    <span>₱{formatPrice(calculateTotal())}</span>
                  </div>
                </div>
              )}

              <div className="modal-buttons" style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={onClose}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-accept"
                  disabled={submitting || !formData.roomId || nights <= 0}
                >
                  {submitting ? "Creating..." : "Create Booking"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
