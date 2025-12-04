import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import "../styles/auth.css";

import Swal from "sweetalert2";

import GoogleOAuthButton from "../components/GoogleOAuthButton";
import ReCaptcha, { useReCaptcha } from "../components/ReCaptcha";
import { getSiteKey } from "../config/recaptcha";
import { API_BASE_URL } from "../config/api";
import { dispatchLogin } from "../utils/authEvents";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  // reCAPTCHA hook
  const { token, isVerified, handleVerify, handleExpire, handleError, reset } = useReCaptcha();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check reCAPTCHA verification
    if (!isVerified) {
      Swal.fire({
        icon: "warning",
        title: "reCAPTCHA required",
        text: "Please complete the reCAPTCHA verification before signing in.",
      });
      return;
    }
    
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ 
          email, 
          password,
          recaptchaToken: token 
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Dispatch auth event to notify other components
        dispatchLogin();
        setEmail("");
        setPassword("");
        reset(); // Reset reCAPTCHA
        const role = data?.data?.role;
        const isAdminLike = role === "admin" || role === "superadmin";
        navigate(isAdminLike ? "/admin" : "/dashboard", { replace: true, state: { user: data.data } });
      } else {
        Swal.fire({
          icon: "error",
          title: "Login failed",
          text: data.message || "Login failed",
        });
        reset(); // Reset reCAPTCHA on failure
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Server error",
        text: "Something went wrong. Please try again.",
      });
      reset(); // Reset reCAPTCHA on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="logo-wrapper">
          <h2 className="brand-name">REDBOAT</h2>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="auth-form">
          {/* Username/Email Field */}
          <div className="form-group">
            <label>Username/Email</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your username or email"
              required
            />
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label>Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* reCAPTCHA */}
          <div className="recaptcha-container">
            <ReCaptcha
              siteKey={getSiteKey()}
              onVerify={handleVerify}
              onExpire={handleExpire}
              onError={handleError}
              theme="light"
              size="normal"
            />
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading || !isVerified}
            className="btn-primary"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Separator */}
        <div className="divider">
          <span>or</span>
        </div>

        {/* Google Button */}
        <GoogleOAuthButton />

        {/* Links */}
        <div className="auth-links">
          <Link to="/signup">Create an account</Link> • <Link to="/forgot-password">Forgot password?</Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
