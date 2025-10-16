import { Link } from "react-router-dom";
import "../../styles/main.css";

function Housekeeping() {
  return (
    <div className="admin-container">
      <header className="admin-header">
        <h2 className="admin-title">Housekeeping Management</h2>
        <nav className="admin-nav">
          <Link to="/admin" className="admin-nav-link">Dashboard</Link>
          <Link to="/admin/user-management" className="admin-nav-link">Users</Link>
          <Link to="/admin/room-management" className="admin-nav-link">Rooms</Link>
          <Link to="/admin/bookings" className="admin-nav-link">Bookings</Link>
          <Link to="/admin/calendar" className="admin-nav-link">Calendar</Link>
          <Link to="/admin/housekeeping" className="admin-nav-link active">Housekeeping</Link>
          <Link to="/admin/reports" className="admin-nav-link">Reports</Link>
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
          <h3 className="admin-card-title">Task Assignment</h3>
          <p className="admin-card-description">Assign and monitor housekeeping tasks so rooms remain ready for guests.</p>
          <button className="admin-card-button">Assign Tasks</button>
        </div>
        <div className="admin-card">
          <h3 className="admin-card-title">Room Status</h3>
          <p className="admin-card-description">Track cleaning status and room readiness.</p>
          <button className="admin-card-button">Room Status</button>
        </div>
        <div className="admin-card">
          <h3 className="admin-card-title">Staff Schedule</h3>
          <p className="admin-card-description">Manage housekeeping staff schedules and assignments.</p>
          <button className="admin-card-button">Staff Schedule</button>
        </div>
      </div>
    </div>
  );
}

export default Housekeeping;
