import { Link, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "../../styles/main.css";
import UserLayout from "../../components/UserLayout";

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

  if (loading) return <div className="admin-loading">Loading...</div>;
  if (userRole === "admin") return <Navigate to="/admin" replace />;
  
  return (
    <UserLayout pageTitle="Dashboard">
      <section className="cards">
        <div className="card">
          <h2>Quick Actions</h2>
          <p>Access hotel services quickly.</p>
          <div className="actions">
            <Link to="/user/bookings" className="btn blue">Book Room</Link>
            <Link to="/user/rooms" className="btn success">View Rooms</Link>
            <Link to="/user/calendar" className="btn blue">Calendar</Link>
          </div>
        </div>
        <div className="card">
          <h2>Guest Status</h2>
          <ul className="status-list">
            <li>
              <span className="material-icons-outlined">check_circle</span>
              Account Active
            </li>
            <li>
              <span className="material-icons-outlined">hotel</span>
              No Active Bookings
            </li>
            <li>
              <span className="material-icons-outlined">notifications</span>
              Booking Notifications On
            </li>
            <li>
              <span className="material-icons-outlined">star</span>
              0 Reviews Given
            </li>
          </ul>
        </div>
      </section>
    </UserLayout>
  );
}

export default UserDashboard;


