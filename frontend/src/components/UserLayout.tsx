import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import NotificationBell from "./NotificationBell";
import "../styles/admin-layout.css";
import defaultAvatar from "../assets/redBoat.png";
import { API_BASE_URL } from "../config/api";
import { dispatchLogout } from "../utils/authEvents";

interface UserLayoutProps {
  children: React.ReactNode;
  pageTitle: string;
}

interface UserInfo {
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  profilePicture?: string;
}

function UserLayout({ children, pageTitle }: UserLayoutProps) {
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
    if (path === "/dashboard") {
      return location.pathname === "/dashboard" || location.pathname === "/user/dashboard";
    }
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const displayName =
    userInfo.firstName && userInfo.lastName
      ? `${userInfo.firstName} ${userInfo.lastName}`
      : userInfo.username || "Guest";

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
            <p className="role">{userInfo.role || "Guest"}</p>
          </div>
          <span
            className={`material-icons-outlined arrow ${sidebarOpen ? '' : 'collapsed'}`}
            role="button"
            aria-label="Toggle sidebar"
            tabIndex={0}
            onClick={() => setSidebarOpen((v) => !v)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSidebarOpen((v) => !v); } }}
          >
            expand_more
          </span>
        </div>

        <p className="menu-label">MY ACCOUNT</p>

        <Link
          to="/dashboard"
          className={`menu-item ${isActive("/dashboard") ? "active" : ""}`}
        >
          <span className="material-icons-outlined">home</span>
          Dashboard
        </Link>

        <Link
          to="/user/profile"
          className={`menu-item ${isActive("/user/profile") ? "active" : ""}`}
        >
          <span className="material-icons-outlined">person</span>
          Profile
        </Link>

        <Link
          to="/user/bookings"
          className={`menu-item ${isActive("/user/bookings") ? "active" : ""}`}
        >
          <span className="material-icons-outlined">book_online</span>
          My Bookings
        </Link>

        <Link
          to="/user/rooms"
          className={`menu-item ${isActive("/user/rooms") ? "active" : ""}`}
        >
          <span className="material-icons-outlined">hotel</span>
          Browse Rooms
        </Link>

        <Link
          to="/user/calendar"
          className={`menu-item ${isActive("/user/calendar") ? "active" : ""}`}
        >
          <span className="material-icons-outlined">calendar_month</span>
          Calendar
        </Link>

        <Link
          to="/user/feedback"
          className={`menu-item ${isActive("/user/feedback") ? "active" : ""}`}
        >
          <span className="material-icons-outlined">feedback</span>
          Feedback
        </Link>

        <p className="menu-label">SETTINGS</p>

        <Link
          to="/user/settings"
          className={`menu-item ${isActive("/user/settings") ? "active" : ""}`}
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

export default UserLayout;

