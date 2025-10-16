import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import RoomCalendar from "../../components/RoomCalendar";
import "../../styles/main.css";

interface Room {
  _id: string;
  roomNumber: string;
  roomType: string;
  price: number;
  capacity: number;
  amenities: string[];
  description: string;
  isAvailable: boolean;
}

function Rooms() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedRoomNumber, setSelectedRoomNumber] = useState<string | null>(null);
  const [bookingForm, setBookingForm] = useState({
    checkInDate: "",
    checkOutDate: "",
    numberOfGuests: 1,
    specialRequests: ""
  });

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
        alert("Booking request submitted successfully! Please wait for admin approval.");
        setShowBookingModal(false);
        setSelectedRoom(null);
        setBookingForm({
          checkInDate: "",
          checkOutDate: "",
          numberOfGuests: 1,
          specialRequests: ""
        });
      } else {
        const error = await response.json();
        alert(error.message || "Failed to submit booking request");
      }
    } catch (error) {
      console.error("Error submitting booking:", error);
      alert("Error submitting booking request");
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

  if (loading) {
    return (
      <div className="user-container">
        <div className="loading">Loading rooms...</div>
      </div>
    );
  }

  return (
    <div className="user-container">
      <header className="user-header">
        <h2 className="user-title">Available Rooms</h2>
        <nav className="user-nav">
          <Link to="/dashboard" className="user-nav-link">Dashboard</Link>
          <Link to="/user/profile" className="user-nav-link">Profile</Link>
          <Link to="/user/bookings" className="user-nav-link">Bookings</Link>
          <Link to="/user/rooms" className="user-nav-link active">Rooms</Link>
          <Link to="/user/calendar" className="user-nav-link">Calendar</Link>
          <Link to="/user/feedback" className="user-nav-link">Feedback</Link>
          <Link to="/user/settings" className="user-nav-link">Settings</Link>
          <Link to="/" className="user-logout" onClick={async (e) => {
            e.preventDefault();
            try { await fetch("http://localhost:5000/logout", { method: "POST", credentials: "include" }); } catch {}
            window.location.href = "/";
          }}>Logout</Link>
        </nav>
      </header>

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
                
                <div className="room-details">
                  <div className="room-price">${room.price}/night</div>
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
              <form onSubmit={handleBookingSubmit} className="booking-form">
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
                    {Array.from({ length: selectedRoom.capacity }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1} {i === 0 ? 'Guest' : 'Guests'}
                      </option>
                    ))}
                  </select>
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
                    <span>${selectedRoom.price}</span>
                  </div>
                  {bookingForm.checkInDate && bookingForm.checkOutDate && (
                    <>
                      <div className="summary-row">
                        <span>Nights:</span>
                        <span>
                          {Math.ceil((new Date(bookingForm.checkOutDate).getTime() - new Date(bookingForm.checkInDate).getTime()) / (1000 * 60 * 60 * 24))}
                        </span>
                      </div>
                      <div className="summary-row total">
                        <span>Total Amount:</span>
                        <span>
                          ${selectedRoom.price * Math.ceil((new Date(bookingForm.checkOutDate).getTime() - new Date(bookingForm.checkInDate).getTime()) / (1000 * 60 * 60 * 24))}
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
    </div>
  );
}

export default Rooms;
