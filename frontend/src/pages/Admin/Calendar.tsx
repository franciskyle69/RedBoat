import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import RoomCalendar from "../../components/RoomCalendar";
import ErrorBoundary from "../../components/ErrorBoundary";
import "../../styles/main.css";
import AdminLayout from "../../components/AdminLayout";
import { successAlert, errorAlert } from "../../utils/adminSwal";
import { getAll as getAllBookings, updateStatus as updateBookingStatusApi, createBooking } from "../../api/bookings";
import WalkInBookingModal from "../../components/admin/WalkInBookingModal";
import { useNotifications } from "../../contexts/NotificationContext";

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

interface Booking {
  _id: string;
  user: {
    username: string;
  };
  room: {
    roomNumber: string;
    roomType: string;
  };
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  totalAmount: number;
  status: string;
  specialRequests?: string;
  paymentStatus: string;
  createdAt: string;
}

function AdminCalendar() {
  const navigate = useNavigate();
  const { notify } = useNotifications();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedRoomNumber, setSelectedRoomNumber] = useState<string | null>(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'bookings'>('calendar');
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [preselectedRoom, setPreselectedRoom] = useState<Room | null>(null);
  const [preselectedDate, setPreselectedDate] = useState<string>("");

  useEffect(() => {
    fetchRooms();
    fetchBookings();
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
    }
  };

  const fetchBookings = async () => {
    try {
      const data = await getAllBookings();
      setBookings(data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setBookings([]);
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
    
    // Find bookings for this room and date
    const dateString = date.toISOString().split('T')[0];
    const roomBookings = bookings.filter(booking => {
      const checkInDate = new Date(booking.checkInDate).toISOString().split('T')[0];
      const checkOutDate = new Date(booking.checkOutDate).toISOString().split('T')[0];
      return booking.room.roomNumber === roomNumber && 
             dateString >= checkInDate && 
             dateString <= checkOutDate;
    });

    if (roomBookings.length > 0) {
      // Show existing booking details
      setSelectedBooking(roomBookings[0]);
      setShowBookingDetails(true);
    } else {
      // No booking - open walk-in booking modal with preselected room and date
      const room = rooms.find(r => r.roomNumber === roomNumber);
      if (room) {
        setPreselectedRoom(room);
        setPreselectedDate(dateString);
        setShowWalkInModal(true);
      }
    }
  };

  const handleCreateWalkInBooking = async (data: {
    roomId: string;
    guestName: string;
    contactNumber: string;
    checkInDate: string;
    checkOutDate: string;
    numberOfGuests: number;
    specialRequests?: string;
  }) => {
    try {
      await createBooking(data);
      notify("Walk-in booking created successfully", "success");
      setShowWalkInModal(false);
      setPreselectedRoom(null);
      setPreselectedDate("");
      await fetchBookings();
    } catch (error) {
      console.error("Error creating walk-in booking:", error);
      const message = error instanceof Error ? error.message : "Failed to create booking";
      notify(message, "error");
      throw error;
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      await updateBookingStatusApi(bookingId, newStatus);
      successAlert({
        title: 'Status updated',
        text: 'Booking status updated successfully!',
      });
      fetchBookings(); // Refresh bookings
      setShowBookingDetails(false);
      setSelectedBooking(null);
    } catch (error) {
      console.error('Error updating booking status:', error);
      errorAlert({
        title: 'Update failed',
        text: 'Error updating booking status',
      });
    }
  };

  const getBookingsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return bookings.filter(booking => {
      const checkInDate = new Date(booking.checkInDate).toISOString().split('T')[0];
      const checkOutDate = new Date(booking.checkOutDate).toISOString().split('T')[0];
      return dateString >= checkInDate && dateString <= checkOutDate;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "#f59e0b";
      case "confirmed": return "#10b981";
      case "checked-in": return "#3b82f6";
      case "checked-out": return "#6b7280";
      case "cancelled": return "#ef4444";
      default: return "#6b7280";
    }
  };

  if (loading) {
    return (
      <AdminLayout pageTitle="Calendar">
        <div className="loading">Loading calendar...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout pageTitle="Calendar">

      <div className="admin-calendar-content">
        <div className="admin-calendar-header">
          <h3>Room Management Calendar</h3>
          <p>Monitor room occupancy, manage bookings, and track availability</p>
          
          <div className="view-mode-toggle">
            <button 
              className={`toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode('calendar')}
            >
              📅 Calendar View
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'bookings' ? 'active' : ''}`}
              onClick={() => setViewMode('bookings')}
            >
              📋 Bookings List
            </button>
          </div>
        </div>

        {viewMode === 'calendar' ? (
          <div className="calendar-container">
            <ErrorBoundary>
              <RoomCalendar 
                onDateSelect={handleCalendarDateSelect}
                onRoomSelect={handleCalendarRoomSelect}
              />
            </ErrorBoundary>
          </div>
        ) : (
          <div className="bookings-list-view">
            <div className="bookings-grid">
              {bookings.map((booking) => (
                <div key={booking._id} className="booking-card">
                  <div className="booking-header">
                    <div className="room-info">
                      <h4>Room {booking.room.roomNumber}</h4>
                      <span className="room-type">{booking.room.roomType}</span>
                    </div>
                    <div 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(booking.status) }}
                    >
                      {booking.status}
                    </div>
                  </div>
                  
                  <div className="booking-details">
                    <div className="guest-info">
                      <strong>{booking.user.username}</strong>
                    </div>
                    
                    <div className="date-info">
                      <div className="date-item">
                        <span className="date-label">Check-in:</span>
                        <span>{new Date(booking.checkInDate).toLocaleDateString()}</span>
                      </div>
                      <div className="date-item">
                        <span className="date-label">Check-out:</span>
                        <span>{new Date(booking.checkOutDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="booking-meta">
                      <span>{booking.numberOfGuests} guests</span>
                      <span>₱{booking.totalAmount}</span>
                      <span className={`payment-status ${booking.paymentStatus}`}>
                        {booking.paymentStatus}
                      </span>
                    </div>
                  </div>
                  
                  <div className="booking-actions">
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowBookingDetails(true);
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedDate && (
          <div className="selected-date-info">
            <h4>Selected Date: {selectedDate.toLocaleDateString()}</h4>
            <div className="date-bookings">
              <h5>Bookings for this date:</h5>
              {getBookingsForDate(selectedDate).length > 0 ? (
                <div className="bookings-list">
                  {getBookingsForDate(selectedDate).map((booking) => (
                    <div key={booking._id} className="booking-item">
                      <span className="room-number">Room {booking.room.roomNumber}</span>
                      <span className="guest-name">{booking.user.username}</span>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(booking.status) }}
                      >
                        {booking.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No bookings for this date</p>
              )}
            </div>
            <div className="date-actions">
              <button 
                className="btn btn-primary"
                onClick={() => {
                  const dateString = selectedDate.toISOString().split('T')[0];
                  navigate(`/admin/bookings?date=${dateString}`);
                }}
              >
                View All Bookings
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
            <p>Click on an available room cell to create a booking, or on a booked cell to view details.</p>
          </div>
        )}
      </div>

      {/* Walk-in Booking Modal */}
      {showWalkInModal && (
        <WalkInBookingModal
          onSubmit={handleCreateWalkInBooking}
          onClose={() => {
            setShowWalkInModal(false);
            setPreselectedRoom(null);
            setPreselectedDate("");
          }}
          preselectedRoomId={preselectedRoom?._id}
          preselectedCheckInDate={preselectedDate}
        />
      )}

      {/* Booking Details Modal */}
      {showBookingDetails && selectedBooking && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Booking Details - Room {selectedBooking.room.roomNumber}</h3>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowBookingDetails(false);
                  setSelectedBooking(null);
                }}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="booking-details-form">
                <div className="form-group">
                  <label>Guest Information</label>
                  <div className="guest-details">
                    <p><strong>Username:</strong> {selectedBooking.user.username}</p>
                  </div>
                </div>

                <div className="form-group">
                  <label>Booking Dates</label>
                  <div className="date-details">
                    <p><strong>Check-in:</strong> {new Date(selectedBooking.checkInDate).toLocaleDateString()}</p>
                    <p><strong>Check-out:</strong> {new Date(selectedBooking.checkOutDate).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="form-group">
                  <label>Booking Information</label>
                  <div className="booking-meta-details">
                    <p><strong>Room:</strong> {selectedBooking.room.roomNumber} ({selectedBooking.room.roomType})</p>
                    <p><strong>Guests:</strong> {selectedBooking.numberOfGuests}</p>
                    <p><strong>Total Amount:</strong> ₱{selectedBooking.totalAmount}</p>
                    <p><strong>Payment Status:</strong> {selectedBooking.paymentStatus}</p>
                  </div>
                </div>

                {selectedBooking.specialRequests && (
                  <div className="form-group">
                    <label>Special Requests</label>
                    <p>{selectedBooking.specialRequests}</p>
                  </div>
                )}

                <div className="form-group">
                  <label>Update Status</label>
                  <div className="status-actions">
                    <button 
                      className="btn btn-sm btn-warning"
                      onClick={() => updateBookingStatus(selectedBooking._id, 'pending')}
                      disabled={selectedBooking.status === 'pending'}
                    >
                      Pending
                    </button>
                    <button 
                      className="btn btn-sm btn-success"
                      onClick={() => updateBookingStatus(selectedBooking._id, 'confirmed')}
                      disabled={selectedBooking.status === 'confirmed'}
                    >
                      Confirm
                    </button>
                    <button 
                      className="btn btn-sm btn-info"
                      onClick={() => updateBookingStatus(selectedBooking._id, 'checked-in')}
                      disabled={selectedBooking.status === 'checked-in'}
                    >
                      Check-in
                    </button>
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => updateBookingStatus(selectedBooking._id, 'checked-out')}
                      disabled={selectedBooking.status === 'checked-out'}
                    >
                      Check-out
                    </button>
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => updateBookingStatus(selectedBooking._id, 'cancelled')}
                      disabled={selectedBooking.status === 'cancelled'}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminCalendar;
