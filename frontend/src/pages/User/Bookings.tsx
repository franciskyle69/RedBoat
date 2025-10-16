import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "../../styles/main.css";

interface UserBooking {
  _id: string;
  room: {
    _id: string;
    roomNumber: string;
    roomType: string;
    price: number;
  };
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  totalAmount: number;
  status: "pending" | "confirmed" | "checked-in" | "checked-out" | "cancelled";
  specialRequests?: string;
  paymentStatus: "pending" | "paid" | "refunded";
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

function Bookings() {
  const [searchParams] = useSearchParams();
  const [bookings, setBookings] = useState<UserBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<UserBooking | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
    
    // Check for date parameter in URL
    const dateParam = searchParams.get('date');
    if (dateParam) {
      setSelectedDate(dateParam);
    }
  }, [searchParams]);

  const fetchBookings = async () => {
    try {
      const response = await fetch("http://localhost:5000/user-bookings", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setBookings(data.data);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/bookings/${bookingId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ status: "cancelled" }),
      });

      if (response.ok) {
        await fetchBookings();
        alert("Booking cancelled successfully!");
      } else {
        const error = await response.json();
        alert(error.message || "Failed to cancel booking");
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      alert("Error cancelling booking");
    }
  };

  const filteredBookings = bookings.filter(booking => {
    // Filter by status
    if (filter !== "all" && booking.status !== filter) return false;
    
    // Filter by selected date if provided
    if (selectedDate) {
      const checkInDate = new Date(booking.checkInDate).toISOString().split('T')[0];
      const checkOutDate = new Date(booking.checkOutDate).toISOString().split('T')[0];
      return selectedDate >= checkInDate && selectedDate <= checkOutDate;
    }
    
    return true;
  });

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

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending": return "Pending Approval";
      case "confirmed": return "Confirmed";
      case "checked-in": return "Checked In";
      case "checked-out": return "Checked Out";
      case "cancelled": return "Cancelled";
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const canCancelBooking = (booking: UserBooking) => {
    return booking.status === "pending" || booking.status === "confirmed";
  };

  if (loading) {
    return (
      <div className="user-container">
        <div className="loading">Loading your bookings...</div>
      </div>
    );
  }

  return (
    <div className="user-container">
      <header className="user-header">
        <h2 className="user-title">My Bookings</h2>
        <nav className="user-nav">
          <Link to="/dashboard" className="user-nav-link">Dashboard</Link>
          <Link to="/user/profile" className="user-nav-link">Profile</Link>
          <Link to="/user/bookings" className="user-nav-link active">Bookings</Link>
          <Link to="/user/rooms" className="user-nav-link">Rooms</Link>
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

      <div className="user-bookings-content">
        <div className="bookings-header">
          <h3>Your Reservations ({filteredBookings.length})</h3>
          {selectedDate && (
            <div className="selected-date-banner">
              <span>📅 Showing bookings for: {new Date(selectedDate).toLocaleDateString()}</span>
              <button 
                className="clear-date-btn"
                onClick={() => setSelectedDate(null)}
                title="Clear date filter"
              >
                ✕
              </button>
            </div>
          )}
          <div className="filter-buttons">
            <button 
              className={filter === "all" ? "filter-btn active" : "filter-btn"}
              onClick={() => setFilter("all")}
            >
              All
            </button>
            <button 
              className={filter === "pending" ? "filter-btn active" : "filter-btn"}
              onClick={() => setFilter("pending")}
            >
              Pending
            </button>
            <button 
              className={filter === "confirmed" ? "filter-btn active" : "filter-btn"}
              onClick={() => setFilter("confirmed")}
            >
              Confirmed
            </button>
            <button 
              className={filter === "checked-in" ? "filter-btn active" : "filter-btn"}
              onClick={() => setFilter("checked-in")}
            >
              Checked-in
            </button>
            <button 
              className={filter === "checked-out" ? "filter-btn active" : "filter-btn"}
              onClick={() => setFilter("checked-out")}
            >
              Checked-out
            </button>
            <button 
              className={filter === "cancelled" ? "filter-btn active" : "filter-btn"}
              onClick={() => setFilter("cancelled")}
            >
              Cancelled
            </button>
          </div>
        </div>

        <div className="bookings-grid">
          {filteredBookings.map((booking) => (
            <div key={booking._id} className="booking-card">
              <div className="booking-header">
                <div className="room-info">
                  <h4>Room {booking.room.roomNumber}</h4>
                  <span className="room-type">{booking.room.roomType}</span>
                </div>
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(booking.status) }}
                >
                  {getStatusText(booking.status)}
                </span>
              </div>

              <div className="booking-details">
                <div className="detail-item">
                  <strong>Check-in:</strong> {formatDate(booking.checkInDate)}
                </div>
                <div className="detail-item">
                  <strong>Check-out:</strong> {formatDate(booking.checkOutDate)}
                </div>
                <div className="detail-item">
                  <strong>Guests:</strong> {booking.numberOfGuests}
                </div>
                <div className="detail-item">
                  <strong>Total Amount:</strong> ${booking.totalAmount}
                </div>
                {booking.specialRequests && (
                  <div className="detail-item">
                    <strong>Special Requests:</strong> {booking.specialRequests}
                  </div>
                )}
                {booking.adminNotes && (
                  <div className="detail-item">
                    <strong>Admin Notes:</strong> {booking.adminNotes}
                  </div>
                )}
              </div>

              <div className="booking-actions">
                <button 
                  className="btn-view-details"
                  onClick={() => {
                    setSelectedBooking(booking);
                    setShowModal(true);
                  }}
                >
                  View Details
                </button>
                {canCancelBooking(booking) && (
                  <button 
                    className="btn-cancel-booking"
                    onClick={() => cancelBooking(booking._id)}
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredBookings.length === 0 && (
          <div className="no-bookings">
            <div className="no-bookings-content">
              <h3>No bookings found</h3>
              <p>
                {filter === "all" 
                  ? "You haven't made any bookings yet. Start by browsing our available rooms!"
                  : `No ${filter} bookings found.`
                }
              </p>
              {filter === "all" && (
                <Link to="/user/rooms" className="btn-browse-rooms">
                  Browse Available Rooms
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {showModal && selectedBooking && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Booking Details</h3>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowModal(false);
                  setSelectedBooking(null);
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="booking-details-full">
                <div className="detail-section">
                  <h4>Room Information</h4>
                  <div className="detail-row">
                    <strong>Room Number:</strong> {selectedBooking.room.roomNumber}
                  </div>
                  <div className="detail-row">
                    <strong>Room Type:</strong> {selectedBooking.room.roomType}
                  </div>
                  <div className="detail-row">
                    <strong>Price per Night:</strong> ${selectedBooking.room.price}
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Booking Information</h4>
                  <div className="detail-row">
                    <strong>Check-in Date:</strong> {formatDate(selectedBooking.checkInDate)}
                  </div>
                  <div className="detail-row">
                    <strong>Check-out Date:</strong> {formatDate(selectedBooking.checkOutDate)}
                  </div>
                  <div className="detail-row">
                    <strong>Number of Guests:</strong> {selectedBooking.numberOfGuests}
                  </div>
                  <div className="detail-row">
                    <strong>Total Amount:</strong> ${selectedBooking.totalAmount}
                  </div>
                  <div className="detail-row">
                    <strong>Status:</strong> 
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(selectedBooking.status) }}
                    >
                      {getStatusText(selectedBooking.status)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <strong>Payment Status:</strong> {selectedBooking.paymentStatus}
                  </div>
                </div>

                {selectedBooking.specialRequests && (
                  <div className="detail-section">
                    <h4>Special Requests</h4>
                    <p>{selectedBooking.specialRequests}</p>
                  </div>
                )}

                {selectedBooking.adminNotes && (
                  <div className="detail-section">
                    <h4>Admin Notes</h4>
                    <p>{selectedBooking.adminNotes}</p>
                  </div>
                )}

                <div className="detail-section">
                  <h4>Booking Timeline</h4>
                  <div className="detail-row">
                    <strong>Booking Created:</strong> {formatDate(selectedBooking.createdAt)}
                  </div>
                  <div className="detail-row">
                    <strong>Last Updated:</strong> {formatDate(selectedBooking.updatedAt)}
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                {canCancelBooking(selectedBooking) && (
                  <button 
                    className="btn-cancel-booking"
                    onClick={() => {
                      setShowModal(false);
                      cancelBooking(selectedBooking._id);
                    }}
                  >
                    Cancel This Booking
                  </button>
                )}
                <button 
                  className="btn-close"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedBooking(null);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Bookings;
