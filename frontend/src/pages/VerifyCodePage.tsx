import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton";
import FormInput from "../components/FormInput";

function VerifyCodePage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const email = (location.state as any)?.email as string | undefined;
  const navigate = useNavigate();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !code) return;
    
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Email verified successfully! Your account has been created.");
        navigate("/", { replace: true });
      } else {
        alert(data.message || "Verification failed");
      }
    } catch (err) {
      console.error(err);
      alert("Server error. Please try again.");
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
          <strong>We sent a code to {email}. Enter it below.</strong>
        ) : (
          <strong>Enter the code sent to your email.</strong>
        )}
      </div>
      <h2>Verify Code</h2>
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
