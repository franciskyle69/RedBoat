import { Link, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { CalendarCheck, BedDouble, Sparkles, DollarSign, ClipboardList, Users } from "lucide-react";
import "../../styles/main.css";
import AdminLayout from "../../components/AdminLayout";
import { API_BASE_URL } from "../../config/api";

function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | undefined>(undefined);
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
  
  return (
    <AdminLayout pageTitle="Dashboard">
      <section className="cards">
        <div className="card">
          <h2>Today's Overview</h2>
          <p>Quick access to daily hotel operations and management tools.</p>
          <div className="actions">
            <Link to="/admin/bookings" className="btn blue">
              <ClipboardList size={18} />
              Check-ins
            </Link>
            <Link to="/admin/housekeeping" className="btn success">
              <Sparkles size={18} />
              Housekeeping
            </Link>
            <Link to="/admin/users" className="btn primary">
              <Users size={18} />
              Guests
            </Link>
          </div>
        </div>

        <div className="card">
          <h2>Hotel Status</h2>
          <ul className="status-list">
            <li>
              <BedDouble size={20} />
              <span><strong>{occupied}/{totalRooms}</strong> Rooms Occupied</span>
            </li>
            <li>
              <CalendarCheck size={20} />
              <span><strong>{checkInsToday}</strong> Check-ins Today</span>
            </li>
            <li>
              <Sparkles size={20} />
              <span><strong>{roomsNeedCleaning}</strong> Rooms Need Cleaning</span>
            </li>
            <li>
              <DollarSign size={20} />
              <span><strong>₱{revenueToday.toLocaleString()}</strong> Revenue Today</span>
            </li>
          </ul>
        </div>
      </section>
    </AdminLayout>
  );
}

export default AdminDashboard;


