import { Link, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "../../styles/main.css";
import AdminLayout from "../../components/AdminLayout";

function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | undefined>(undefined);
  const [dashboard, setDashboard] = useState<any | null>(null);

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

  useEffect(() => {
    if (userRole !== "admin") return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("http://localhost:5000/reports/dashboard", {
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
  if (userRole !== "admin") return <Navigate to="/dashboard" replace />;
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
          <p>Quick access to daily hotel operations.</p>
          <div className="actions">
            <Link to="/admin/bookings" className="btn blue">Check-ins</Link>
            <Link to="/admin/housekeeping" className="btn success">Housekeeping</Link>
          </div>
        </div>

        <div className="card">
          <h2>Hotel Status</h2>
          <ul className="status-list">
            <li>
              <span className="material-icons-outlined">event_available</span>
              {occupied}/{totalRooms} Rooms Occupied
            </li>
            <li>
              <span className="material-icons-outlined">meeting_room</span>
              {checkInsToday} Check-ins Today
            </li>
            <li>
              <span className="material-icons-outlined">cleaning_services</span>
              {roomsNeedCleaning} Rooms Need Cleaning
            </li>
            <li>
              <span className="material-icons-outlined">attach_money</span>
              ₱{revenueToday}
            </li>
          </ul>
        </div>
      </section>
    </AdminLayout>
  );
}

export default AdminDashboard;


