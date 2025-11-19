// src/pages/User/Settings.tsx
import { useEffect, useState } from "react";
import "../../styles/main.css";
import UserLayout from "../../components/UserLayout";
import ThemeToggle from "../../components/ThemeToggle";
import Swal from "sweetalert2";

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

  const [deleteMessage, setDeleteMessage] = useState("");
  const [deletePending, setDeletePending] = useState(false);

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
        const res = await fetch("http://localhost:5000/profile", {
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
          await fetch("http://localhost:5000/profile", {
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
      const response = await fetch("http://localhost:5000/profile", {
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
      const response = await fetch("http://localhost:5000/profile/password", {
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

  const handleDeleteAccount = async () => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Delete your account?",
      text: "This will permanently delete your account and data. This action cannot be undone.",
      showCancelButton: true,
      confirmButtonText: "Yes, delete account",
      cancelButtonText: "Cancel",
      focusCancel: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    setDeleteMessage("");
    setDeletePending(true);
    try {
      const response = await fetch("http://localhost:5000/profile", {
        method: "DELETE",
        credentials: "include",
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok) {
        setDeleteMessage("Account deleted. Redirecting to login...");
        try {
          if (typeof window !== "undefined") {
            localStorage.removeItem("userSettings");
          }
        } catch {
          // ignore storage errors
        }

        await Swal.fire({
          icon: "success",
          title: "Account deleted",
          text: "Your account has been deleted. You will be redirected to login.",
        });

        window.location.href = "/login";
      } else {
        setDeleteMessage(result.message || "Failed to delete account");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      setDeleteMessage("Failed to delete account");
    } finally {
      setDeletePending(false);
    }
  };

  return (
    <UserLayout pageTitle="My Settings">
      <div className="settings-container">
        <div className="settings-card">
          <h2>Account Settings</h2>
          <p>Manage your login details and basic preferences for your RedBoat account.</p>

          {accountMessage && (
            <div className={`message ${accountMessage.includes('successfully') ? 'success' : 'error'}`}>
              {accountMessage}
            </div>
          )}

          <form onSubmit={handleAccountSubmit} className="account-form">
            <div className="setting-item">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={account.username}
                onChange={(e) => setAccount({ ...account, username: e.target.value })}
                placeholder="Your username"
              />
            </div>

            <div className="setting-item">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={account.email}
                onChange={(e) => setAccount({ ...account, email: e.target.value })}
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="user-button primary" disabled={accountSaving}>
                {accountSaving ? 'Saving...' : 'Save account details'}
              </button>
            </div>
          </form>

          <div className="setting-item">
            <label>Theme</label>
            <ThemeToggle />
          </div>

          <div className="setting-item">
            <label>Email Notifications</label>
            <input
              type="checkbox"
              checked={userSettings.emailNotifications}
              onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
            />
          </div>

          <div className="setting-item">
            <label>Language</label>
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

        <div className="settings-card">
          <h2>Security</h2>
          <p>Update your password to help keep your account secure.</p>

          {passwordMessage && (
            <div className={`message ${passwordMessage.includes('successfully') ? 'success' : 'error'}`}>
              {passwordMessage}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="password-form">
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <input
                id="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
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
              <label htmlFor="confirmPassword">Confirm New Password</label>
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
            </div>
          </form>
        </div>

        <div className="settings-card danger">
          <h2>Danger zone</h2>
          {deleteMessage && (
            <div className={`message ${deleteMessage.toLowerCase().includes('deleted') ? 'success' : 'error'}`}>
              {deleteMessage}
            </div>
          )}

          <p>
            Deleting your account will permanently remove your profile and associated data from RedBoat. This action cannot
            be undone.
          </p>
          <button
            type="button"
            className="user-button secondary"
            onClick={handleDeleteAccount}
            disabled={deletePending}
          >
            {deletePending ? 'Deleting account...' : 'Delete account'}
          </button>
        </div>
      </div>
    </UserLayout>
  );
}

export default UserSettings;