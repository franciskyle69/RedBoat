import { useEffect, useState } from "react";
import "../../styles/main.css";
import AdminLayout from "../../components/AdminLayout";
import ThemeToggle from "../../components/ThemeToggle";

type AdminSettingsState = {
  systemName: string;
  defaultLanguage: string;
  maintenanceMode: boolean;
  smtpHost: string;
  smtpPort: string;
  smtpFrom: string;
};

function AdminSettings() {
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

        <section className="cards">
          <div className="card">
            <h2>System Configuration</h2>
            <p>Configure system-wide settings and preferences.</p>

            <div className="setting-item">
              <label>System name</label>
              <input
                type="text"
                value={settings.systemName}
                onChange={(e) => handleChange("systemName", e.target.value)}
              />
            </div>

            <div className="setting-item">
              <label>Default language</label>
              <select
                value={settings.defaultLanguage}
                onChange={(e) => handleChange("defaultLanguage", e.target.value)}
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
              </select>
            </div>

            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => handleChange("maintenanceMode", e.target.checked)}
                />
                Enable maintenance mode (UI only)
              </label>
            </div>

            <button
              className="btn primary"
              type="button"
              onClick={() => handleSave("system")}
            >
              Save system settings
            </button>
          </div>

          <div className="card">
            <h2>Email Settings</h2>
            <p>Manage email templates and SMTP configuration.</p>

            <div className="setting-item">
              <label>SMTP host</label>
              <input
                type="text"
                value={settings.smtpHost}
                onChange={(e) => handleChange("smtpHost", e.target.value)}
              />
            </div>

            <div className="setting-item">
              <label>SMTP port</label>
              <input
                type="text"
                value={settings.smtpPort}
                onChange={(e) => handleChange("smtpPort", e.target.value)}
              />
            </div>

            <div className="setting-item">
              <label>From email</label>
              <input
                type="email"
                value={settings.smtpFrom}
                onChange={(e) => handleChange("smtpFrom", e.target.value)}
              />
            </div>

            <button
              className="btn primary"
              type="button"
              onClick={() => handleSave("email")}
            >
              Save email settings
            </button>
          </div>

          <div className="card">
            <h2>Appearance</h2>
            <p>Switch between light and dark theme.</p>
            <ThemeToggle />
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

export default AdminSettings;
