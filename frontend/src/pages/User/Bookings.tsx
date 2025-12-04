import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useNotifications } from "../../contexts/NotificationContext";
import "../../styles/main.css";
import UserLayout from "../../components/UserLayout";
import StarRating from "../../components/StarRating";
import { getUserBookings, requestUserCancellation, UserBooking, getBookingReference, getPaymentReference } from "../../api/bookings";
import { getBookingStatusColor, getBookingStatusLabel } from "../../utils/bookingStatus";
import { createCheckoutSession } from "../../api/payments";
import * as RoomReviewsApi from "../../api/roomReviews";
import Swal from "sweetalert2";

// Format price with comma separators for consistency
const formatPrice = (price: number) => {
  return price.toLocaleString('en-PH');
};

function Bookings() {
  const [searchParams] = useSearchParams();
  const { notify } = useNotifications();
  const [bookings, setBookings] = useState<UserBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<UserBooking | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [reviewBooking, setReviewBooking] = useState<UserBooking | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [ratedBookingIds, setRatedBookingIds] = useState<string[]>([]);

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

  const openReviewModal = (booking: UserBooking) => {
    setReviewBooking(booking);
    setReviewRating(5);
    setReviewComment("");
    setShowReviewModal(true);
  };

  const submitReview = async () => {
    if (!reviewBooking) return;
    if (!reviewRating || !reviewComment.trim()) {
      notify("Please select a rating and enter a comment.", "error");
      return;
    }

    try {
      setReviewSubmitting(true);
      await RoomReviewsApi.submit(
        reviewBooking.room._id,
        reviewRating,
        reviewComment.trim()
      );
      notify("Thank you for rating your stay!", "success");
      setRatedBookingIds((prev) =>
        prev.includes(reviewBooking._id) ? prev : [...prev, reviewBooking._id]
      );
      setShowReviewModal(false);
      setReviewBooking(null);
      setReviewRating(5);
      setReviewComment("");
    } catch (error: any) {
      console.error("Error submitting room review:", error);
      notify(error?.message || "Failed to submit review", "error");
    } finally {
      setReviewSubmitting(false);
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
                  <th>Reference</th>
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
                      <span className="booking-reference" style={{ 
                        fontFamily: 'monospace', 
                        fontWeight: 600,
                        color: '#6366f1',
                        fontSize: '0.85rem'
                      }}>
                        {getBookingReference(booking)}
                      </span>
                    </td>
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
                        style={{ backgroundColor: getBookingStatusColor(booking.status) }}
                      >
                        {getBookingStatusLabel(booking.status)}
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
                        {booking.status === "checked-out" && !ratedBookingIds.includes(booking._id) && (
                          <button
                            className="btn-view"
                            onClick={() => openReviewModal(booking)}
                          >
                            Rate Stay
                          </button>
                        )}
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
                  <h4>Booking Reference</h4>
                  <div className="detail-row">
                    <span style={{ 
                      fontFamily: 'monospace', 
                      fontWeight: 600,
                      color: '#6366f1',
                      fontSize: '1.1rem',
                      background: '#eef2ff',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      display: 'inline-block'
                    }}>
                      {getBookingReference(selectedBooking)}
                    </span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Room Information</h4>
                  <div className="detail-row">
                    <strong>Room Number:</strong> {selectedBooking.room.roomNumber}
                  </div>
                  <div className="detail-row">
                    <strong>Room Type:</strong> {selectedBooking.room.roomType}
                  </div>
                  <div className="detail-row">
                    <strong>Price per Night:</strong> ₱{formatPrice(selectedBooking.room.price)}
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
                    <strong>Total Amount:</strong> ₱{formatPrice(selectedBooking.totalAmount)}
                  </div>
                  <div className="detail-row">
                    <strong>Status:</strong> 
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getBookingStatusColor(selectedBooking.status) }}
                    >
                      {getBookingStatusLabel(selectedBooking.status)}
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
                  {selectedBooking.paymentStatus === "paid" && (
                    <div className="detail-row">
                      <strong>Payment Reference:</strong>{" "}
                      <span style={{ 
                        fontFamily: 'monospace', 
                        fontWeight: 600,
                        color: '#10b981',
                        fontSize: '0.95rem',
                        background: '#ecfdf5',
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>
                        {getPaymentReference(selectedBooking._id)}
                      </span>
                    </div>
                  )}
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

      {/* Room Review Modal */}
      {showReviewModal && reviewBooking && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Rate Your Stay</h3>
              <button
                className="modal-close"
                onClick={() => {
                  if (reviewSubmitting) return;
                  setShowReviewModal(false);
                  setReviewBooking(null);
                  setReviewRating(5);
                  setReviewComment("");
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
                    <strong>Room Number:</strong> {reviewBooking.room.roomNumber}
                  </div>
                  <div className="detail-row">
                    <strong>Room Type:</strong> {reviewBooking.room.roomType}
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Your Rating</h4>
                  <div className="rating-container">
                    <StarRating
                      rating={reviewRating}
                      onRatingChange={(value) => setReviewRating(value)}
                      readonly={reviewSubmitting}
                      size="medium"
                    />
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Your Review</h4>
                  <textarea
                    className="input"
                    rows={4}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your experience about this room..."
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  className="btn-pay-booking"
                  onClick={submitReview}
                  disabled={reviewSubmitting}
                >
                  {reviewSubmitting ? "Submitting..." : "Submit Review"}
                </button>
                <button
                  className="btn-close"
                  onClick={() => {
                    if (reviewSubmitting) return;
                    setShowReviewModal(false);
                    setReviewBooking(null);
                    setReviewRating(5);
                    setReviewComment("");
                  }}
                >
                  Cancel
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
