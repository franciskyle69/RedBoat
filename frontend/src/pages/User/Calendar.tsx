import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import RoomCalendar from "../../components/RoomCalendar";
import ErrorBoundary from "../../components/ErrorBoundary";
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

interface BookingForm {
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  specialRequests: string;
}

function Calendar() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedRoomNumber, setSelectedRoomNumber] = useState<string | null>(null);
  const [bookingForm, setBookingForm] = useState<BookingForm>({
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
        setRooms(data.data || []);
      } else {
        console.warn("Failed to fetch rooms:", response.status);
        setRooms([]);
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCalendarDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedRoomNumber(null);
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
        checkInDate: date.toISOString().split('T')[0],
        checkOutDate: new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Next day
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
          checkInDate: bookingForm.checkInDate,
          checkOutDate: bookingForm.checkOutDate,
          numberOfGuests: bookingForm.numberOfGuests,
          specialRequests: bookingForm.specialRequests,
        }),
      });

      if (response.ok) {
        alert("Booking created successfully!");
        setShowBookingModal(false);
        setSelectedRoom(null);
        setSelectedDate(null);
        setSelectedRoomNumber(null);
        setBookingForm({
          checkInDate: "",
          checkOutDate: "",
          numberOfGuests: 1,
          specialRequests: ""
        });
        // Refresh the calendar by navigating back to it
        window.location.reload();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("Error creating booking");
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
        <div className="loading">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="user-container">
      <header className="user-header">
        <h2 className="user-title">Room Calendar</h2>
        <nav className="user-nav">
          <Link to="/dashboard" className="user-nav-link">Dashboard</Link>
          <Link to="/user/profile" className="user-nav-link">Profile</Link>
          <Link to="/user/bookings" className="user-nav-link">Bookings</Link>
          <Link to="/user/rooms" className="user-nav-link">Rooms</Link>
          <Link to="/user/calendar" className="user-nav-link active">Calendar</Link>
          <Link to="/user/feedback" className="user-nav-link">Feedback</Link>
          <Link to="/user/settings" className="user-nav-link">Settings</Link>
          <Link to="/" className="user-logout" onClick={async (e) => {
            e.preventDefault();
            try { await fetch("http://localhost:5000/logout", { method: "POST", credentials: "include" }); } catch {}
            window.location.href = "/";
          }}>Logout</Link>
        </nav>
      </header>

      <div className="calendar-page-content">
        <div className="calendar-page-header">
          <h3>Room Availability Calendar</h3>
          <p>Click on dates to view availability, click on rooms to make bookings</p>
        </div>

        <div className="calendar-container">
          <ErrorBoundary>
            <RoomCalendar 
              onDateSelect={handleCalendarDateSelect}
              onRoomSelect={handleCalendarRoomSelect}
            />
          </ErrorBoundary>
        </div>

        {selectedDate && (
          <div className="selected-date-info">
            <h4>Selected Date: {selectedDate.toLocaleDateString()}</h4>
            <p>Click on a room cell to book for this date, or view your bookings.</p>
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

        {selectedRoomNumber && selectedDate && (
          <div className="room-selection-info">
            <h4>Selected Room: {selectedRoomNumber}</h4>
            <p>Date: {selectedDate.toLocaleDateString()}</p>
            <p>Click on the room cell again to open the booking form.</p>
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
                onClick={() => setShowBookingModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="room-booking-info">
                <div className="room-details">
                  <div className="room-type-badge" style={{ backgroundColor: getRoomTypeColor(selectedRoom.roomType) }}>
                    {selectedRoom.roomType}
                  </div>
                  <div className="room-price">${selectedRoom.price}/night</div>
                  <div className="room-capacity">Up to {selectedRoom.capacity} guests</div>
                </div>
              </div>

              <form onSubmit={handleBookingSubmit} className="booking-form">
                <div className="form-group">
                  <label htmlFor="checkInDate">Check-in Date</label>
                  <input
                    type="date"
                    id="checkInDate"
                    value={bookingForm.checkInDate}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, checkInDate: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="checkOutDate">Check-out Date</label>
                  <input
                    type="date"
                    id="checkOutDate"
                    value={bookingForm.checkOutDate}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, checkOutDate: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="numberOfGuests">Number of Guests</label>
                  <input
                    type="number"
                    id="numberOfGuests"
                    min="1"
                    max={selectedRoom.capacity}
                    value={bookingForm.numberOfGuests}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, numberOfGuests: parseInt(e.target.value) }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="specialRequests">Special Requests (Optional)</label>
                  <textarea
                    id="specialRequests"
                    value={bookingForm.specialRequests}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, specialRequests: e.target.value }))}
                    rows={3}
                    placeholder="Any special requests or notes..."
                  />
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowBookingModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create Booking
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

export default Calendar;
