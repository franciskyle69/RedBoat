import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Database } from "lucide-react";
import "../../styles/main.css";
import AdminLayout from "../../components/AdminLayout";
import ThemeToggle from "../../components/ThemeToggle";
import { API_BASE_URL } from "../../config/api";

type AdminSettingsState = {
  systemName: string;
  defaultLanguage: string;
  maintenanceMode: boolean;
  smtpHost: string;
  smtpPort: string;
  smtpFrom: string;
};

function AdminSettings() {
  // Fetch user role directly
  const [userRole, setUserRole] = useState<string | null>(null);
  const isSuperadmin = userRole === "superadmin";

  const [settings, setSettings] = useState<AdminSettingsState>(() => {
    const defaults: AdminSettingsState = {
      systemName: "RedBoat",
      defaultLanguage: "en",
      maintenanceMode: false,
      smtpHost: "",
      smtpPort: "587",
      smtpFrom: "",
    };

    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("adminSettings");
        if (stored) {
          const parsed = JSON.parse(stored);
          return { ...defaults, ...parsed };
        }
      }
    } catch {
      // ignore parse errors
    }

    return defaults;
  });

  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("adminSettings", JSON.stringify(settings));
      }
    } catch {
      // ignore storage errors
    }
  }, [settings]);

  // Fetch user role on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/me`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setUserRole(data?.data?.role || null);
        }
      } catch {
        // ignore errors
      }
    })();
  }, []);

  const handleChange = <K extends keyof AdminSettingsState>(
    key: K,
    value: AdminSettingsState[K]
  ) => {
    setSettings((prev: AdminSettingsState) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = (section: "system" | "email") => {
    const base = section === "system" ? "System settings updated" : "Email settings updated";
    setMessage(base);
    window.setTimeout(() => setMessage(null), 4000);
  };

  return (
    <AdminLayout pageTitle="Settings">
      <div className="settings-container">
        {message && (
          <div
            className={`message ${
              message.toLowerCase().includes("error") ? "error" : "success"
            }`}
          >
            {message}
          </div>
        )}

        <div className="settings-card">
          <h2>System Configuration</h2>
          <p>Configure system-wide settings and preferences.</p>

          <div className="settings-section">
            <div className="settings-row">
              <div className="settings-row-main">
                <span className="settings-row-title">System name</span>
                <span className="settings-row-description">
                  Display name used across the admin dashboard and public site.
                </span>
              </div>
              <div className="settings-row-action">
                <input
                  type="text"
                  value={settings.systemName}
                  onChange={(e) => handleChange("systemName", e.target.value)}
                  style={{ minWidth: 220 }}
                />
              </div>
            </div>

            <div className="settings-row">
              <div className="settings-row-main">
                <span className="settings-row-title">Default language</span>
                <span className="settings-row-description">
                  Language used by default for guests and admins.
                </span>
              </div>
              <div className="settings-row-action">
                <select
                  value={settings.defaultLanguage}
                  onChange={(e) => handleChange("defaultLanguage", e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                </select>
              </div>
            </div>

            <div className="settings-row">
              <div className="settings-row-main">
                <span className="settings-row-title">Maintenance mode</span>
                <span className="settings-row-description">
                  Toggle a visual indicator that the system is under maintenance (UI only).
                </span>
              </div>
              <div className="settings-row-action">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => handleChange("maintenanceMode", e.target.checked)}
                />
              </div>
            </div>
          </div>

          <div className="form-actions" style={{ justifyContent: "flex-end" }}>
            <button
              className="admin-button primary"
              type="button"
              onClick={() => handleSave("system")}
            >
              Save system settings
            </button>
          </div>
        </div>

        <div className="settings-card">
          <h2>Email Settings</h2>
          <p>Manage email sender information used by the system.</p>

          <div className="settings-section">
            <div className="settings-row">
              <div className="settings-row-main">
                <span className="settings-row-title">SMTP host</span>
                <span className="settings-row-description">
                  Hostname of your email server.
                </span>
              </div>
              <div className="settings-row-action">
                <input
                  type="text"
                  value={settings.smtpHost}
                  onChange={(e) => handleChange("smtpHost", e.target.value)}
                  style={{ minWidth: 220 }}
                />
              </div>
            </div>

            <div className="settings-row">
              <div className="settings-row-main">
                <span className="settings-row-title">SMTP port</span>
                <span className="settings-row-description">
                  Port used for sending email (e.g. 587).
                </span>
              </div>
              <div className="settings-row-action">
                <input
                  type="text"
                  value={settings.smtpPort}
                  onChange={(e) => handleChange("smtpPort", e.target.value)}
                  style={{ width: 90 }}
                />
              </div>
            </div>

            <div className="settings-row">
              <div className="settings-row-main">
                <span className="settings-row-title">From email</span>
                <span className="settings-row-description">
                  Address that appears as the sender in guest emails.
                </span>
              </div>
              <div className="settings-row-action">
                <input
                  type="email"
                  value={settings.smtpFrom}
                  onChange={(e) => handleChange("smtpFrom", e.target.value)}
                  style={{ minWidth: 220 }}
                />
              </div>
            </div>
          </div>

          <div className="form-actions" style={{ justifyContent: "flex-end" }}>
            <button
              className="admin-button primary"
              type="button"
              onClick={() => handleSave("email")}
            >
              Save email settings
            </button>
          </div>
        </div>

        <div className="settings-card">
          <h2>Appearance</h2>
          <p>Switch between light and dark theme for the admin dashboard.</p>

          <div className="settings-section">
            <div className="settings-row">
              <div className="settings-row-main">
                <span className="settings-row-title">Theme</span>
                <span className="settings-row-description">
                  Toggle the dashboard between light and dark mode.
                </span>
              </div>
              <div className="settings-row-action">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>

        {/* Database Backup Section - Superadmin Only */}
        {isSuperadmin && (
          <div className="settings-card">
            <h2>Database Backup & Restore</h2>
            <p>Create backups of your database and restore them when needed. Only superadmins can access this feature.</p>

            <div className="settings-section">
              <div className="settings-row">
                <div className="settings-row-main">
                  <span className="settings-row-title">Manage Backups</span>
                  <span className="settings-row-description">
                    Create, download, restore, and manage database backups from the dedicated backup page.
                  </span>
                </div>
                <div className="settings-row-action">
                  <Link to="/admin/backup" className="admin-button primary" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
                    <Database size={18} />
                    Open Backup Manager
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminSettings;
