import { Link } from "react-router-dom";
import "../../styles/main.css";

function UserManagement() {
  return (
    <div className="admin-container">
      <header className="admin-header">
        <h2 className="admin-title">User & Role Management</h2>
        <nav className="admin-nav">
          <Link to="/admin" className="admin-nav-link">Dashboard</Link>
          <Link to="/admin/user-management" className="admin-nav-link active">Users</Link>
          <Link to="/admin/room-management" className="admin-nav-link">Rooms</Link>
          <Link to="/admin/bookings" className="admin-nav-link">Bookings</Link>
          <Link to="/admin/calendar" className="admin-nav-link">Calendar</Link>
          <Link to="/admin/housekeeping" className="admin-nav-link">Housekeeping</Link>
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
          <h3 className="admin-card-title">User Login & Role Access</h3>
          <p className="admin-card-description">Manage user roles (Admin, Staff, Guest) to ensure secure system access.</p>
          <button className="admin-card-button">Manage Users</button>
        </div>
        <div className="admin-card">
          <h3 className="admin-card-title">Staff Management</h3>
          <p className="admin-card-description">Manage hotel staff accounts and permissions.</p>
          <button className="admin-card-button">Staff Accounts</button>
        </div>
        <div className="admin-card">
          <h3 className="admin-card-title">Guest Accounts</h3>
          <p className="admin-card-description">View and manage guest user accounts.</p>
          <button className="admin-card-button">Guest Management</button>
        </div>
      </div>
    </div>
  );
}

export default UserManagement;
