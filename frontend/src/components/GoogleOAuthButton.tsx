import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../config/api";
import { dispatchLogin } from "../utils/authEvents";

interface GoogleOAuthButtonProps {
  onSuccess?: (user: any) => void;
  onError?: (error: string) => void;
}

export default function GoogleOAuthButton({ onSuccess, onError }: GoogleOAuthButtonProps) {
  const navigate = useNavigate();
  const googleDivRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const googleObj = (window as any).google;
    
    if (!googleObj || !clientId) {
      console.warn("Google OAuth not configured. Please set VITE_GOOGLE_CLIENT_ID in your environment variables.");
      return;
    }

    const initializeGoogleAuth = () => {
      try {
        googleObj.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: any) => {
            try {
              const res = await fetch(`${API_BASE_URL}/google-login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ idToken: response.credential }),
              });
              
              const data = await res.json();
              
              if (!res.ok) {
                throw new Error(data?.message || "Google login failed");
              }

              // Dispatch auth event to notify other components
              dispatchLogin();

              // Call custom success handler if provided
              if (onSuccess) {
                onSuccess(data.data);
              } else {
                // Force a complete page reload to ensure cookie is properly set
                // Using location.replace ensures the browser picks up the new cookie
                const targetUrl = !data.data.username 
                  ? "/choose-username"
                  : (data?.data?.role === "admin" || data?.data?.role === "superadmin") 
                    ? "/admin" 
                    : "/dashboard";
                
                // Use replace to avoid back button issues, with cache-busting
                window.location.replace(targetUrl + "?t=" + Date.now());
              }
            } catch (err: any) {
              const errorMessage = err?.message || "Google login failed";
              console.error("Google OAuth error:", errorMessage);
              
              if (onError) {
                onError(errorMessage);
              } else {
                console.error("Google OAuth error:", errorMessage);
                Swal.fire({
                  icon: "error",
                  title: "Google login failed",
                  text: errorMessage,
                });
              }
            }
          },
        });

        // Wait for the DOM element to be available
        const renderButton = () => {
          if (googleDivRef.current) {
            googleObj.accounts.id.renderButton(googleDivRef.current, {
              theme: "outline",
              size: "large",
              width: 360,
              text: "continue_with",
            });
          } else {
            // Retry after a short delay if element is not ready
            setTimeout(renderButton, 100);
          }
        };

        renderButton();
      } catch (e) {
        console.error("Failed to initialize Google OAuth:", e);
      }
    };

    // Initialize immediately if Google is already loaded, otherwise wait
    if (googleObj.accounts && googleObj.accounts.id) {
      initializeGoogleAuth();
    } else {
      // Wait for Google script to fully load
      const checkGoogle = setInterval(() => {
        if ((window as any).google && (window as any).google.accounts && (window as any).google.accounts.id) {
          clearInterval(checkGoogle);
          initializeGoogleAuth();
        }
      }, 100);
    }
  }, [navigate, onSuccess, onError]);

  return <div ref={googleDivRef} className="google-btn-container"></div>;
}
