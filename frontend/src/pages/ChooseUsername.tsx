import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User, AtSign, Check, X, Loader2, Sparkles, ArrowRight } from "lucide-react";
import "../styles/main.css";

function ChooseUsername() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Get user data from location state (passed from Google OAuth)
  const userData = location.state?.user;

  // Validation rules
  const validationRules = useMemo(() => ({
    minLength: username.length >= 3,
    validChars: /^[a-zA-Z0-9_]*$/.test(username),
    notEmpty: username.trim().length > 0,
  }), [username]);

  const isValid = validationRules.minLength && validationRules.validChars && validationRules.notEmpty;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!username.trim()) {
      setError("Username is required");
      setLoading(false);
      return;
    }

    if (username.length < 3) {
      setError("Username must be at least 3 characters long");
      setLoading(false);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("Username can only contain letters, numbers, and underscores");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/set-username", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ username: username.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        // Username set successfully, redirect to dashboard
        const role = data?.data?.role || userData?.role;
        const isAdminLike = role === "admin" || role === "superadmin";
        navigate(isAdminLike ? "/admin" : "/dashboard", { 
          replace: true, 
          state: { user: { ...userData, username: username.trim() } } 
        });
      } else {
        if (data.message === "Username already taken") {
          setError("Username is already taken. Please choose another one.");
        } else {
          setError(data.message || "Failed to set username");
        }
      }
    } catch (err) {
      console.error(err);
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative background elements */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(40px)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '10%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(239,68,68,0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: 'rgba(255, 255, 255, 0.98)',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.1)',
        overflow: 'hidden',
        position: 'relative',
        animation: 'fadeInUp 0.5s ease-out',
      }}>
        {/* Top accent bar */}
        <div style={{
          height: '4px',
          background: 'linear-gradient(90deg, #ef4444, #f97316, #ef4444)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 2s linear infinite',
        }} />

        <div style={{ padding: '40px 32px' }}>
          {/* Avatar & Welcome */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #ef4444, #f97316)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 10px 30px -10px rgba(239, 68, 68, 0.5)',
              position: 'relative',
            }}>
              <User size={36} color="white" strokeWidth={1.5} />
              <div style={{
                position: 'absolute',
                bottom: '-4px',
                right: '-4px',
                width: '28px',
                height: '28px',
                background: '#10b981',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '3px solid white',
              }}>
                <Sparkles size={14} color="white" />
              </div>
            </div>
            
            <h1 style={{
              margin: '0 0 8px',
              fontSize: '28px',
              fontWeight: '700',
              color: '#0f172a',
              letterSpacing: '-0.5px',
            }}>
              Welcome, {userData?.firstName || 'there'}!
            </h1>
            <p style={{
              margin: '0',
              color: '#64748b',
              fontSize: '15px',
              lineHeight: '1.5',
            }}>
              Choose a unique username to personalize your experience
            </p>
          </div>

          {/* Username Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Username
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: username ? (isValid ? '#10b981' : '#ef4444') : '#94a3b8',
                  transition: 'color 0.2s ease',
                }}>
                  <AtSign size={20} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError("");
                  }}
                  placeholder="your_username"
                  disabled={loading}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '16px 16px 16px 48px',
                    fontSize: '16px',
                    border: `2px solid ${error ? '#fecaca' : username ? (isValid ? '#86efac' : '#fecaca') : '#e2e8f0'}`,
                    borderRadius: '12px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    background: error ? '#fef2f2' : username ? (isValid ? '#f0fdf4' : '#fef2f2') : '#f8fafc',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    if (!error && !username) {
                      e.target.style.borderColor = '#ef4444';
                      e.target.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
                    }
                  }}
                  onBlur={(e) => {
                    if (!error && !username) {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                />
                {username && (
                  <div style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: isValid ? '#10b981' : '#ef4444',
                  }}>
                    {isValid ? <Check size={20} /> : <X size={20} />}
                  </div>
                )}
              </div>
              
              {error && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#ef4444',
                  fontSize: '13px',
                  marginTop: '8px',
                  padding: '8px 12px',
                  background: '#fef2f2',
                  borderRadius: '8px',
                }}>
                  <X size={14} />
                  {error}
                </div>
              )}
            </div>

            {/* Validation Rules */}
            <div style={{
              background: '#f8fafc',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px',
            }}>
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#64748b',
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Requirements
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { label: 'At least 3 characters', valid: validationRules.minLength },
                  { label: 'Letters, numbers & underscores only', valid: validationRules.validChars },
                  { label: 'Must be unique', valid: null },
                ].map((rule, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '13px',
                    color: rule.valid === null ? '#64748b' : (rule.valid ? '#10b981' : '#94a3b8'),
                    transition: 'color 0.2s ease',
                  }}>
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: rule.valid === null ? '#e2e8f0' : (rule.valid ? '#dcfce7' : '#f1f5f9'),
                      transition: 'background 0.2s ease',
                    }}>
                      {rule.valid === null ? (
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94a3b8' }} />
                      ) : rule.valid ? (
                        <Check size={12} color="#10b981" strokeWidth={3} />
                      ) : (
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#cbd5e1' }} />
                      )}
                    </div>
                    {rule.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isValid}
              style={{
                width: '100%',
                padding: '16px 24px',
                fontSize: '16px',
                fontWeight: '600',
                color: 'white',
                background: loading || !isValid 
                  ? '#cbd5e1' 
                  : 'linear-gradient(135deg, #ef4444, #f97316)',
                border: 'none',
                borderRadius: '12px',
                cursor: loading || !isValid ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.3s ease',
                boxShadow: loading || !isValid 
                  ? 'none' 
                  : '0 10px 30px -10px rgba(239, 68, 68, 0.5)',
                transform: 'translateY(0)',
              }}
              onMouseEnter={(e) => {
                if (!loading && isValid) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 15px 35px -10px rgba(239, 68, 68, 0.6)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = loading || !isValid 
                  ? 'none' 
                  : '0 10px 30px -10px rgba(239, 68, 68, 0.5)';
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                  Setting up your profile...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 32px',
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          textAlign: 'center',
        }}>
          <p style={{
            margin: 0,
            fontSize: '13px',
            color: '#64748b',
          }}>
            You can change your username later in settings
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default ChooseUsername;
