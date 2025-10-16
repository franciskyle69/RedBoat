import { Link } from "react-router-dom";
import "../../styles/main.css";

function UserSettings() {
  return (
    <div className="user-container">
      <header className="user-header">
        <h2 className="user-title">Settings</h2>
        <nav className="user-nav">
          <Link to="/dashboard" className="user-nav-link">Dashboard</Link>
          <Link to="/user/profile" className="user-nav-link">Profile</Link>
          <Link to="/user/bookings" className="user-nav-link">Bookings</Link>
          <Link to="/user/rooms" className="user-nav-link">Rooms</Link>
          <Link to="/user/calendar" className="user-nav-link">Calendar</Link>
          <Link to="/user/feedback" className="user-nav-link">Feedback</Link>
          <Link to="/user/settings" className="user-nav-link active">Settings</Link>
          <Link to="/" className="user-logout" onClick={async (e) => {
            e.preventDefault();
            try { await fetch("http://localhost:5000/logout", { method: "POST", credentials: "include" }); } catch {}
            window.location.href = "/";
          }}>Logout</Link>
        </nav>
      </header>
      <div className="user-grid">
        <div className="user-card">
          <h3 className="user-card-title">Account Preferences</h3>
          <p className="user-card-description">Customize your account settings and preferences.</p>
          <button className="user-card-button">Preferences</button>
        </div>
        <div className="user-card">
          <h3 className="user-card-title">Security</h3>
          <p className="user-card-description">Manage your password and security settings.</p>
          <button className="user-card-button">Security</button>
        </div>
      </div>
    </div>
  );
}

export default UserSettings;
