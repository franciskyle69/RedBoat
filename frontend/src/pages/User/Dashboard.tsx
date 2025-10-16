import { Link, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "../../styles/main.css";

function UserDashboard() {
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("http://localhost:5000/me", {
          credentials: "include",
        });
        if (!cancelled && res.ok) {
          const data = await res.json();
          setUserRole(data?.data?.role);
        }
      } catch {
        // ignore errors
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <div className="user-loading">Loading...</div>;
  if (userRole === "admin") return <Navigate to="/admin" replace />;
  return (
    <div className="user-container">
      <header className="user-header">
        <h2 className="user-title">Hotel Guest Dashboard</h2>
        <nav className="user-nav">
          <Link to="/dashboard" className="user-nav-link active">Dashboard</Link>
          <Link to="/user/profile" className="user-nav-link">Profile</Link>
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
          <h3 className="user-card-title">Quick Actions</h3>
          <p className="user-card-description">Access hotel services quickly.</p>
          <div className="user-quick-actions">
            <Link to="/user/bookings" className="user-quick-link">Book Room</Link>
            <Link to="/user/rooms" className="user-quick-link success">View Rooms</Link>
            <Link to="/user/calendar" className="user-quick-link">Calendar</Link>
          </div>
        </div>
        <div className="user-card">
          <h3 className="user-card-title">Guest Status</h3>
          <ul className="user-status-list">
            <li>✅ Account Active</li>
            <li>🏨 No Active Bookings</li>
            <li>📧 Booking Notifications On</li>
            <li>⭐ 0 Reviews Given</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;


