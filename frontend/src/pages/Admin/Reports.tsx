import { useState, useEffect } from "react";
import "../../styles/main.css";
import AdminLayout from "../../components/AdminLayout";
import { showSuccess, showError } from "../../utils/alerts";
import { API_BASE_URL } from "../../config/api";

interface ReportData {
  occupancy?: any;
  revenue?: any;
  bookings?: any;
  dashboard?: any;
}

interface DateRange {
  startDate: string;
  endDate: string;
}

function Reports() {
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingReportType, setLoadingReportType] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData>({});
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [message, setMessage] = useState("");

  const fetchReport = async (reportType: string) => {
    setLoading(true);
    setLoadingReportType(reportType);
    setMessage("");
    
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });

      const response = await fetch(`http://localhost:5000/reports/${reportType}?${params}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setReportData(prev => ({ ...prev, [reportType]: data.data }));
        setActiveReport(reportType);
        const reportName = reportType === 'bookings' ? 'Booking Analytics' : 
                          reportType.charAt(0).toUpperCase() + reportType.slice(1) + ' Report';
        await showSuccess('Report Generated!', `${reportName} has been generated successfully.`);
      } else {
        showError('Report Failed', `Failed to generate ${reportType} report`);
      }
    } catch (error) {
      console.error(`Error fetching ${reportType} report:`, error);
      showError('Report Failed', `Error generating ${reportType} report`);
    } finally {
      setLoading(false);
      setLoadingReportType(null);
    }
  };

  const downloadPDF = async (reportType: string) => {
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });

      const response = await fetch(`${API_BASE_URL}/reports/${reportType}/pdf?${params}`, {
        credentials: "include",
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${reportType}-report-${dateRange.startDate}-to-${dateRange.endDate}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        await showSuccess('PDF Downloaded!', 'The report has been downloaded successfully.');
      } else {
        try {
          const err = await response.json();
          const errorMsg = err?.message ? `Failed to download PDF: ${err.message}` : `Failed to download PDF`;
          showError('Download Failed', errorMsg);
          if (err?.details) console.error('PDF error details:', err.details);
        } catch {
          const text = await response.text();
          const errorMsg = text ? `Failed to download PDF: ${text}` : `Failed to download PDF`;
          showError('Download Failed', errorMsg);
        }
      }
    } catch (error) {
      console.error(`Error downloading PDF:`, error);
      showError('Download Failed', 'Error downloading PDF');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const renderOccupancyReport = () => {
    const data = reportData.occupancy;
    if (!data) return null;

    return (
      <div className="report-content">
        <div className="report-summary">
          <h3>Occupancy Summary</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">Total Rooms:</span>
              <span className="summary-value">{data.summary.totalRooms}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Bookings:</span>
              <span className="summary-value">{data.summary.totalBookings}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Room Nights:</span>
              <span className="summary-value">{data.summary.totalRoomNights}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Occupancy Rate:</span>
              <span className="summary-value">{data.summary.occupancyRate}%</span>
            </div>
          </div>
        </div>

        <div className="report-section">
          <h4>Room Type Breakdown</h4>
          <div className="room-type-stats">
            {Object.entries(data.roomTypeBreakdown).map(([roomType, stats]: [string, any]) => (
              <div key={roomType} className="room-type-item">
                <span className="room-type-name">{roomType}</span>
                <span className="room-type-bookings">{stats.bookings} bookings</span>
                <span className="room-type-revenue">{formatCurrency(stats.revenue)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="report-section">
          <h4>Daily Occupancy</h4>
          <div className="daily-occupancy">
            {data.dailyOccupancy.slice(-7).map((day: any) => (
              <div key={day.date} className="daily-item">
                <span className="daily-date">{formatDate(day.date)}</span>
                <span className="daily-occupied">{day.occupiedRooms}/{day.totalRooms}</span>
                <span className="daily-rate">{day.occupancyRate.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderRevenueReport = () => {
    const data = reportData.revenue;
    if (!data) return null;

    return (
      <div className="report-content">
        <div className="report-summary">
          <h3>Revenue Summary</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">Total Revenue:</span>
              <span className="summary-value">{formatCurrency(data.summary.totalRevenue)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Bookings:</span>
              <span className="summary-value">{data.summary.totalBookings}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Average Booking Value:</span>
              <span className="summary-value">{formatCurrency(data.summary.averageBookingValue)}</span>
            </div>
          </div>
        </div>

        <div className="report-section">
          <h4>Revenue by Room Type</h4>
          <div className="revenue-by-type">
            {Object.entries(data.revenueByRoomType).map(([roomType, stats]: [string, any]) => (
              <div key={roomType} className="revenue-item">
                <span className="revenue-type">{roomType}</span>
                <span className="revenue-amount">{formatCurrency(stats.revenue)}</span>
                <span className="revenue-bookings">({stats.bookings} bookings)</span>
              </div>
            ))}
          </div>
        </div>

        <div className="report-section">
          <h4>Payment Status</h4>
          <div className="payment-status">
            <div className="payment-item">
              <span className="payment-label">Paid:</span>
              <span className="payment-count">{data.paymentStatusBreakdown.paid}</span>
            </div>
            <div className="payment-item">
              <span className="payment-label">Pending:</span>
              <span className="payment-count">{data.paymentStatusBreakdown.pending}</span>
            </div>
            <div className="payment-item">
              <span className="payment-label">Refunded:</span>
              <span className="payment-count">{data.paymentStatusBreakdown.refunded}</span>
            </div>
          </div>
        </div>

        <div className="report-section">
          <h4>Top Customers</h4>
          <div className="top-customers">
            {data.topCustomers.slice(0, 5).map((customer: any, index: number) => (
              <div key={index} className="customer-item">
                <span className="customer-name">{customer.name}</span>
                <span className="customer-email">{customer.email}</span>
                <span className="customer-spent">{formatCurrency(customer.totalSpent)}</span>
                <span className="customer-bookings">({customer.bookings} bookings)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderBookingsReport = () => {
    const data = reportData.bookings;
    if (!data) return null;

    return (
      <div className="report-content">
        <div className="report-summary">
          <h3>Booking Analytics</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">Total Bookings:</span>
              <span className="summary-value">{data.summary.totalBookings}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Average Duration:</span>
              <span className="summary-value">{data.summary.averageDuration} nights</span>
            </div>
          </div>
        </div>

        <div className="report-section">
          <h4>Booking Status Breakdown</h4>
          <div className="status-breakdown">
            {Object.entries(data.statusBreakdown).map(([status, count]: [string, any]) => (
              <div key={status} className="status-item">
                <span className="status-name">{status.replace('-', ' ')}</span>
                <span className="status-count">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="report-section">
          <h4>Room Type Popularity</h4>
          <div className="room-popularity">
            {Object.entries(data.roomTypePopularity).map(([roomType, count]: [string, any]) => (
              <div key={roomType} className="popularity-item">
                <span className="popularity-type">{roomType}</span>
                <span className="popularity-count">{count} bookings</span>
              </div>
            ))}
          </div>
        </div>

        <div className="report-section">
          <h4>Booking Sources</h4>
          <div className="booking-sources">
            <div className="source-item">
              <span className="source-name">Direct Bookings:</span>
              <span className="source-count">{data.bookingSources.direct}</span>
            </div>
            <div className="source-item">
              <span className="source-name">Google Calendar:</span>
              <span className="source-count">{data.bookingSources.google_calendar}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout pageTitle="Reports">
      {message && (
        <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="reports-content reports-page">
        <section className="reports-controls reports-controls--responsive">
          <h2 className="reports-controls__title">Date range</h2>
          <div className="date-range-selector date-range-selector--responsive">
            <div className="date-range-group">
              <label htmlFor="startDate">Start</label>
              <input
                type="date"
                id="startDate"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
              />
            </div>
            <div className="date-range-group">
              <label htmlFor="endDate">End</label>
              <input
                type="date"
                id="endDate"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
              />
            </div>
          </div>
        </section>

        <section className="reports-section reports-section--responsive">
          <div className="report-types report-types--responsive">
            <h3 className="report-types__title">Report type</h3>
            <div className="report-buttons report-buttons--grid">
              <button 
                className={`admin-button report-btn ${activeReport === 'occupancy' ? 'active' : ''}`}
                onClick={() => fetchReport('occupancy')}
                disabled={loading}
              >
                {loading && loadingReportType === 'occupancy' ? 'Generating...' : 'Occupancy'}
              </button>
              <button 
                className={`admin-button report-btn ${activeReport === 'revenue' ? 'active' : ''}`}
                onClick={() => fetchReport('revenue')}
                disabled={loading}
              >
                {loading && loadingReportType === 'revenue' ? 'Generating...' : 'Revenue'}
              </button>
              <button 
                className={`admin-button report-btn ${activeReport === 'bookings' ? 'active' : ''}`}
                onClick={() => fetchReport('bookings')}
                disabled={loading}
              >
                {loading && loadingReportType === 'bookings' ? 'Generating...' : 'Bookings'}
              </button>
            </div>
          </div>

          {activeReport && (
            <div className="report-display report-display--responsive">
              <div className="report-actions report-actions--responsive">
                <button 
                  className="admin-button secondary"
                  onClick={() => downloadPDF(activeReport)}
                >
                  📄 Download PDF
                </button>
              </div>
              {activeReport === 'occupancy' && renderOccupancyReport()}
              {activeReport === 'revenue' && renderRevenueReport()}
              {activeReport === 'bookings' && renderBookingsReport()}
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}

export default Reports;
