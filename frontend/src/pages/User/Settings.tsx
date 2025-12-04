// src/pages/User/Settings.tsx
import { useEffect, useState } from "react";
import "../../styles/main.css";
import UserLayout from "../../components/UserLayout";
import ThemeToggle from "../../components/ThemeToggle";
import { API_BASE_URL } from "../../config/api";

type UserSettingsState = {
  theme: "light" | "dark";
  notifications: boolean;
  emailNotifications: boolean;
  language: string;
};

function UserSettings() {
  const [userSettings, setUserSettings] = useState<UserSettingsState>(() => {
    const defaults: UserSettingsState = {
      theme: "light",
      notifications: true,
      emailNotifications: true,
      language: "en",
    };

    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("userSettings");
        if (stored) {
          const parsed = JSON.parse(stored);
          return {
            ...defaults,
            ...parsed,
          };
        }
      }
    } catch {
      // ignore parse errors
    }

    return defaults;
  });

  const [account, setAccount] = useState({
    username: "",
    email: "",
    authProvider: "local" as "local" | "google",
  });
  const [accountMessage, setAccountMessage] = useState("");
  const [accountSaving, setAccountSaving] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("userSettings", JSON.stringify(userSettings));
      }
    } catch {
      // ignore storage errors
    }
  }, [userSettings]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/profile`, {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        const user = data?.data;
        if (!cancelled && user) {
          const pref = user.emailNotifications;
          if (typeof pref === "boolean") {
            setUserSettings((prev) => ({
              ...prev,
              emailNotifications: pref,
            }));
          }

          setAccount({
            username: user.username || "",
            email: user.email || "",
            authProvider: user.authProvider || "local",
          });
        }
      } catch {
        // ignore errors, fall back to local preference
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSettingChange = <K extends keyof UserSettingsState>(
    setting: K,
    value: UserSettingsState[K]
  ) => {
    setUserSettings((prev: UserSettingsState) => ({
      ...prev,
      [setting]: value,
    }));

    if (setting === "emailNotifications") {
      (async () => {
        try {
          await fetch(`${API_BASE_URL}/profile`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ emailNotifications: value }),
          });
        } catch (err) {
          console.error("Failed to update email notification preference", err);
        }
      })();
    }
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountMessage("");

    if (!account.email || !account.email.includes("@")) {
      setAccountMessage("Please enter a valid email address");
      return;
    }

    if (account.username && account.username.length < 3) {
      setAccountMessage("Username must be at least 3 characters long");
      return;
    }

    setAccountSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username: account.username || undefined,
          email: account.email,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok) {
        setAccountMessage("Account details updated successfully!");
      } else {
        setAccountMessage(result.message || "Error updating account details");
      }
    } catch (error) {
      console.error("Error updating account details:", error);
      setAccountMessage("Error updating account details");
    } finally {
      setAccountSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordMessage("New password must be at least 6 characters long");
      return;
    }

    setPasswordUpdating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/profile/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setPasswordMessage("Password updated successfully!");
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setPasswordMessage(result.message || "Error updating password");
      }
    } catch (error) {
      console.error("Error updating password:", error);
      setPasswordMessage("Error updating password");
    } finally {
      setPasswordUpdating(false);
    }
  };

  return (
    <UserLayout pageTitle="Account Security">
      <div className="settings-container">
        <div className="settings-card">
          <h2>Account Information</h2>
          <p>Manage your login details and basic preferences for your RedBoat account.</p>

          {accountMessage && (
            <div className={`message ${accountMessage.includes('successfully') ? 'success' : 'error'}`}>
              {accountMessage}
            </div>
          )}

          <form onSubmit={handleAccountSubmit} className="account-form">
            <div className="settings-section">
              <div className="settings-row">
                <div className="settings-row-main">
                  <span className="settings-row-title">Email address</span>
                  <span className="settings-row-description">Primary email used for your bookings and notifications.</span>
                </div>
                <div className="settings-row-action">
                  <input
                    id="email"
                    type="email"
                    value={account.email}
                    onChange={(e) => setAccount({ ...account, email: e.target.value })}
                    required
                    style={{ minWidth: 220 }}
                  />
                </div>
              </div>

              <div className="settings-row">
                <div className="settings-row-main">
                  <span className="settings-row-title">Username</span>
                  <span className="settings-row-description">Public name shown on your bookings and feedback.</span>
                </div>
                <div className="settings-row-action">
                  <input
                    id="username"
                    type="text"
                    value={account.username}
                    onChange={(e) => setAccount({ ...account, username: e.target.value })}
                    placeholder="Your username"
                    style={{ minWidth: 180 }}
                  />
                </div>
              </div>
            </div>

            <div className="form-actions" style={{ justifyContent: 'flex-end' }}>
              <button type="submit" className="user-button primary" disabled={accountSaving}>
                {accountSaving ? 'Saving...' : 'Save account details'}
              </button>
            </div>
          </form>

          <div className="settings-section">
            <div className="settings-row">
              <div className="settings-row-main">
                <span className="settings-row-title">Theme</span>
                <span className="settings-row-description">Switch between light and dark appearance.</span>
              </div>
              <div className="settings-row-action">
                <ThemeToggle />
              </div>
            </div>

            <div className="settings-row">
              <div className="settings-row-main">
                <span className="settings-row-title">Email notifications</span>
                <span className="settings-row-description">Receive booking updates and important alerts by email.</span>
              </div>
              <div className="settings-row-action">
                <input
                  type="checkbox"
                  checked={userSettings.emailNotifications}
                  onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                />
              </div>
            </div>

            <div className="settings-row">
              <div className="settings-row-main">
                <span className="settings-row-title">Language</span>
                <span className="settings-row-description">Choose your preferred language for the interface.</span>
              </div>
              <div className="settings-row-action">
                <select
                  value={userSettings.language}
                  onChange={(e) => handleSettingChange('language', e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-card">
          <h2>Security Settings</h2>
          <p>Manage how you protect access to your RedBoat account.</p>

          {passwordMessage && (
            <div className={`message ${passwordMessage.includes('successfully') ? 'success' : 'error'}`}>
              {passwordMessage}
            </div>
          )}

          <div className="settings-section">
            {account.authProvider === 'google' ? (
              <div className="settings-row">
                <div className="settings-row-main">
                  <span className="settings-row-title">Password</span>
                  <span className="settings-row-description">
                    Your account uses Google Sign-In. Password management is handled through your Google account.
                  </span>
                </div>
                <div className="settings-row-action">
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Google Account</span>
                </div>
              </div>
            ) : (
              <>
                <div className="settings-row">
                  <div className="settings-row-main">
                    <span className="settings-row-title">Password</span>
                    <span className="settings-row-description">Set a unique password for better protection.</span>
                  </div>
                  <div className="settings-row-action">
                    <button
                      className="user-button secondary"
                      type="button"
                      onClick={() => setShowPasswordForm((v) => !v)}
                    >
                      {showPasswordForm ? "Close" : "Change password"}
                    </button>
                  </div>
                </div>

                {showPasswordForm && (
                  <div className="settings-row" style={{ borderTop: 'none' }}>
                    <form onSubmit={handlePasswordSubmit} className="password-form" style={{ paddingTop: 0, width: '100%' }}>
                      <div className="form-group">
                        <label htmlFor="currentPassword">Current Password *</label>
                        <input
                          id="currentPassword"
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="newPassword">New Password *</label>
                        <input
                          id="newPassword"
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          required
                          minLength={6}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm New Password *</label>
                        <input
                          id="confirmPassword"
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          required
                          minLength={6}
                        />
                      </div>

                      <div className="form-actions">
                        <button type="submit" className="user-button primary" disabled={passwordUpdating}>
                          {passwordUpdating ? 'Updating...' : 'Update Password'}
                        </button>
                        <button
                          type="button"
                          className="user-button secondary"
                          onClick={() => {
                            setShowPasswordForm(false);
                            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </UserLayout>
  );
}

export default UserSettings;