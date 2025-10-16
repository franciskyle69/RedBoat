import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/main.css";

function ChooseUsername() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Get user data from location state (passed from Google OAuth)
  const userData = location.state?.user;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!username.trim()) {
      setError("Username is required");
      setLoading(false);
      return;
    }

    if (username.length < 3) {
      setError("Username must be at least 3 characters long");
      setLoading(false);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("Username can only contain letters, numbers, and underscores");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/set-username", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ username: username.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        // Username set successfully, redirect to dashboard
        const role = data?.data?.role || userData?.role;
        navigate(role === "admin" ? "/admin" : "/dashboard", { 
          replace: true, 
          state: { user: { ...userData, username: username.trim() } } 
        });
      } else {
        if (data.message === "Username already taken") {
          setError("Username is already taken. Please choose another one.");
        } else {
          setError(data.message || "Failed to set username");
        }
      }
    } catch (err) {
      console.error(err);
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="login-welcome-text">
            WELCOME TO
          </div>
          <div className="login-brand">
            <div className="login-logo">
              ⛵
            </div>
            <div className="login-title">
              REDBOAT
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: '0 0 8px', color: '#0f172a' }}>
            Welcome, {userData?.firstName || 'User'}!
          </h2>
          <p style={{ margin: '0', color: '#64748b', fontSize: '14px' }}>
            Please choose a username to complete your account setup
          </p>
        </div>

        {/* Username Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">
              Choose Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="form-input"
              disabled={loading}
              autoFocus
            />
            {error && (
              <div style={{ 
                color: '#ef4444', 
                fontSize: '12px', 
                marginTop: '4px' 
              }}>
                {error}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="btn-primary"
          >
            {loading ? "Setting username..." : "Continue"}
          </button>
        </form>

        {/* Username Rules */}
        <div style={{ 
          marginTop: '16px', 
          padding: '12px', 
          backgroundColor: '#f8fafc', 
          borderRadius: '8px',
          fontSize: '12px',
          color: '#64748b'
        }}>
          <strong>Username rules:</strong>
          <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
            <li>At least 3 characters long</li>
            <li>Only letters, numbers, and underscores</li>
            <li>Must be unique</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ChooseUsername;
