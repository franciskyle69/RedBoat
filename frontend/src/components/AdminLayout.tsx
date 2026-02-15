import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import NotificationBell from "./NotificationBell";
import "../styles/admin-layout.css";
import defaultAvatar from "../assets/redBoat.png";
import { API_BASE_URL } from "../config/api";
import { dispatchLogout } from "../utils/authEvents";

interface AdminLayoutProps {
  children: React.ReactNode;
  pageTitle: string;
}

interface AdminPermissions {
  manageBookings?: boolean;
  manageRooms?: boolean;
  manageHousekeeping?: boolean;
  manageUsers?: boolean;
  viewReports?: boolean;
}

interface UserInfo {
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  profilePicture?: string;
  adminPermissions?: AdminPermissions;
}

function AdminLayout({ children, pageTitle }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<UserInfo>({});
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/me`, {
          credentials: "include",
        });
        if (!cancelled && res.ok) {
          const data = await res.json();
          setUserInfo(data?.data || {});
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

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await fetch(`${API_BASE_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {}
    dispatchLogout();
    window.location.href = "/";
  };

  const getCurrentDate = () => {
    const date = new Date();
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const displayName =
    userInfo.firstName && userInfo.lastName
      ? `${userInfo.firstName} ${userInfo.lastName}`
      : userInfo.username || "Admin";

  const isSuperadmin = userInfo.role === "superadmin";
  const perms: AdminPermissions = userInfo.adminPermissions || {};
  const canBookings = isSuperadmin || (userInfo.role === "admin" && perms.manageBookings !== false);
  const canRooms = isSuperadmin || (userInfo.role === "admin" && perms.manageRooms !== false);
  const canHousekeeping = isSuperadmin || (userInfo.role === "admin" && perms.manageHousekeeping !== false);
  const canUsers = isSuperadmin || (userInfo.role === "admin" && perms.manageUsers !== false);
  const canReports = isSuperadmin || (userInfo.role === "admin" && perms.viewReports !== false);

  const resolveAvatarSrc = (src?: string) => {
    if (!src) return defaultAvatar;
    if (src.startsWith("http://") || src.startsWith("https://")) return src;
    if (src.startsWith("/uploads") || src.startsWith("uploads/")) {
      const normalized = src.startsWith("/") ? src : `/${src}`;
      return `${API_BASE_URL}${normalized}`;
    }
    return src;
  };

  if (loading) {
    return <div className="admin-loading">Loading...</div>;
  }

  return (
    <div className={`admin-layout ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
      <div className={`sidebar ${sidebarOpen ? '' : 'collapsed'} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="user-info">
          <img
            src={resolveAvatarSrc(userInfo.profilePicture)}
            alt="profile"
          />
          <div>
            <p className="name">{displayName}</p>
            <p className="role">{userInfo.role || "Admin"}</p>
          </div>
          <span
            className={`material-icons-outlined arrow ${sidebarOpen ? '' : 'collapsed'}`}
            role="button"
            aria-label="Toggle sidebar"
            tabIndex={0}
            onClick={() => setSidebarOpen((v) => !v)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSidebarOpen((v) => !v);
              }
            }}
          >
            expand_more
          </span>
        </div>

        <p className="menu-label">DAILY OPERATION</p>

        <Link
          to="/admin"
          className={`menu-item ${isActive("/admin") && location.pathname === "/admin" ? "active" : ""}`}
        >
          <span className="material-icons-outlined">home</span>
          Dashboard
        </Link>

        {canBookings && (
          <Link
            to="/admin/bookings"
            className={`menu-item ${isActive("/admin/bookings") ? "active" : ""}`}
          >
            <span className="material-icons-outlined">book_online</span>
            Bookings
          </Link>
        )}

        {canUsers && (
          <Link
            to="/admin/user-management"
            className={`menu-item ${isActive("/admin/user-management") ? "active" : ""}`}
          >
            <span className="material-icons-outlined">group</span>
            Users
          </Link>
        )}

        {canRooms && (
          <Link
            to="/admin/room-management"
            className={`menu-item ${isActive("/admin/room-management") ? "active" : ""}`}
          >
            <span className="material-icons-outlined">meeting_room</span>
            Rooms
          </Link>
        )}

        {canHousekeeping && (
          <Link
            to="/admin/housekeeping"
            className={`menu-item ${isActive("/admin/housekeeping") ? "active" : ""}`}
          >
            <span className="material-icons-outlined">cleaning_services</span>
            Housekeeping
          </Link>
        )}

        {canBookings && (
          <Link
            to="/admin/calendar"
            className={`menu-item ${isActive("/admin/calendar") ? "active" : ""}`}
          >
            <span className="material-icons-outlined">calendar_month</span>
            Calendar
          </Link>
        )}

        {canReports && (
          <Link
            to="/admin/reports"
            className={`menu-item ${isActive("/admin/reports") ? "active" : ""}`}
          >
            <span className="material-icons-outlined">bar_chart</span>
            Reports
          </Link>
        )}

        {canReports && (
          <Link
            to="/admin/revenue-tracking"
            className={`menu-item ${isActive("/admin/revenue-tracking") ? "active" : ""}`}
          >
            <span className="material-icons-outlined">payments</span>
            Revenue Tracking
          </Link>
        )}

        {canReports && (
          <Link
            to="/admin/activity-logs"
            className={`menu-item ${isActive("/admin/activity-logs") ? "active" : ""}`}
          >
            <span className="material-icons-outlined">list_alt</span>
            Activity Logs
          </Link>
        )}

        <p className="menu-label">SYSTEM OPTION</p>

        <Link
          to="/admin/settings"
          className={`menu-item ${isActive("/admin/settings") ? "active" : ""}`}
        >
          <span className="material-icons-outlined">settings</span>
          Settings
        </Link>

        <a
          href="/"
          className="menu-item"
          onClick={handleLogout}
        >
          <span className="material-icons-outlined">logout</span>
          Log out
        </a>
      </div>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="mobile-overlay" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className={`main ${sidebarOpen ? '' : 'expanded'}`}>
        <div className="topbar">
          <div className="topbar-left">
            <button 
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <span className="material-icons-outlined">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
            <h2>{pageTitle}</h2>
          </div>
          <div className="actions">
            <NotificationBell />
            <span className="date">{getCurrentDate()}</span>
          </div>
        </div>

        <div className="content-area">{children}</div>
      </div>
    </div>
  );
}

export default AdminLayout;

