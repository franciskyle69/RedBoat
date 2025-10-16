import { Link } from "react-router-dom";
import "../../styles/main.css";

function Profile() {
  return (
    <div className="user-container">
      <header className="user-header">
        <h2 className="user-title">My Profile</h2>
        <nav className="user-nav">
          <Link to="/dashboard" className="user-nav-link">Dashboard</Link>
          <Link to="/user/profile" className="user-nav-link active">Profile</Link>
          <Link to="/user/bookings" className="user-nav-link">Bookings</Link>
          <Link to="/user/rooms" className="user-nav-link">Rooms</Link>
          <Link to="/user/calendar" className="user-nav-link">Calendar</Link>
          <Link to="/user/feedback" className="user-nav-link">Feedback</Link>
          <Link to="/user/settings" className="user-nav-link">Settings</Link>
          <Link to="/" className="user-logout" onClick={async (e) => {
            e.preventDefault();
            try { await fetch("http://localhost:5000/logout", { method: "POST", credentials: "include" }); } catch {}
            window.location.href = "/";
          }}>Logout</Link>
        </nav>
      </header>
      <div className="user-grid">
        <div className="user-card">
          <h3 className="user-card-title">Personal Information</h3>
          <p className="user-card-description">Update your personal details and contact information.</p>
          <button className="user-card-button">Edit Profile</button>
        </div>
        <div className="user-card">
          <h3 className="user-card-title">Account Settings</h3>
          <p className="user-card-description">Manage your account preferences and security settings.</p>
          <button className="user-card-button">Account Settings</button>
        </div>
      </div>
    </div>
  );
}

export default Profile;
