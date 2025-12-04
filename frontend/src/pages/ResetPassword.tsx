import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/auth.css";
import { API_BASE_URL } from "../config/api";
import { Check, X, Eye, EyeOff } from "lucide-react";
import { validatePassword } from "../utils/passwordValidation";

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const email = (location.state as any)?.email as string | undefined;
  const code = (location.state as any)?.code as string | undefined;

  // Redirect if missing required state
  useEffect(() => {
    if (!email || !code) {
      navigate("/forgot-password", { replace: true });
    }
  }, [email, code, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError("Please ensure your password meets all requirements");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!email || !code) {
      setError("Missing email or verification code. Please start the reset process again.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword: password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Failed to update password");
      }

      setMessage("Password updated. Redirecting to login...");
      setTimeout(() => navigate("/", { replace: true }), 1000);
    } catch (err: any) {
      setError(err?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="logo-wrapper">
          <h2 className="brand-name">Set New Password</h2>
        </div>

        {email && (
          <div className="success-message">
            Resetting password for {email}
          </div>
        )}

        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>New Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your new password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            {/* Password Requirements */}
            {password.length > 0 && (
              <div className="password-requirements">
                <div className="password-strength-bar">
                  <div 
                    className={`password-strength-fill strength-${validatePassword(password).strength}`}
                  />
                </div>
                <p className="password-strength-text">
                  Strength: <span className={`strength-${validatePassword(password).strength}`}>
                    {validatePassword(password).strength}
                  </span>
                </p>
                <ul className="requirements-list">
                  <li className={password.length >= 8 ? "met" : ""}>
                    {password.length >= 8 ? <Check size={14} /> : <X size={14} />}
                    At least 8 characters
                  </li>
                  <li className={/[A-Z]/.test(password) ? "met" : ""}>
                    {/[A-Z]/.test(password) ? <Check size={14} /> : <X size={14} />}
                    1 uppercase letter (A-Z)
                  </li>
                  <li className={/[a-z]/.test(password) ? "met" : ""}>
                    {/[a-z]/.test(password) ? <Check size={14} /> : <X size={14} />}
                    1 lowercase letter (a-z)
                  </li>
                  <li className={/[0-9]/.test(password) ? "met" : ""}>
                    {/[0-9]/.test(password) ? <Check size={14} /> : <X size={14} />}
                    1 number (0-9)
                  </li>
                  <li className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? "met" : ""}>
                    {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? <Check size={14} /> : <X size={14} />}
                    1 special character (!@#$%^&*)
                  </li>
                </ul>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Confirm New Password</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {confirmPassword.length > 0 && (
              <p className={`password-match ${password === confirmPassword ? "match" : "no-match"}`}>
                {password === confirmPassword ? (
                  <><Check size={14} /> Passwords match</>
                ) : (
                  <><X size={14} /> Passwords do not match</>
                )}
              </p>
            )}
          </div>

          <button type="submit" className="btn-primary" disabled={loading || !validatePassword(password).isValid || password !== confirmPassword}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;

