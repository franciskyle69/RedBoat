import { Link } from "react-router-dom";
import "../../styles/main.css";

function Feedback() {
  return (
    <div className="user-container">
      <header className="user-header">
        <h2 className="user-title">Feedback & Reviews</h2>
        <nav className="user-nav">
          <Link to="/dashboard" className="user-nav-link">Dashboard</Link>
          <Link to="/user/profile" className="user-nav-link">Profile</Link>
          <Link to="/user/bookings" className="user-nav-link">Bookings</Link>
          <Link to="/user/rooms" className="user-nav-link">Rooms</Link>
          <Link to="/user/calendar" className="user-nav-link">Calendar</Link>
          <Link to="/user/feedback" className="user-nav-link active">Feedback</Link>
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
          <h3 className="user-card-title">Submit Feedback</h3>
          <p className="user-card-description">Provide feedback about your experience to help improve hotel services.</p>
          <button className="user-card-button">Write Review</button>
        </div>
        <div className="user-card">
          <h3 className="user-card-title">My Reviews</h3>
          <p className="user-card-description">View and manage your submitted reviews and ratings.</p>
          <button className="user-card-button">My Reviews</button>
        </div>
        <div className="user-card">
          <h3 className="user-card-title">Notifications</h3>
          <p className="user-card-description">Receive booking confirmations and reminders to avoid missing your stay.</p>
          <button className="user-card-button">Notification Settings</button>
        </div>
      </div>
    </div>
  );
}

export default Feedback;
