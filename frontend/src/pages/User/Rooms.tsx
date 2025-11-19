import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import RoomCalendar from "../../components/RoomCalendar";
import { useNotifications } from "../../contexts/NotificationContext";
import "../../styles/main.css";
import UserLayout from "../../components/UserLayout";

interface Room {
  _id: string;
  roomNumber: string;
  roomType: string;
  price: number;
  capacity: number;
  amenities: string[];
  description: string;
  isAvailable: boolean;
  images?: string[];
}

const resolveRoomImageSrc = (src: string) => {
  // Keep absolute URLs and placeholder paths as-is
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("/images") || src.startsWith("images/")) return src;

  // Map upload paths to backend
  if (src.startsWith("/uploads") || src.startsWith("uploads/")) {
    const normalized = src.startsWith("/") ? src : `/${src}`;
    return `http://localhost:5000${normalized}`;
  }

  return src;
};

function Rooms() {
  const navigate = useNavigate();
  const { notify } = useNotifications();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingImageIndex, setBookingImageIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedRoomNumber, setSelectedRoomNumber] = useState<string | null>(null);
  const [bookingForm, setBookingForm] = useState({
    guestName: "",
    contactNumber: "",
    checkInDate: "",
    checkOutDate: "",
    numberOfGuests: 1,
    specialRequests: "",
  });

  // Images for the booking modal carousel (selected room or placeholder)
  const bookingImages = selectedRoom && selectedRoom.images && selectedRoom.images.length > 0
    ? selectedRoom.images.slice(0, 5)
    : ["/room-placeholder.jpg"];

  // Auto-advance carousel while modal is open
  useEffect(() => {
    // Reset index whenever modal opens or selected room changes
    setBookingImageIndex(0);

    if (!showBookingModal || bookingImages.length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      setBookingImageIndex(prev => (prev + 1) % bookingImages.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [showBookingModal, selectedRoom, bookingImages.length]);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch("http://localhost:5000/rooms", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setRooms(data.data);
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookRoom = (room: Room) => {
    setSelectedRoom(room);
    setShowBookingModal(true);
  };

  const handleCalendarDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedRoomNumber(null);
    
    // Navigate to bookings page with the selected date
    const dateString = date.toISOString().split('T')[0];
    navigate(`/user/bookings?date=${dateString}`);
  };

  const handleCalendarRoomSelect = (roomNumber: string, date: Date) => {
    setSelectedRoomNumber(roomNumber);
    setSelectedDate(date);
    
    // Find the room and open booking modal
    const room = rooms.find(r => r.roomNumber === roomNumber);
    if (room) {
      setSelectedRoom(room);
      setBookingForm(prev => ({
        ...prev,
        checkInDate: date.toISOString().split('T')[0]
      }));
      setShowBookingModal(true);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRoom) return;

    try {
      const response = await fetch("http://localhost:5000/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          roomId: selectedRoom._id,
          ...bookingForm
        }),
      });

      if (response.ok) {
        notify("Booking request submitted. Waiting for admin confirmation.", "success", 4000, "/user/bookings");
        setShowBookingModal(false);
        setSelectedRoom(null);
        setBookingForm({
          guestName: "",
          contactNumber: "",
          checkInDate: "",
          checkOutDate: "",
          numberOfGuests: 1,
          specialRequests: "",
        });
      } else {
        const error = await response.json();
        notify(error.message || "Failed to submit booking request", "error");
      }
    } catch (error) {
      console.error("Error submitting booking:", error);
      notify("Error submitting booking request", "error");
    }
  };

  const getRoomTypeColor = (roomType: string) => {
    switch (roomType) {
      case "Standard": return "#10b981";
      case "Deluxe": return "#3b82f6";
      case "Suite": return "#8b5cf6";
      case "Presidential": return "#f59e0b";
      default: return "#6b7280";
    }
  };

  const calculateTotalPrice = (room: Room, checkInDate: string, checkOutDate: string, numberOfGuests: number) => {
    if (!checkInDate || !checkOutDate) return 0;
    
    const nights = Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24));
    const basePrice = room.price * nights;
    
    // Add 300 pesos per night for each additional person beyond room capacity
    const extraPersons = Math.max(0, numberOfGuests - room.capacity);
    const extraPersonCharge = extraPersons * 300 * nights;
    
    return basePrice + extraPersonCharge;
  };

  if (loading) {
    return (
      <UserLayout pageTitle="Available Rooms">
        <div className="loading">Loading rooms...</div>
      </UserLayout>
    );
  }

  return (
    <UserLayout pageTitle="Available Rooms">
      <div className="rooms-content">
        <div className="rooms-header">
          <h3>Choose Your Perfect Room</h3>
          <p>Select from our available rooms and book your stay</p>
          
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              Grid View
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode('calendar')}
            >
              Calendar View
            </button>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <div className="rooms-grid">
            {rooms.map((room) => (
              <div key={room._id} className="room-card">
                <div className="room-header">
                  <div className="room-number">Room {room.roomNumber}</div>
                  <div 
                    className="room-type-badge"
                    style={{ backgroundColor: getRoomTypeColor(room.roomType) }}
                  >
                    {room.roomType}
                  </div>
                </div>
                {/* Single thumbnail preview filling the card top */}
                <div className="room-images-strip" style={{ width: "100%", marginBottom: "12px" }}>
                  <img
                    src={resolveRoomImageSrc((room.images && room.images[0]) || "/room-placeholder.jpg")}
                    alt={`Room ${room.roomNumber} thumbnail`}
                    style={{
                      width: "100%",
                      height: 220,
                      borderRadius: "10px 10px 0 0",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </div>
                
                <div className="room-details">
                  <div className="room-price">₱{room.price}/night</div>
                  <div className="room-capacity">Up to {room.capacity} guests</div>
                  <div className="room-description">{room.description}</div>
                  
                  <div className="room-amenities">
                    <h4>Amenities:</h4>
                    <div className="amenities-list">
                      {room.amenities.map((amenity, index) => (
                        <span key={index} className="amenity-tag">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <button 
                  className="book-room-btn"
                  onClick={() => handleBookRoom(room)}
                >
                  Book This Room
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="calendar-view">
            <RoomCalendar 
              onDateSelect={handleCalendarDateSelect}
              onRoomSelect={handleCalendarRoomSelect}
            />
            
            {selectedDate && (
              <div className="selected-date-info">
                <h3>Selected Date: {selectedDate.toLocaleDateString()}</h3>
                <p>Click on a room to book for this date, or view your bookings for this date.</p>
                <div className="date-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      const dateString = selectedDate.toISOString().split('T')[0];
                      navigate(`/user/bookings?date=${dateString}`);
                    }}
                  >
                    View Bookings for This Date
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setSelectedDate(null)}
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {rooms.length === 0 && (
          <div className="no-rooms">
            <p>No rooms available at the moment. Please check back later.</p>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedRoom && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Book Room {selectedRoom.roomNumber}</h3>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowBookingModal(false);
                  setSelectedRoom(null);
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {/* Full image carousel with controls */}
              <div
                className="room-images-strip"
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: '24px',
                  position: 'relative',
                }}
              >
                <img
                  src={resolveRoomImageSrc(bookingImages[bookingImageIndex])}
                  alt={`Room ${selectedRoom.roomNumber} image ${bookingImageIndex + 1}`}
                  style={{
                    width: '100%',
                    maxWidth: 720,
                    height: 360,
                    borderRadius: 16,
                    objectFit: 'cover',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
                  }}
                />
                {bookingImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setBookingImageIndex((bookingImageIndex - 1 + bookingImages.length) % bookingImages.length)}
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: 8,
                        transform: 'translateY(-50%)',
                        borderRadius: '999px',
                        border: 'none',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        backgroundColor: 'rgba(0,0,0,0.4)',
                        color: 'white',
                      }}
                    >
                      &lt;
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingImageIndex((bookingImageIndex + 1) % bookingImages.length)}
                      style={{
                        position: 'absolute',
                        top: '50%',
                        right: 8,
                        transform: 'translateY(-50%)',
                        borderRadius: '999px',
                        border: 'none',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        backgroundColor: 'rgba(0,0,0,0.4)',
                        color: 'white',
                      }}
                    >
                      &gt;
                    </button>
                  </>
                )}
              </div>

              <form onSubmit={handleBookingSubmit} className="booking-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={bookingForm.guestName}
                    onChange={(e) => setBookingForm({ ...bookingForm, guestName: e.target.value })}
                    placeholder="Your full name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Contact Number</label>
                  <input
                    type="tel"
                    value={bookingForm.contactNumber}
                    onChange={(e) => setBookingForm({ ...bookingForm, contactNumber: e.target.value })}
                    placeholder="09xx xxx xxxx"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Check-in Date</label>
                  <input
                    type="date"
                    value={bookingForm.checkInDate}
                    onChange={(e) => setBookingForm({...bookingForm, checkInDate: e.target.value})}
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="form-group">
                  <label>Check-out Date</label>
                  <input
                    type="date"
                    value={bookingForm.checkOutDate}
                    onChange={(e) => setBookingForm({...bookingForm, checkOutDate: e.target.value})}
                    required
                    min={bookingForm.checkInDate || new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="form-group">
                  <label>Number of Guests</label>
                  <select
                    value={bookingForm.numberOfGuests}
                    onChange={(e) => setBookingForm({...bookingForm, numberOfGuests: parseInt(e.target.value)})}
                    required
                  >
                    {Array.from({ length: Math.max(8, selectedRoom.capacity + 4) }, (_, i) => {
                      const guestCount = i + 1;
                      const isOverCapacity = guestCount > selectedRoom.capacity;
                      return (
                        <option key={guestCount} value={guestCount}>
                          {guestCount} {guestCount === 1 ? 'Guest' : 'Guests'}
                          {isOverCapacity && ` (+₱300/night per extra person)`}
                        </option>
                      );
                    })}
                  </select>
                  {bookingForm.numberOfGuests > selectedRoom.capacity && (
                    <small style={{ color: '#f59e0b', marginTop: '4px', display: 'block' }}>
                      ⚠️ {bookingForm.numberOfGuests - selectedRoom.capacity} extra guest(s) will incur additional charges of ₱300 per person per night.
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label>Special Requests (Optional)</label>
                  <textarea
                    value={bookingForm.specialRequests}
                    onChange={(e) => setBookingForm({...bookingForm, specialRequests: e.target.value})}
                    placeholder="Any special requests or preferences..."
                    rows={3}
                  />
                </div>

                <div className="booking-summary">
                  <h4>Booking Summary</h4>
                  <div className="summary-row">
                    <span>Room:</span>
                    <span>Room {selectedRoom.roomNumber} ({selectedRoom.roomType})</span>
                  </div>
                  <div className="summary-row">
                    <span>Price per night:</span>
                    <span>₱{selectedRoom.price}</span>
                  </div>
                  {bookingForm.checkInDate && bookingForm.checkOutDate && (
                    <>
                      <div className="summary-row">
                        <span>Nights:</span>
                        <span>
                          {Math.ceil((new Date(bookingForm.checkOutDate).getTime() - new Date(bookingForm.checkInDate).getTime()) / (1000 * 60 * 60 * 24))}
                        </span>
                      </div>
                      <div className="summary-row">
                        <span>Guests:</span>
                        <span>{bookingForm.numberOfGuests}</span>
                      </div>
                      <div className="summary-row">
                        <span>Base Amount:</span>
                        <span>
                          ₱{selectedRoom.price * Math.ceil((new Date(bookingForm.checkOutDate).getTime() - new Date(bookingForm.checkInDate).getTime()) / (1000 * 60 * 60 * 24))}
                        </span>
                      </div>
                      {bookingForm.numberOfGuests > selectedRoom.capacity && (
                        <div className="summary-row">
                          <span>Extra Person Charge ({bookingForm.numberOfGuests - selectedRoom.capacity} × ₱300/night):</span>
                          <span>
                            ₱{(bookingForm.numberOfGuests - selectedRoom.capacity) * 300 * Math.ceil((new Date(bookingForm.checkOutDate).getTime() - new Date(bookingForm.checkInDate).getTime()) / (1000 * 60 * 60 * 24))}
                          </span>
                        </div>
                      )}
                      <div className="summary-row total">
                        <span>Total Amount:</span>
                        <span>
                          ₱{calculateTotalPrice(selectedRoom, bookingForm.checkInDate, bookingForm.checkOutDate, bookingForm.numberOfGuests)}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="modal-buttons">
                  <button 
                    type="button"
                    className="btn-cancel"
                    onClick={() => {
                      setShowBookingModal(false);
                      setSelectedRoom(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="btn-confirm"
                  >
                    Submit Booking Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </UserLayout>
  );
}

export default Rooms;
