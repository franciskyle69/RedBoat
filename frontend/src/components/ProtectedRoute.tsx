import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config/api";

type MeResponse = { data?: { username: string; email: string; role?: string } };

export function AdminRoute() {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [role, setRole] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/me`, {
          credentials: "include",
        });
        if (!cancelled) {
          setAuthed(res.ok);
          if (res.ok) {
            const body: MeResponse = await res.json();
            setRole(body?.data?.role);
          }
        }
      } catch {
        if (!cancelled) setAuthed(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  if (!authed) return <Navigate to="/" replace />;
  if (role !== "admin") return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

function ProtectedRoute() {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [role, setRole] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/me`, {
          credentials: "include",
        });
        if (!cancelled) {
          setAuthed(res.ok);
          if (res.ok) {
            const body: MeResponse = await res.json();
            setRole(body?.data?.role);
          }
        }
      } catch {
        if (!cancelled) setAuthed(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  if (!authed) return <Navigate to="/" replace />;
  return <Outlet />;
}

export default ProtectedRoute;

