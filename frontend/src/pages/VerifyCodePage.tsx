import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/auth.css";
import Swal from "sweetalert2";

function VerifyCodePage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const email = (location.state as any)?.email as string | undefined;
  const isPasswordReset = (location.state as any)?.isPasswordReset as boolean | undefined;
  const navigate = useNavigate();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !code) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let endpoint, successMessage, redirectPath;
      
      if (isPasswordReset) {
        // For password reset, verify the code first
        const verifyResponse = await fetch("http://localhost:5000/verify-reset-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code }),
        });

        if (!verifyResponse.ok) {
          const data = await verifyResponse.json().catch(() => ({}));
          throw new Error(data?.message || "Invalid reset code");
        }

        // Code is valid, redirect to reset password page
        navigate("/reset-password", { replace: true, state: { email, code } });
        return;
      } else {
        // For email verification (signup)
        endpoint = "http://localhost:5000/verify-email";
        successMessage = "Email verified successfully! Your account has been created.";
        redirectPath = "/";
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (res.ok) {
        await Swal.fire({
          icon: "success",
          title: "Verified",
          text: successMessage,
        });
        navigate(redirectPath, { replace: true });
      } else {
        throw new Error(data.message || "Verification failed");
      }
    } catch (err: any) {
      setError(err?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="logo-wrapper">
          <h2 className="brand-name">Verify Reset Code</h2>
        </div>

        {email && (
          <div className="success-message">
            {isPasswordReset 
              ? `We sent a password reset code to ${email}. Enter it below.`
              : `We sent a verification code to ${email}. Enter it below.`
            }
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleVerify} className="auth-form">
          <div className="form-group">
            <label>Verification Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter the code"
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading}
          >
            {loading ? "Verifying..." : "Verify Code"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default VerifyCodePage;
