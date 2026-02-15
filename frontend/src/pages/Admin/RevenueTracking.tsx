import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import AdminTableContainer from "../../components/admin/AdminTableContainer";
import * as BookingsApi from "../../api/bookings";
import { getBookingReference } from "../../api/bookings";

type AdminBooking = BookingsApi.AdminBooking;
type PaymentStatus = BookingsApi.PaymentStatus;
type PaymentMethod = BookingsApi.PaymentMethod;

interface DateRange {
  startDate: string;
  endDate: string;
}

const toDateInput = (date: Date) => date.toISOString().split("T")[0];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);

const formatDate = (value?: string) => {
  if (!value) return "N/A";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString();
};

const normalizeMethod = (method?: PaymentMethod) => {
  if (!method) return "Unspecified";
  return method.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const getEffectivePaymentDate = (booking: AdminBooking) => {
  if (booking.paymentDate) return booking.paymentDate;
  if (booking.paymentStatus === "paid" || booking.paymentStatus === "refunded") {
    return booking.updatedAt;
  }
  return booking.createdAt;
};

function RevenueTracking() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "all">("paid");
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: toDateInput(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
    endDate: toDateInput(new Date()),
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await BookingsApi.getAll();
        if (!cancelled) setBookings(data);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load payments");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    end.setHours(23, 59, 59, 999);

    return bookings.filter((booking) => {
      if (statusFilter !== "all" && booking.paymentStatus !== statusFilter) {
        return false;
      }
      const effective = getEffectivePaymentDate(booking);
      const d = new Date(effective);
      if (Number.isNaN(d.getTime())) return false;
      return d >= start && d <= end;
    });
  }, [bookings, dateRange, statusFilter]);

  const summary = useMemo(() => {
    const paid = filtered.filter((b) => b.paymentStatus === "paid");
    const refunded = filtered.filter((b) => b.paymentStatus === "refunded");
    const pending = filtered.filter((b) => b.paymentStatus === "pending");

    const totalPaid = paid.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const totalRefunded = refunded.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const totalPending = pending.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const netRevenue = totalPaid - totalRefunded;
    const averagePaid = paid.length ? totalPaid / paid.length : 0;

    const methodTotals = paid.reduce<Record<string, { amount: number; count: number }>>(
      (acc, b) => {
        const key = normalizeMethod(b.paymentMethod);
        if (!acc[key]) acc[key] = { amount: 0, count: 0 };
        acc[key].amount += b.totalAmount || 0;
        acc[key].count += 1;
        return acc;
      },
      {}
    );

    return {
      totalPaid,
      totalRefunded,
      totalPending,
      netRevenue,
      averagePaid,
      counts: {
        paid: paid.length,
        refunded: refunded.length,
        pending: pending.length,
      },
      methodTotals,
    };
  }, [filtered]);

  if (loading) {
    return (
      <AdminLayout pageTitle="Revenue Tracking">
        <div className="loading">Loading payments...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout pageTitle="Revenue Tracking">
      <div className="reports-content reports-page">
        <section className="reports-controls reports-controls--responsive">
          <h2 className="reports-controls__title">Filter payments</h2>
          <div className="date-range-selector date-range-selector--responsive">
            <div className="date-range-group">
              <label htmlFor="startDate">Start</label>
              <input
                type="date"
                id="startDate"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              />
            </div>
            <div className="date-range-group">
              <label htmlFor="endDate">End</label>
              <input
                type="date"
                id="endDate"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              />
            </div>
            <div className="date-range-group">
              <label htmlFor="statusFilter">Status</label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | "all")}
              >
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="refunded">Refunded</option>
                <option value="all">All</option>
              </select>
            </div>
          </div>
        </section>

        {error && <div className="message error">{error}</div>}

        <div className="report-content">
          <div className="report-summary">
            <h3>Revenue Summary</h3>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-label">Total Paid</span>
                <span className="summary-value">{formatCurrency(summary.totalPaid)}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Total Refunded</span>
                <span className="summary-value">{formatCurrency(summary.totalRefunded)}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Net Revenue</span>
                <span className="summary-value">{formatCurrency(summary.netRevenue)}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Average Paid Booking</span>
                <span className="summary-value">{formatCurrency(summary.averagePaid)}</span>
              </div>
            </div>
          </div>

          <div className="report-section">
            <h4>Payment Overview</h4>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-label">Paid</span>
                <span className="summary-value">{summary.counts.paid}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Pending Amount</span>
                <span className="summary-value">{formatCurrency(summary.totalPending)}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Pending</span>
                <span className="summary-value">{summary.counts.pending}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Refunded</span>
                <span className="summary-value">{summary.counts.refunded}</span>
              </div>
            </div>
          </div>

          <div className="report-section">
            <h4>Paid by Method</h4>
            <div className="revenue-by-type">
              {Object.keys(summary.methodTotals).length === 0 && (
                <div className="revenue-item">No paid transactions in range.</div>
              )}
              {Object.entries(summary.methodTotals).map(([method, stats]) => (
                <div key={method} className="revenue-item">
                  <span className="revenue-type">{method}</span>
                  <span className="revenue-amount">{formatCurrency(stats.amount)}</span>
                  <span className="revenue-bookings">({stats.count} payments)</span>
                </div>
              ))}
            </div>
          </div>

          <div className="report-section">
            <h4>Payment Records</h4>
            <AdminTableContainer>
              <table className="bookings-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Guest</th>
                    <th>Room</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Method</th>
                    <th>Date</th>
                    <th>Transaction</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((booking) => (
                    <tr key={booking._id}>
                      <td>{getBookingReference(booking)}</td>
                      <td>{booking.guestName || booking.user?.username || "Guest"}</td>
                      <td>{booking.room?.roomNumber || "N/A"}</td>
                      <td>{formatCurrency(booking.totalAmount || 0)}</td>
                      <td>{booking.paymentStatus}</td>
                      <td>{normalizeMethod(booking.paymentMethod)}</td>
                      <td>{formatDate(getEffectivePaymentDate(booking))}</td>
                      <td>{booking.transactionId || "—"}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8}>No payments found for the selected filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </AdminTableContainer>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default RevenueTracking;
