import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "../../styles/main.css";
import { useNotifications } from "../../contexts/NotificationContext";
import AdminLayout from "../../components/AdminLayout";
import * as BookingsApi from "../../api/bookings";
import type { AdminBooking } from "../../api/bookings";
import { getBookingReference } from "../../api/bookings";
import { getBookingStatusColor } from "../../utils/bookingStatus";
import BookingDetailsModal from "../../components/admin/BookingDetailsModal";
import CheckInModal from "../../components/admin/CheckInModal";
import CheckOutModal from "../../components/admin/CheckOutModal";
import WalkInBookingModal from "../../components/admin/WalkInBookingModal";
import AdminTableContainer from "../../components/admin/AdminTableContainer";
import Swal from "sweetalert2";
import { confirmDialog, successAlert, errorAlert } from "../../utils/adminSwal";
import { alerts, showSuccess, showError } from "../../utils/alerts";

function Bookings() {
  const { notify } = useNotifications();
  const location = useLocation();
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [checkInNotes, setCheckInNotes] = useState("");
  const [checkInAdditionalCharges, setCheckInAdditionalCharges] = useState("");
  const [checkOutNotes, setCheckOutNotes] = useState("");
  const [checkOutAdditionalCharges, setCheckOutAdditionalCharges] = useState("");
  const [roomCondition, setRoomCondition] = useState<"excellent" | "good" | "fair" | "poor" | "damaged">("good");
  const [userFilter, setUserFilter] = useState<string | null>(null);
  const [showWalkInModal, setShowWalkInModal] = useState(false);

  useEffect(() => {
    fetchBookings();
    // Auto-refresh bookings every 30 seconds instead of 15 to reduce network traffic
    const id = setInterval(() => fetchBookings(true), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const user = params.get("user");
    setUserFilter(user && user.trim() ? user : null);
  }, [location.search]);

  const fetchBookings = async (silent = false) => {
    try {
      const next: AdminBooking[] = await BookingsApi.getAll();
        if (silent && bookings.length > 0) {
          const prevPending = new Set(bookings.filter(b => b.status === 'pending').map(b => b._id));
          const newPending = next.filter(b => b.status === 'pending' && !prevPending.has(b._id));
          newPending.forEach(b => notify(`New booking request for Room ${b.room?.roomNumber || 'Unknown'}`, 'info', 6000, '/admin/bookings'));
        }
        setBookings(next);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      await BookingsApi.updateStatus(bookingId, status, adminNotes || undefined);
        await fetchBookings();
        setShowModal(false);
        setAdminNotes("");
        setSelectedBooking(null);
        
        // Show appropriate SweetAlert based on status
        if (status === "confirmed") {
          await showSuccess("Booking Confirmed!", "The booking has been confirmed successfully.");
        } else if (status === "cancelled") {
          await showSuccess("Booking Declined", "The booking has been declined.");
        } else {
          await showSuccess("Status Updated", `Booking status changed to ${status}.`);
        }
    } catch (error) {
      console.error("Error updating booking status:", error);
      showError("Update Failed", "Error updating booking status");
    }
  };

  const checkInBooking = async (bookingId: string) => {
    try {
      const body: any = {};
      if (checkInNotes) body.checkinNotes = checkInNotes;
      if (checkInAdditionalCharges && parseFloat(checkInAdditionalCharges) > 0) {
        body.additionalCharges = parseFloat(checkInAdditionalCharges);
      }
      const data = await BookingsApi.requestCheckIn(bookingId, body);
        await fetchBookings();
        setShowCheckInModal(false);
        setCheckInNotes("");
        setCheckInAdditionalCharges("");
        setSelectedBooking(null);
        
        // Show detailed success message
        const summary = data.data?.booking?.checkInSummary;
        const roomNumber = data.data?.booking?.roomInfo?.roomNumber || "";
        let details = "";
        if (summary) {
          const detailParts = [];
          if (summary.isEarly) detailParts.push("Early check-in");
          if (summary.isLate && summary.lateCheckInFee > 0) {
            detailParts.push(`Late fee: ₱${summary.lateCheckInFee.toFixed(2)}`);
          }
          if (detailParts.length > 0) {
            details = detailParts.join(", ");
          }
        }
        await alerts.checkInSuccess(roomNumber);
        
        // Log detailed info to console
        if (data.data?.booking) {
          console.log("Check-in details:", data.data.booking);
        }
    } catch (error) {
      console.error("Error checking in guest:", error);
      const message = error instanceof Error ? error.message : "Error checking in guest";
      showError("Check-in Failed", message);
    }
  };

  const checkOutBooking = async (bookingId: string) => {
    try {
      const body: any = {};
      if (checkOutNotes) body.checkoutNotes = checkOutNotes;
      if (checkOutAdditionalCharges && parseFloat(checkOutAdditionalCharges) > 0) {
        body.additionalCharges = parseFloat(checkOutAdditionalCharges);
      }
      if (roomCondition) body.roomCondition = roomCondition;
      const data = await BookingsApi.requestCheckOut(bookingId, body);
        await fetchBookings();
        setShowCheckOutModal(false);
        setCheckOutNotes("");
        setCheckOutAdditionalCharges("");
        setRoomCondition("good");
        setSelectedBooking(null);
        
        // Show detailed success message
        const summary = data.data?.booking?.checkOutSummary;
        const financial = data.data?.booking?.financialSummary;
        let message = "Guest checked out successfully";
        const details = [];
        
        if (summary) {
          if (summary.isEarlyCheckOut) details.push("Early check-out");
          if (summary.isLateCheckOut && summary.lateCheckOutFee > 0) {
            details.push(`Late fee: ₱${summary.lateCheckOutFee.toFixed(2)}`);
          }
          if (summary.lengthOfStay?.extendedStay > 0) {
            details.push(`Extended stay: ${summary.lengthOfStay.extendedStay} night(s)`);
          }
        }
        
        if (financial && financial.balanceDue > 0) {
          details.push(`Balance due: ₱${financial.balanceDue.toFixed(2)}`);
        }
        
        const roomNumber = data.data?.booking?.roomInfo?.roomNumber || "";
        await alerts.checkOutSuccess(roomNumber);
        
        // Log detailed info to console
        if (data.data?.booking) {
          console.log("Check-out details:", data.data.booking);
          if (financial?.balanceDue > 0) {
            console.warn(`⚠️ Balance due: ₱${financial.balanceDue.toFixed(2)}`);
          }
        }
    } catch (error) {
      console.error("Error checking out guest:", error);
      showError("Check-out Failed", "Error checking out guest");
    }
  };

  const createSampleRooms = async () => {
    try {
      const response = await fetch("http://localhost:5000/rooms/sample", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        successAlert({
          title: "Sample rooms created",
          text: "Sample rooms created successfully!",
        });
      } else {
        const error = await response.json();
        errorAlert({
          title: "Failed to create rooms",
          text: error.message || "Failed to create sample rooms",
        });
      }
    } catch (error) {
      console.error("Error creating sample rooms:", error);
      errorAlert({
        title: "Error",
        text: "Error creating sample rooms",
      });
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter !== "all" && booking.status !== filter) return false;
    if (userFilter) {
      const name = (booking.guestName || booking.user.username || "").toLowerCase();
      if (!name.includes(userFilter.toLowerCase())) return false;
    }
    return true;
  });

  const updatePaymentStatus = async (bookingId: string, paymentStatus: "pending" | "paid" | "refunded") => {
    try {
      await BookingsApi.updatePayment(bookingId, paymentStatus as BookingsApi.PaymentStatus);
        await fetchBookings();
        if (selectedBooking && selectedBooking._id === bookingId) {
          setSelectedBooking({ ...selectedBooking, paymentStatus });
        }
        
        // Show appropriate SweetAlert based on payment status
        const statusLabel = paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1);
        await showSuccess("Payment Updated", `Payment status changed to ${statusLabel}.`);
    } catch (error) {
      console.error("Error updating payment status:", error);
      showError("Update Failed", "Error updating payment status");
    }
  };

  const approveCancel = async (bookingId: string) => {
    const isConfirmed = await confirmDialog({
      title: "Approve cancellation?",
      text: "This will cancel the booking and notify the user.",
      confirmText: "Yes, approve",
      cancelText: "No, keep booking",
      icon: "warning",
    });

    if (!isConfirmed) {
      return;
    }

    try {
      await BookingsApi.approveCancel(bookingId);
        notify('Cancellation approved', 'success');
        fetchBookings();
    } catch (e) {
      notify('Error approving cancellation', 'error');
    }
  };

  const declineCancel = async (bookingId: string) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Decline cancellation?",
      text: "The booking will remain active. You can optionally add a note for the user.",
      input: "textarea",
      inputLabel: "Note to user (optional)",
      inputPlaceholder: "Explain why the cancellation was declined...",
      showCancelButton: true,
      confirmButtonText: "Yes, decline",
      cancelButtonText: "Back",
      focusCancel: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    const noteValue = typeof result.value === "string" ? result.value.trim() : "";
    const note = noteValue.length > 0 ? noteValue : undefined;

    try {
      await BookingsApi.declineCancel(bookingId, note);
        notify('Cancellation declined', 'success');
        fetchBookings();
    } catch (e) {
      notify('Error declining cancellation', 'error');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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
      await BookingsApi.createBooking(data);
      notify("Walk-in booking created successfully", "success");
      setShowWalkInModal(false);
      await fetchBookings();
    } catch (error) {
      console.error("Error creating walk-in booking:", error);
      const message = error instanceof Error ? error.message : "Failed to create booking";
      notify(message, "error");
      throw error; // Re-throw so the modal knows it failed
    }
  };

  if (loading) {
    return (
      <AdminLayout pageTitle="Bookings">
        <div className="loading">Loading bookings...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout pageTitle="Bookings">
      <div className="bookings-content">
        <div className="bookings-header">
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
            <h3 style={{ margin: 0 }}>All Bookings ({filteredBookings.length})</h3>
            <button
              className="btn-accept"
              onClick={() => setShowWalkInModal(true)}
              style={{ marginLeft: "auto" }}
            >
              + Walk-in Booking
            </button>
          </div>
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

        <AdminTableContainer>
          <table className="bookings-table">
            <thead>
              <tr>
                <th>Reference</th>
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
                    <div className="guest-info">
                      <div className="guest-name">
                        {booking.guestName || booking.user.username}
                      </div>
                      {booking.contactNumber && (
                        <div className="guest-contact">
                          {booking.contactNumber}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="room-info">
                      <div className="room-number">{booking.room?.roomNumber || "Deleted Room"}</div>
                      <div className="room-type">{booking.room?.roomType || "N/A"}</div>
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
                      {booking.status.replace("-", " ").toUpperCase()}
                    </span>
                    {booking.cancellationRequested && (
                      <span className="status-badge" style={{ background: '#fef3c7', color: '#92400e', marginLeft: 6 }}>
                        Cancel Requested
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      {(booking.status === "pending" || booking.cancellationRequested) && (
                        <>
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
                          {booking.cancellationRequested && (
                            <>
                              <button className="btn-warning" onClick={() => approveCancel(booking._id)}>Approve Cancel</button>
                              <button className="btn-decline" onClick={() => declineCancel(booking._id)}>Decline Cancel</button>
                            </>
                          )}
                        </>
                      )}
                      {booking.status === "confirmed" && (
                        <button 
                          className="btn-checkin"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowCheckInModal(true);
                          }}
                        >
                          Check-in
                        </button>
                      )}
                      {booking.status === "checked-in" && (
                        <button 
                          className="btn-checkout"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowCheckOutModal(true);
                          }}
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
        </AdminTableContainer>

        {filteredBookings.length === 0 && (
          <div className="no-bookings">
            <p>No bookings found for the selected filter.</p>
          </div>
        )}
      </div>

      {/* Modal for booking details and status updates */}
      {showModal && selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          formatDate={formatDate}
          adminNotes={adminNotes}
          setAdminNotes={setAdminNotes}
          updatePaymentStatus={updatePaymentStatus}
          updateBookingStatus={updateBookingStatus}
          onClose={() => {
            setShowModal(false);
            setSelectedBooking(null);
            setAdminNotes("");
          }}
        />
      )}

      {/* Check-in Modal */}
      {showCheckInModal && selectedBooking && (
        <CheckInModal
          booking={selectedBooking}
          formatDate={formatDate}
          paymentStatus={selectedBooking.paymentStatus}
          updatePaymentStatus={updatePaymentStatus}
          checkInNotes={checkInNotes}
          setCheckInNotes={setCheckInNotes}
          checkInAdditionalCharges={checkInAdditionalCharges}
          setCheckInAdditionalCharges={setCheckInAdditionalCharges}
          onConfirm={() => checkInBooking(selectedBooking._id)}
          onClose={() => {
            setShowCheckInModal(false);
            setSelectedBooking(null);
            setCheckInNotes("");
            setCheckInAdditionalCharges("");
          }}
        />
      )}

      {/* Check-out Modal */}
      {showCheckOutModal && selectedBooking && (
        <CheckOutModal
          booking={selectedBooking}
          formatDate={formatDate}
          roomCondition={roomCondition}
          setRoomCondition={setRoomCondition}
          checkOutNotes={checkOutNotes}
          setCheckOutNotes={setCheckOutNotes}
          checkOutAdditionalCharges={checkOutAdditionalCharges}
          setCheckOutAdditionalCharges={setCheckOutAdditionalCharges}
          onConfirm={() => checkOutBooking(selectedBooking._id)}
          onClose={() => {
            setShowCheckOutModal(false);
            setSelectedBooking(null);
            setCheckOutNotes("");
            setCheckOutAdditionalCharges("");
            setRoomCondition("good");
          }}
        />
      )}

      {/* Walk-in Booking Modal */}
      {showWalkInModal && (
        <WalkInBookingModal
          onSubmit={handleCreateWalkInBooking}
          onClose={() => setShowWalkInModal(false)}
        />
      )}
    </AdminLayout>
  );
}

export default Bookings;
