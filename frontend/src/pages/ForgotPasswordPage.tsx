import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    const verificationCode = Math.floor(100000 + Math.random() * 900000);
    const subject = "Your RedBoat account password reset code";
    const html = `
      <div style="background:#f6f8fb;padding:24px 0;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
          <tr>
            <td style="padding:20px 24px;background:#0ea5e9;color:#ffffff;">
              <h1 style="margin:0;font-size:18px;">WebProj</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <h2 style="margin:0 0 8px;font-size:18px;color:#0f172a;">Password reset code</h2>
              <p style="margin:0 0 16px;color:#334155;">Use the verification code below to reset your password.</p>
              <div style="display:inline-block;padding:12px 20px;border:1px dashed #0ea5e9;border-radius:8px;font-size:24px;letter-spacing:6px;font-weight:700;color:#0ea5e9;">
                ${verificationCode}
              </div>
              <p style="margin:16px 0 0;color:#64748b;font-size:12px;">This code expires in 10 minutes. If you did not request this, you can safely ignore this email.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px;background:#f8fafc;color:#64748b;font-size:12px;text-align:center;">
              © ${new Date().getFullYear()} RedBoat
            </td>
          </tr>
        </table>
      </div>
    `;

    try {
      const response = await fetch("http://localhost:5000/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: email, subject, html }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.message || "Failed to send verification email");
      }

      setMessage("Verification code sent. Redirecting...");
      navigate("/verify-code", { replace: true, state: { email } });
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "40px auto" }}>
      <BackButton />
      <h2>Forgot Password</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
          />
        </div>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send Code"}
        </button>
      </form>
      {message && (
        <p style={{ color: "green", marginTop: 12 }}>{message}</p>
      )}
      {error && <p style={{ color: "crimson", marginTop: 12 }}>{error}</p>}
    </div>
  );
};

export default ForgotPasswordPage;
