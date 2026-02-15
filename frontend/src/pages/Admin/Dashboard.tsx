import { Link, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  CalendarCheck,
  BedDouble,
  Sparkles,
  DollarSign,
  ClipboardList,
  Users,
} from "lucide-react";
import "../../styles/main.css";
import AdminLayout from "../../components/AdminLayout";
import { API_BASE_URL } from "../../config/api";

function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | undefined>(undefined);
  const [userName, setUserName] = useState<string>("");
  const [dashboard, setDashboard] = useState<any | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/me`, {
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

  useEffect(() => {
    if (userRole !== "admin" && userRole !== "superadmin") return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/reports/dashboard`, {
          credentials: "include",
        });
        if (!cancelled && res.ok) {
          const data = await res.json();
          setDashboard(data?.data || null);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userRole]);

  if (loading) return <div className="admin-loading">Loading...</div>;
  const isAdminLike = userRole === "admin" || userRole === "superadmin";
  if (!isAdminLike) return <Navigate to="/dashboard" replace />;
  const occupied = dashboard?.overview?.occupiedToday ?? 0;
  const totalRooms = dashboard?.overview?.totalRooms ?? 0;
  const checkInsToday = dashboard?.today?.checkIns ?? 0;
  const roomsNeedCleaning = dashboard?.overview?.roomsNeedingCleaning ?? 0;
  const revenueToday = dashboard?.overview?.revenueToday ?? 0;

  const safeName = userName || "Admin";

  return (
    <AdminLayout pageTitle="Dashboard">
      {/* Bootstrap navbar inside dashboard content */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark rounded mb-4">
        <div className="container-fluid">
          <Link className="navbar-brand" to="/admin">
            RedBoat Admin
          </Link>
          <div className="collapse navbar-collapse">
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link className="nav-link" to="/admin/bookings">
                  Bookings
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/admin/reports">
                  Reports
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/admin/settings">
                  Settings
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <div className="container-fluid">
        <div className="mb-4">
          <h1 className="h3 text-light mb-1">
            Welcome back, {safeName}!
          </h1>
          <p className="text-muted mb-0">
            Here&apos;s a quick overview of today&apos;s hotel performance.
          </p>
        </div>

        <section className="row g-3">
          <div className="col-lg-6">
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <h2 className="card-title h5 mb-2">Today&apos;s Overview</h2>
                <p className="card-text text-muted mb-3">
                  Quick access to daily hotel operations and management tools.
                </p>
                <div className="d-flex flex-wrap gap-2">
                  <Link to="/admin/bookings" className="btn btn-primary d-flex align-items-center gap-1">
                    <ClipboardList size={18} />
                    <span>Check-ins</span>
                  </Link>
                  <Link to="/admin/housekeeping" className="btn btn-success d-flex align-items-center gap-1">
                    <Sparkles size={18} />
                    <span>Housekeeping</span>
                  </Link>
                  <Link to="/admin/users" className="btn btn-outline-secondary d-flex align-items-center gap-1">
                    <Users size={18} />
                    <span>Guests</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <h2 className="card-title h5 mb-3">Hotel Status</h2>
                <ul className="list-unstyled mb-0">
                  <li className="d-flex align-items-center mb-2">
                    <BedDouble size={20} className="me-2" />
                    <span>
                      <strong>
                        {occupied}/{totalRooms}
                      </strong>{" "}
                      Rooms Occupied
                    </span>
                  </li>
                  <li className="d-flex align-items-center mb-2">
                    <CalendarCheck size={20} className="me-2" />
                    <span>
                      <strong>{checkInsToday}</strong> Check-ins Today
                    </span>
                  </li>
                  <li className="d-flex align-items-center mb-2">
                    <Sparkles size={20} className="me-2" />
                    <span>
                      <strong>{roomsNeedCleaning}</strong> Rooms Need Cleaning
                    </span>
                  </li>
                  <li className="d-flex align-items-center">
                    <DollarSign size={20} className="me-2" />
                    <span>
                      <strong>₱{revenueToday.toLocaleString()}</strong> Revenue
                      Today
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;


