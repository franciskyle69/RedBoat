import { Link, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { CalendarDays, BedDouble, CheckCircle, Hotel, Bell, Star, Calendar } from "lucide-react";
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
  const isAdminLike = userRole === "admin" || userRole === "superadmin";
  if (isAdminLike) return <Navigate to="/admin" replace />;
  
  return (
    <UserLayout pageTitle="Dashboard">
      <section className="cards">
        <div className="card">
          <h2>Quick Actions</h2>
          <p>Access hotel services and manage your bookings with ease.</p>
          <div className="actions">
            <Link to="/user/bookings" className="btn blue">
              <CalendarDays size={18} />
              My Bookings
            </Link>
            <Link to="/user/rooms" className="btn success">
              <BedDouble size={18} />
              Browse Rooms
            </Link>
            <Link to="/user/calendar" className="btn primary">
              <Calendar size={18} />
              Calendar
            </Link>
          </div>
        </div>
        <div className="card">
          <h2>Guest Status</h2>
          <ul className="status-list">
            <li>
              <CheckCircle size={20} />
              <span><strong>Active</strong> Account Status</span>
            </li>
            <li>
              <Hotel size={20} />
              <span><strong>0</strong> Active Bookings</span>
            </li>
            <li>
              <Bell size={20} />
              <span><strong>On</strong> Booking Notifications</span>
            </li>
            <li>
              <Star size={20} />
              <span><strong>0</strong> Reviews Given</span>
            </li>
          </ul>
        </div>
      </section>
    </UserLayout>
  );
}

export default UserDashboard;


