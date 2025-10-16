import { Link } from "react-router-dom";
import "../../styles/main.css";

function Reports() {
  return (
    <div className="admin-container">
      <header className="admin-header">
        <h2 className="admin-title">Reports</h2>
        <nav className="admin-nav">
          <Link to="/admin" className="admin-nav-link">Dashboard</Link>
          <Link to="/admin/user-management" className="admin-nav-link">Users</Link>
          <Link to="/admin/room-management" className="admin-nav-link">Rooms</Link>
          <Link to="/admin/bookings" className="admin-nav-link">Bookings</Link>
          <Link to="/admin/calendar" className="admin-nav-link">Calendar</Link>
          <Link to="/admin/housekeeping" className="admin-nav-link">Housekeeping</Link>
          <Link to="/admin/reports" className="admin-nav-link active">Reports</Link>
          <Link to="/admin/settings" className="admin-nav-link">Settings</Link>
          <Link to="/" className="admin-logout" onClick={async (e) => {
            e.preventDefault();
            try { await fetch("http://localhost:5000/logout", { method: "POST", credentials: "include" }); } catch {}
            window.location.href = "/";
          }}>Logout</Link>
        </nav>
      </header>
      <div className="admin-grid">
        <div className="admin-card">
          <h3 className="admin-card-title">Report Generation</h3>
          <p className="admin-card-description">Generate reports (occupancy, revenue, performance) to analyze business performance.</p>
          <button className="admin-card-button">Generate Reports</button>
        </div>
        <div className="admin-card">
          <h3 className="admin-card-title">Feedback & Reviews</h3>
          <p className="admin-card-description">Review and respond to guest feedback to improve services.</p>
          <button className="admin-card-button">View Feedback</button>
        </div>
        <div className="admin-card">
          <h3 className="admin-card-title">Notification System</h3>
          <p className="admin-card-description">Send SMS/Email reminders so guests and staff stay updated.</p>
          <button className="admin-card-button">Send Notifications</button>
        </div>
      </div>
    </div>
  );
}

export default Reports;
