import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/auth.css";
import Swal from "sweetalert2";
import GoogleOAuthButton from "../components/GoogleOAuthButton";
import ReCaptcha, { useReCaptcha } from "../components/ReCaptcha";
import { getSiteKey } from "../config/recaptcha";
import { API_BASE_URL } from "../config/api";
import { Check, X, Eye, EyeOff } from "lucide-react";
import { validatePassword } from "../utils/passwordValidation";

function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
  
  // reCAPTCHA hook
  const { token, isVerified, handleVerify, handleExpire, handleError, reset } = useReCaptcha();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Password",
        text: "Please ensure your password meets all requirements.",
      });
      return;
    }

    // Check passwords match
    if (password !== confirmPassword) {
      Swal.fire({
        icon: "warning",
        title: "Passwords don't match",
        text: "Please make sure both passwords are the same.",
      });
      return;
    }

    // Check reCAPTCHA verification
    if (!isVerified) {
      Swal.fire({
        icon: "warning",
        title: "reCAPTCHA required",
        text: "Please complete the reCAPTCHA verification before signing up.",
      });
      return;
    }
    
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/signup`, {
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
          recaptchaToken: token,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Reset form and redirect to verify page
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setUsername("");
        setFirstName("");
        setLastName("");
        setPhoneNumber("");
        setDateOfBirth("");
        setAddress({ street: "", city: "", state: "", zipCode: "", country: "" });
        reset(); // Reset reCAPTCHA
        navigate("/verify-code", { replace: true, state: { email } });
      } else {
        Swal.fire({
          icon: "error",
          title: "Signup failed",
          text: data.message || "Signup failed",
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
      <div className="auth-card" style={{ maxWidth: "450px" }}>
        <div className="logo-wrapper">
          <h2 className="brand-name">REDBOAT</h2>
        </div>

        <form onSubmit={handleSignup} className="auth-form">
          <div className="name-fields">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter your first name"
                required
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter your last name"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
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
            <label>Confirm Password</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
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

          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter your phone number"
            />
          </div>

          <div className="form-group">
            <label>Date of Birth</label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Address</label>
            <input
              type="text"
              value={address.street}
              onChange={(e) => setAddress({...address, street: e.target.value})}
              placeholder="Street Address"
            />
          </div>

          <div className="address-fields">
            <div className="form-group">
              <input
                type="text"
                value={address.city}
                onChange={(e) => setAddress({...address, city: e.target.value})}
                placeholder="City"
              />
            </div>
            <div className="form-group">
              <input
                type="text"
                value={address.state}
                onChange={(e) => setAddress({...address, state: e.target.value})}
                placeholder="State"
              />
            </div>
          </div>

          <div className="address-fields">
            <div className="form-group">
              <input
                type="text"
                value={address.zipCode}
                onChange={(e) => setAddress({...address, zipCode: e.target.value})}
                placeholder="ZIP Code"
              />
            </div>
            <div className="form-group">
              <input
                type="text"
                value={address.country}
                onChange={(e) => setAddress({...address, country: e.target.value})}
                placeholder="Country"
              />
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

          <button
            type="submit"
            className="btn-primary"
            disabled={loading || !isVerified}
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>

          <div className="divider">
            <span>or</span>
          </div>

          <GoogleOAuthButton />

          <p className="auth-links">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default SignupPage;
