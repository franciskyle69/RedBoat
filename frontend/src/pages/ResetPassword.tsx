import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton";
import FormInput from "../components/FormInput";

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters");
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
      const res = await fetch("http://localhost:5000/reset-password", {
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
    <div style={{ maxWidth: 420, margin: "40px auto" }}>
      <BackButton />
      <div style={{
        background: "#eff6ff",
        border: "1px solid #bfdbfe",
        color: "#1e3a8a",
        padding: "10px 12px",
        borderRadius: 8,
        marginBottom: 12
      }}>
        {email ? (
          <strong>Resetting password for {email}</strong>
        ) : (
          <strong>Set your new password</strong>
        )}
      </div>
      <h2>Set New Password</h2>
      <form onSubmit={handleSubmit}>
        <FormInput
          label="New Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <FormInput
          label="Confirm New Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <button type="submit" disabled={loading} style={{ width: "100%", padding: 10 }}>
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
      {message && <p style={{ color: "green", marginTop: 12 }}>{message}</p>}
      {error && <p style={{ color: "crimson", marginTop: 12 }}>{error}</p>}
    </div>
  );
}

export default ResetPassword;

