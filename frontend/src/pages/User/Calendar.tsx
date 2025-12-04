import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import RoomCalendar from "../../components/RoomCalendar";
import ErrorBoundary from "../../components/ErrorBoundary";
import "../../styles/main.css";
import UserLayout from "../../components/UserLayout";
import Swal from "sweetalert2";

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
  guestName: string;
  contactNumber: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  specialRequests: string;
}

// Format price with comma separators for consistency
const formatPrice = (price: number) => {
  return price.toLocaleString('en-PH');
};

function Calendar() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedRoomNumber, setSelectedRoomNumber] = useState<string | null>(null);
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    guestName: "",
    contactNumber: "",
    checkInDate: "",
    checkOutDate: "",
    numberOfGuests: 1,
    specialRequests: ""
  });
  const [submitting, setSubmitting] = useState(false);

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

    if (submitting) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("http://localhost:5000/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          roomId: selectedRoom._id,
          guestName: bookingForm.guestName,
          contactNumber: bookingForm.contactNumber,
          checkInDate: bookingForm.checkInDate,
          checkOutDate: bookingForm.checkOutDate,
          numberOfGuests: bookingForm.numberOfGuests,
          specialRequests: bookingForm.specialRequests,
        }),
      });

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Booking created",
          text: "Your booking was created successfully!",
        });
        setShowBookingModal(false);
        setSelectedRoom(null);
        setSelectedDate(null);
        setSelectedRoomNumber(null);
        setBookingForm({
          guestName: "",
          contactNumber: "",
          checkInDate: "",
          checkOutDate: "",
          numberOfGuests: 1,
          specialRequests: ""
        });
        // Refresh the calendar by navigating back to it
        window.location.reload();
      } else {
        const errorData = await response.json();
        Swal.fire({
          icon: "error",
          title: "Booking failed",
          text: errorData.message || "Error creating booking",
        });
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      Swal.fire({
        icon: "error",
        title: "Booking failed",
        text: "Error creating booking",
      });
    } finally {
      setSubmitting(false);
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
      <UserLayout pageTitle="Room Calendar">
        <div className="loading">Loading calendar...</div>
      </UserLayout>
    );
  }

  return (
    <UserLayout pageTitle="Room Calendar">

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
                  <div className="room-price">₱{formatPrice(selectedRoom.price)}/night</div>
                  <div className="room-capacity">Up to {selectedRoom.capacity} guests</div>
                </div>
              </div>

              <form onSubmit={handleBookingSubmit} className="booking-form">
                <div className="form-group">
                  <label htmlFor="guestName">Full Name</label>
                  <input
                    type="text"
                    id="guestName"
                    value={bookingForm.guestName}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, guestName: e.target.value }))}
                    placeholder="Your full name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contactNumber">Contact Number</label>
                  <input
                    type="tel"
                    id="contactNumber"
                    value={bookingForm.contactNumber}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, contactNumber: e.target.value }))}
                    placeholder="09xx xxx xxxx"
                    required
                  />
                </div>

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
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowBookingModal(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? "Creating..." : "Create Booking"}
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

export default Calendar;
