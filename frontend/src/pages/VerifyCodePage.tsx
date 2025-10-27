import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton";
import FormInput from "../components/FormInput";

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
        alert(successMessage);
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
    <div style={{ maxWidth: "400px", margin: "50px auto" }}>
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
          <strong>
            {isPasswordReset 
              ? `We sent a password reset code to ${email}. Enter it below.`
              : `We sent a verification code to ${email}. Enter it below.`
            }
          </strong>
        ) : (
          <strong>Enter the code sent to your email.</strong>
        )}
      </div>
      <h2>{isPasswordReset ? "Verify Reset Code" : "Verify Code"}</h2>
      {error && (
        <div style={{
          background: "#fef2f2",
          border: "1px solid #fecaca",
          color: "#dc2626",
          padding: "10px 12px",
          borderRadius: 8,
          marginBottom: 12
        }}>
          {error}
        </div>
      )}
      <form onSubmit={handleVerify}>
        <FormInput
          label="Verification Code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button 
          type="submit" 
          style={{ width: "100%", padding: "10px" }}
          disabled={loading}
        >
          {loading ? "Verifying..." : "Verify Code"}
        </button>
      </form>
    </div>
  );
}

export default VerifyCodePage;
