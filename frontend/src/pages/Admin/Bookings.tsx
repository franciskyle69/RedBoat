import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../../styles/main.css";

interface Booking {
  _id: string;
  user: {
    _id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
  };
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
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch("http://localhost:5000/bookings", {
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

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const response = await fetch(`http://localhost:5000/bookings/${bookingId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ status, adminNotes: adminNotes || undefined }),
      });

      if (response.ok) {
        await fetchBookings();
        setShowModal(false);
        setAdminNotes("");
        setSelectedBooking(null);
        alert("Booking status updated successfully!");
      } else {
        const error = await response.json();
        alert(error.message || "Failed to update booking status");
      }
    } catch (error) {
      console.error("Error updating booking status:", error);
      alert("Error updating booking status");
    }
  };

  const checkInBooking = async (bookingId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/bookings/${bookingId}/checkin`, {
        method: "PUT",
        credentials: "include",
      });

      if (response.ok) {
        await fetchBookings();
        alert("Guest checked in successfully!");
      } else {
        const error = await response.json();
        alert(error.message || "Failed to check in guest");
      }
    } catch (error) {
      console.error("Error checking in guest:", error);
      alert("Error checking in guest");
    }
  };

  const checkOutBooking = async (bookingId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/bookings/${bookingId}/checkout`, {
        method: "PUT",
        credentials: "include",
      });

      if (response.ok) {
        await fetchBookings();
        alert("Guest checked out successfully!");
      } else {
        const error = await response.json();
        alert(error.message || "Failed to check out guest");
      }
    } catch (error) {
      console.error("Error checking out guest:", error);
      alert("Error checking out guest");
    }
  };

  const createSampleRooms = async () => {
    try {
      const response = await fetch("http://localhost:5000/rooms/sample", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        alert("Sample rooms created successfully!");
      } else {
        const error = await response.json();
        alert(error.message || "Failed to create sample rooms");
      }
    } catch (error) {
      console.error("Error creating sample rooms:", error);
      alert("Error creating sample rooms");
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === "all") return true;
    return booking.status === filter;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading">Loading bookings...</div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h2 className="admin-title">Booking Management</h2>
        <nav className="admin-nav">
          <Link to="/admin" className="admin-nav-link">Dashboard</Link>
          <Link to="/admin/user-management" className="admin-nav-link">Users</Link>
          <Link to="/admin/room-management" className="admin-nav-link">Rooms</Link>
          <Link to="/admin/bookings" className="admin-nav-link active">Bookings</Link>
          <Link to="/admin/calendar" className="admin-nav-link">Calendar</Link>
          <Link to="/admin/housekeeping" className="admin-nav-link">Housekeeping</Link>
          <Link to="/admin/reports" className="admin-nav-link">Reports</Link>
          <Link to="/admin/settings" className="admin-nav-link">Settings</Link>
          <button 
            className="admin-nav-link" 
            onClick={createSampleRooms}
            style={{ background: "none", border: "none", color: "#e53e3e", cursor: "pointer" }}
          >
            Create Sample Rooms
          </button>
          <Link to="/" className="admin-logout" onClick={async (e) => {
            e.preventDefault();
            try { await fetch("http://localhost:5000/logout", { method: "POST", credentials: "include" }); } catch {}
            window.location.href = "/";
          }}>Logout</Link>
        </nav>
      </header>

      <div className="bookings-content">
        <div className="bookings-header">
          <h3>All Bookings ({filteredBookings.length})</h3>
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

        <div className="bookings-table-container">
          <table className="bookings-table">
            <thead>
              <tr>
                <th>Guest</th>
                <th>Room</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Guests</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking._id}>
                  <td>
                    <div className="guest-info">
                      <div className="guest-name">
                        {booking.user.firstName} {booking.user.lastName}
                      </div>
                      <div className="guest-email">{booking.user.email}</div>
                    </div>
                  </td>
                  <td>
                    <div className="room-info">
                      <div className="room-number">{booking.room.roomNumber}</div>
                      <div className="room-type">{booking.room.roomType}</div>
                    </div>
                  </td>
                  <td>{formatDate(booking.checkInDate)}</td>
                  <td>{formatDate(booking.checkOutDate)}</td>
                  <td>{booking.numberOfGuests}</td>
                  <td>${booking.totalAmount}</td>
                  <td>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(booking.status) }}
                    >
                      {booking.status.replace("-", " ").toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {booking.status === "pending" && (
                        <>
                          <button 
                            className="btn-accept"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowModal(true);
                            }}
                          >
                            Accept
                          </button>
                          <button 
                            className="btn-decline"
                            onClick={() => updateBookingStatus(booking._id, "cancelled")}
                          >
                            Decline
                          </button>
                        </>
                      )}
                      {booking.status === "confirmed" && (
                        <button 
                          className="btn-checkin"
                          onClick={() => checkInBooking(booking._id)}
                        >
                          Check-in
                        </button>
                      )}
                      {booking.status === "checked-in" && (
                        <button 
                          className="btn-checkout"
                          onClick={() => checkOutBooking(booking._id)}
                        >
                          Check-out
                        </button>
                      )}
                      <button 
                        className="btn-view"
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowModal(true);
                        }}
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredBookings.length === 0 && (
          <div className="no-bookings">
            <p>No bookings found for the selected filter.</p>
          </div>
        )}
      </div>

      {/* Modal for booking details and status updates */}
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
                  setAdminNotes("");
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="booking-details">
                <div className="detail-row">
                  <strong>Guest:</strong> {selectedBooking.user.firstName} {selectedBooking.user.lastName}
                </div>
                <div className="detail-row">
                  <strong>Email:</strong> {selectedBooking.user.email}
                </div>
                <div className="detail-row">
                  <strong>Room:</strong> {selectedBooking.room.roomNumber} ({selectedBooking.room.roomType})
                </div>
                <div className="detail-row">
                  <strong>Check-in:</strong> {formatDate(selectedBooking.checkInDate)}
                </div>
                <div className="detail-row">
                  <strong>Check-out:</strong> {formatDate(selectedBooking.checkOutDate)}
                </div>
                <div className="detail-row">
                  <strong>Guests:</strong> {selectedBooking.numberOfGuests}
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
                    {selectedBooking.status.replace("-", " ").toUpperCase()}
                  </span>
                </div>
                {selectedBooking.specialRequests && (
                  <div className="detail-row">
                    <strong>Special Requests:</strong> {selectedBooking.specialRequests}
                  </div>
                )}
                {selectedBooking.adminNotes && (
                  <div className="detail-row">
                    <strong>Admin Notes:</strong> {selectedBooking.adminNotes}
                  </div>
                )}
              </div>
              
              {selectedBooking.status === "pending" && (
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
                      onClick={() => updateBookingStatus(selectedBooking._id, "confirmed")}
                    >
                      Accept Booking
                    </button>
                    <button 
                      className="btn-decline"
                      onClick={() => updateBookingStatus(selectedBooking._id, "cancelled")}
                    >
                      Decline Booking
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Bookings;
