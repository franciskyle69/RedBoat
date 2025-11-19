import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useNotifications } from "../../contexts/NotificationContext";
import "../../styles/main.css";
import UserLayout from "../../components/UserLayout";
import { getUserBookings, requestUserCancellation, UserBooking } from "../../api/bookings";
import { createCheckoutSession } from "../../api/payments";
import Swal from "sweetalert2";

function Bookings() {
  const [searchParams] = useSearchParams();
  const { notify } = useNotifications();
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
      const data = await getUserBookings();
      setBookings(data);
    } catch (error: any) {
      console.error("Error fetching bookings:", error);
      notify(error?.message || "Error fetching bookings", "error");
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Request cancellation?",
      text: "This will send a cancellation request to the admin for review.",
      input: "textarea",
      inputLabel: "Reason (optional)",
      inputPlaceholder: "Add an optional reason for your cancellation...",
      showCancelButton: true,
      confirmButtonText: "Yes, request cancel",
      cancelButtonText: "No, keep booking",
      focusConfirm: false,
    });

    if (!result.isConfirmed) {
      return;
    }

    const reasonValue = typeof result.value === "string" ? result.value.trim() : "";
    const reason = reasonValue.length > 0 ? reasonValue : undefined;

    try {
      await requestUserCancellation(bookingId, reason);
      await fetchBookings();
      notify("Cancellation request sent. Awaiting admin response.", "success");
    } catch (error: any) {
      console.error("Error cancelling booking:", error);
      notify(error?.message || "Failed to request cancellation", "error");
    }
  };

  const handlePayment = async (bookingId: string) => {
    const result = await Swal.fire({
      icon: "question",
      title: "Proceed to payment?",
      text: "You will be redirected to Stripe Checkout to complete your payment.",
      showCancelButton: true,
      confirmButtonText: "Yes, pay now",
      cancelButtonText: "Not now",
      focusConfirm: false,
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const { url } = await createCheckoutSession(bookingId);
      if (!url) {
        notify("Checkout URL missing", "error");
        return;
      }
      window.location.assign(url);
    } catch (error: any) {
      console.error("Error starting checkout:", error);
      notify(error?.message || "Error starting checkout", "error");
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
      <UserLayout pageTitle="My Bookings">
        <div className="loading">Loading your bookings...</div>
      </UserLayout>
    );
  }

  return (
    <UserLayout pageTitle="My Bookings">
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
        <div className="bookings-table-container">
          {filteredBookings.length > 0 && (
            <table className="bookings-table user-bookings-table">
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Guests</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => (
                  <tr key={booking._id}>
                    <td>
                      <div className="room-info">
                        <div className="room-number">Room {booking.room.roomNumber}</div>
                        <div className="room-type">{booking.room.roomType}</div>
                      </div>
                    </td>
                    <td>{formatDate(booking.checkInDate)}</td>
                    <td>{formatDate(booking.checkOutDate)}</td>
                    <td>{booking.numberOfGuests}</td>
                    <td>₱{booking.totalAmount}</td>
                    <td>
                      <span
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(booking.status) }}
                      >
                        {getStatusText(booking.status)}
                      </span>
                    </td>
                    <td>
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor:
                            booking.paymentStatus === "paid"
                              ? "#10b981"
                              : booking.paymentStatus === "pending"
                              ? "#f59e0b"
                              : "#ef4444",
                        }}
                      >
                        {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-view"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowModal(true);
                          }}
                        >
                          View
                        </button>
                        {booking.paymentStatus === "pending" && booking.status === "confirmed" && (
                          <button
                            className="btn-pay-booking"
                            onClick={() => handlePayment(booking._id)}
                          >
                            Pay Now
                          </button>
                        )}
                        {canCancelBooking(booking) && (
                          <button
                            className="btn-cancel-booking"
                            onClick={() => cancelBooking(booking._id)}
                          >
                            Request Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {filteredBookings.length === 0 && (
            <div className="no-bookings">
              <div className="no-bookings-content">
                <h3>No bookings found</h3>
                <p>
                  {filter === "all"
                    ? "You haven't made any bookings yet. Start by browsing our available rooms!"
                    : `No ${filter} bookings found.`}
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
                    <strong>Price per Night:</strong> ₱{selectedBooking.room.price}
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
                    <strong>Total Amount:</strong> ₱{selectedBooking.totalAmount}
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
                    <strong>Payment Status:</strong> 
                    <span 
                      className="status-badge"
                      style={{ 
                        backgroundColor: selectedBooking.paymentStatus === "paid" ? "#10b981" : selectedBooking.paymentStatus === "pending" ? "#f59e0b" : "#ef4444",
                        marginLeft: "8px"
                      }}
                    >
                      {selectedBooking.paymentStatus.charAt(0).toUpperCase() + selectedBooking.paymentStatus.slice(1)}
                    </span>
                  </div>
                </div>

                {selectedBooking.paymentStatus === "pending" && selectedBooking.status === "confirmed" && (
                  <div className="modal-footer" style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid #e5e7eb" }}>
                    <button 
                      className="btn-pay-booking"
                      onClick={() => {
                        handlePayment(selectedBooking._id);
                      }}
                      style={{
                        backgroundColor: "#10b981",
                        color: "white",
                        border: "none",
                        padding: "12px 24px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "600",
                        fontSize: "16px",
                        width: "100%"
                      }}
                    >
                      Pay ₱{selectedBooking.totalAmount}
                    </button>
                  </div>
                )}

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
    </UserLayout>
  );
}

export default Bookings;
