import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton";
import FormInput from "../components/FormInput";
import GoogleOAuthButton from "../components/GoogleOAuthButton";

function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: ""
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username || email.split("@")[0], // fallback username
          email,
          password,
          firstName,
          lastName,
          phoneNumber: phoneNumber || undefined,
          dateOfBirth: dateOfBirth || undefined,
          address: Object.values(address).some(val => val) ? address : undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Reset form and redirect to verify page
        setEmail("");
        setPassword("");
        setUsername("");
        setFirstName("");
        setLastName("");
        setPhoneNumber("");
        setDateOfBirth("");
        setAddress({ street: "", city: "", state: "", zipCode: "", country: "" });
        navigate("/verify-code", { replace: true, state: { email } });
      } else {
        alert(data.message || "Signup failed");
      }
    } catch (err) {
      console.error(err);
      alert("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "500px", margin: "50px auto", padding: "0 20px" }}>
      <BackButton />
      <h2>Sign Up</h2>
      <form onSubmit={handleSignup}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
          <FormInput
            label="First Name *"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <FormInput
            label="Last Name *"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
        
        <FormInput
          label="Username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        
        <FormInput
          label="Email *"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        
        <FormInput
          label="Password *"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        
        <FormInput
          label="Phone Number"
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />
        
        <FormInput
          label="Date of Birth"
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
        />
        
        <div style={{ marginTop: "20px", marginBottom: "10px" }}>
          <h3 style={{ margin: "0 0 10px 0", fontSize: "16px", color: "#374151" }}>Address (Optional)</h3>
          <FormInput
            label="Street Address"
            type="text"
            value={address.street}
            onChange={(e) => setAddress({...address, street: e.target.value})}
          />
          
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "10px", marginTop: "10px" }}>
            <FormInput
              label="City"
              type="text"
              value={address.city}
              onChange={(e) => setAddress({...address, city: e.target.value})}
            />
            <FormInput
              label="State"
              type="text"
              value={address.state}
              onChange={(e) => setAddress({...address, state: e.target.value})}
            />
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "10px" }}>
            <FormInput
              label="ZIP Code"
              type="text"
              value={address.zipCode}
              onChange={(e) => setAddress({...address, zipCode: e.target.value})}
            />
            <FormInput
              label="Country"
              type="text"
              value={address.country}
              onChange={(e) => setAddress({...address, country: e.target.value})}
            />
          </div>
        </div>
        
        <button
          type="submit"
          style={{ width: "100%", padding: "12px", marginTop: "20px", fontSize: "16px" }}
          disabled={loading}
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>
      </form>

      {/* Separator */}
      <div style={{ textAlign: "center", margin: "20px 0", color: "#666" }}>
        Or
      </div>

      {/* Google Button */}
      <GoogleOAuthButton />

      <div style={{ marginTop: "15px", textAlign: "center" }}>
        <Link to="/">Already have an account?</Link>
      </div>
    </div>
  );
}

export default SignupPage;
