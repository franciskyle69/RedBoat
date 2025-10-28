import { Link, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "../../styles/main.css";
import NotificationBell from "../../components/NotificationBell";

function AdminDashboard() {
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

  if (loading) return <div className="admin-loading">Loading...</div>;
  if (userRole !== "admin") return <Navigate to="/dashboard" replace />;
  return (
    <div className="admin-container">
      <header className="admin-header">
        <h2 className="admin-title">Hotel Management Dashboard</h2>
        <nav className="admin-nav">
          <NotificationBell />
          <Link to="/admin/user-management" className="admin-nav-link">Users</Link>
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
          <h3 className="admin-card-title">Today's Overview</h3>
          <p className="admin-card-description">Quick access to daily hotel operations.</p>
          <div className="admin-quick-actions">
            <Link to="/admin/bookings" className="admin-quick-link">Check-ins</Link>
            <Link to="/admin/housekeeping" className="admin-quick-link success">Housekeeping</Link>
          </div>
        </div>
        <div className="admin-card">
          <h3 className="admin-card-title">Hotel Status</h3>
          <ul className="admin-status-list">
            <li>🏨 45/50 Rooms Occupied</li>
            <li>📅 12 Check-ins Today</li>
            <li>🧹 8 Rooms Need Cleaning</li>
            <li>💰 $2,450 Revenue Today</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;


