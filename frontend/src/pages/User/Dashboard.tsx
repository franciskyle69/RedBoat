import { Link, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  BedDouble,
  CheckCircle,
  Hotel,
  Bell,
  Star,
  Calendar,
} from "lucide-react";
import "../../styles/main.css";
import UserLayout from "../../components/UserLayout";

function UserDashboard() {
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | undefined>(undefined);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("http://localhost:5000/me", {
          credentials: "include",
        });
        if (!cancelled && res.ok) {
          const data = await res.json();
          const user = data?.data;
          setUserRole(user?.role);
          setUserName(user?.name || user?.username || user?.email || "");
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

  const safeName = userName || "Guest";

  return (
    <UserLayout pageTitle="Dashboard">
      {/* Bootstrap navbar inside dashboard content */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark rounded mb-4">
        <div className="container-fluid">
          <Link className="navbar-brand" to="/dashboard">
            RedBoat
          </Link>
          <div className="collapse navbar-collapse">
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link className="nav-link" to="/user/bookings">
                  My Bookings
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/user/rooms">
                  Rooms
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/user/profile">
                  Profile
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <div className="container-fluid">
        <div className="mb-4">
          <h1 className="h3 text-light mb-1">Welcome, {safeName}!</h1>
          <p className="text-muted mb-0">
            Access hotel services and manage your bookings with ease.
          </p>
        </div>

        <section className="row g-3">
          <div className="col-lg-6">
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <h2 className="card-title h5 mb-2">Quick Actions</h2>
                <p className="card-text text-muted mb-3">
                  Jump straight to your most common tasks.
                </p>
                <div className="d-flex flex-wrap gap-2">
                  <Link
                    to="/user/bookings"
                    className="btn btn-primary d-flex align-items-center gap-1"
                  >
                    <CalendarDays size={18} />
                    <span>My Bookings</span>
                  </Link>
                  <Link
                    to="/user/rooms"
                    className="btn btn-success d-flex align-items-center gap-1"
                  >
                    <BedDouble size={18} />
                    <span>Browse Rooms</span>
                  </Link>
                  <Link
                    to="/user/calendar"
                    className="btn btn-outline-secondary d-flex align-items-center gap-1"
                  >
                    <Calendar size={18} />
                    <span>Calendar</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <h2 className="card-title h5 mb-3">Guest Status</h2>
                <ul className="list-unstyled mb-0">
                  <li className="d-flex align-items-center mb-2">
                    <CheckCircle size={20} className="me-2" />
                    <span>
                      <strong>Active</strong> Account Status
                    </span>
                  </li>
                  <li className="d-flex align-items-center mb-2">
                    <Hotel size={20} className="me-2" />
                    <span>
                      <strong>0</strong> Active Bookings
                    </span>
                  </li>
                  <li className="d-flex align-items-center mb-2">
                    <Bell size={20} className="me-2" />
                    <span>
                      <strong>On</strong> Booking Notifications
                    </span>
                  </li>
                  <li className="d-flex align-items-center">
                    <Star size={20} className="me-2" />
                    <span>
                      <strong>0</strong> Reviews Given
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </UserLayout>
  );
}

export default UserDashboard;


