import { Link } from "react-router-dom";
import "../../styles/main.css";

function AdminSettings() {
  return (
    <div className="admin-container">
      <header className="admin-header">
        <h2 className="admin-title">Admin Settings</h2>
        <nav className="admin-nav">
          <Link to="/admin" className="admin-nav-link">Dashboard</Link>
          <Link to="/admin/user-management" className="admin-nav-link">Users</Link>
          <Link to="/admin/room-management" className="admin-nav-link">Rooms</Link>
          <Link to="/admin/bookings" className="admin-nav-link">Bookings</Link>
          <Link to="/admin/calendar" className="admin-nav-link">Calendar</Link>
          <Link to="/admin/housekeeping" className="admin-nav-link">Housekeeping</Link>
          <Link to="/admin/reports" className="admin-nav-link">Reports</Link>
          <Link to="/admin/settings" className="admin-nav-link active">Settings</Link>
          <Link to="/" className="admin-logout" onClick={async (e) => {
            e.preventDefault();
            try { await fetch("http://localhost:5000/logout", { method: "POST", credentials: "include" }); } catch {}
            window.location.href = "/";
          }}>Logout</Link>
        </nav>
      </header>
      <div className="admin-grid">
        <div className="admin-card">
          <h3 className="admin-card-title">System Configuration</h3>
          <p className="admin-card-description">Configure system-wide settings and preferences.</p>
          <button className="admin-card-button">Configure</button>
        </div>
        <div className="admin-card">
          <h3 className="admin-card-title">Email Settings</h3>
          <p className="admin-card-description">Manage email templates and SMTP configuration.</p>
          <button className="admin-card-button">Email Config</button>
        </div>
      </div>
    </div>
  );
}

export default AdminSettings;
