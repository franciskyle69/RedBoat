import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/main.css";

import FormInput from "../components/FormInput";
import GoogleOAuthButton from "../components/GoogleOAuthButton";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // TODO: Save user info or token if using JWT
        setEmail("");
        setPassword("");
        const role = data?.data?.role;
        navigate(role === "admin" ? "/admin" : "/dashboard", { replace: true, state: { user: data.data } });
      } else {
        alert(data.message || "Login failed");
      }
    } catch (err) {
      console.error(err);
      alert("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
        
          <div className="login-brand">
            <div className="login-logo">
              <img src="/redBoat.png" alt="Red Boat Logo" style={{ width: '300px', height: '300px' }} />
            </div>
           
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="auth-form">
          {/* Username/Email Field */}
          <div className="form-group">
            <label className="form-label">
              Username/ email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your username or email"
              className="form-input"
            />
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label className="form-label">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="form-input"
            />
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {/* Separator */}
        <div className="auth-separator">
          Or
        </div>

        {/* Google Button */}
        <GoogleOAuthButton />

        {/* Links */}
        <div className="auth-links">
          <Link to="/signup" className="auth-link">
            Create an account
          </Link>
          <Link to="/forgot-password" className="auth-link">
            Forgot password?
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
