import { Link } from "react-router-dom";
import "../../styles/main.css";

function RoomManagement() {
  return (
    <div className="admin-container">
      <header className="admin-header">
        <h2 className="admin-title">Room Management</h2>
        <nav className="admin-nav">
          <Link to="/admin" className="admin-nav-link">Dashboard</Link>
          <Link to="/admin/user-management" className="admin-nav-link">Users</Link>
          <Link to="/admin/room-management" className="admin-nav-link active">Rooms</Link>
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
          <h3 className="admin-card-title">Room Availability Calendar</h3>
          <p className="admin-card-description">View and manage room calendar to track occupancy.</p>
          <button className="admin-card-button">View Calendar</button>
        </div>
        <div className="admin-card">
          <h3 className="admin-card-title">Room Status</h3>
          <p className="admin-card-description">Monitor room availability and maintenance status.</p>
          <button className="admin-card-button">Room Status</button>
        </div>
        <div className="admin-card">
          <h3 className="admin-card-title">Room Types</h3>
          <p className="admin-card-description">Manage different room types and pricing.</p>
          <button className="admin-card-button">Manage Types</button>
        </div>
      </div>
    </div>
  );
}

export default RoomManagement;
