import { createContext, useContext, useMemo, useState, ReactNode, useCallback, useEffect } from "react";
import { API_BASE_URL } from "../config/api";

const API = API_BASE_URL;

export type NotificationType = "success" | "error" | "info" | "warning";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  message: string;
  durationMs?: number;
  href?: string;
  isRead?: boolean;
}

interface NotificationContextValue {
  notify: (message: string, type?: NotificationType, durationMs?: number, href?: string) => void;
  remove: (id: string) => void;
  removePersisted: (id: string) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  items: NotificationItem[];
  history: NotificationItem[];
  unread: number;
  markAllRead: () => void;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  loadingMore: boolean;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return ctx;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [history, setHistory] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [isAuthed, setIsAuthed] = useState<boolean>(false);

  const remove = useCallback((id: string) => {
    setItems(prev => prev.filter(n => n.id !== id));
  }, []);

  const notify = useCallback((message: string, type: NotificationType = "info", durationMs = 3500, href?: string) => {
    // Always show local toast immediately
    const id = Math.random().toString(36).slice(2);
    const item: NotificationItem = { id, type, message, durationMs, href };
    setItems(prev => [...prev, item]);
    // Do NOT push into persisted history immediately to avoid duplicates; SSE/poll will add the server version
    setUnread(prev => prev + 1);
    if (durationMs && durationMs > 0) {
      setTimeout(() => remove(id), durationMs);
    }
    // Persist to backend if authenticated
    (async () => {
      if (!isAuthed) return;
      try {
        await fetch(`${API}/notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ type, message, href })
        });
      } catch {}
    })();
  }, [remove, isAuthed]);

  const markAllRead = useCallback(async () => {
    if (!isAuthed) return;
    try {
      await fetch(`${API}/notifications/mark-all-read`, {
        method: 'POST',
        credentials: 'include'
      });
      // Update local history state to set isRead
      setHistory(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {}
    setUnread(0);
  }, [isAuthed]);

  const markRead = useCallback(async (id: string) => {
    if (!isAuthed) return;
    try {
      await fetch(`${API}/notifications/${id}/read`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch {}
    setHistory(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
  }, [isAuthed]);

  const removePersisted = useCallback(async (id: string) => {
    if (!isAuthed) return;
    try {
      await fetch(`${API}/notifications/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
    } catch {}
    setHistory(prev => prev.filter(n => n.id !== id));
  }, [isAuthed]);

  // Load more (pagination)
  const loadMore = useCallback(async () => {
    if (!isAuthed || loadingMore || !hasMore || history.length === 0) return;
    setLoadingMore(true);
    try {
      const lastId = history[history.length - 1]?.id;
      const res = await fetch(`${API}/notifications?lastId=${encodeURIComponent(lastId)}&limit=20`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const list: NotificationItem[] = (data.data || []).map((n: any) => ({ id: n._id, type: n.type, message: n.message, href: n.href, isRead: !!n.isRead }));
        setHistory(prev => [...prev, ...list].slice(0, 500));
        setHasMore(!!data.hasMore);
      }
    } catch {}
    setLoadingMore(false);
  }, [isAuthed, loadingMore, hasMore, history]);

  const value = useMemo(() => ({ items, notify, remove, removePersisted, markRead, history, unread, markAllRead, loadMore, hasMore, loadingMore }), [items, notify, remove, removePersisted, markRead, history, unread, markAllRead, hasMore, loadingMore]);

  // Auth watcher: check /me once on mount and listen for auth events
  useEffect(() => {
    let cancelled = false;
    
    const checkAuth = async () => {
      try {
        const res = await fetch(`${API}/me`, { credentials: 'include' });
        if (!cancelled) {
          if (res.ok) {
            setIsAuthed(true);
          } else {
            setIsAuthed(false);
            setHistory([]);
            setItems([]);
            setUnread(0);
            setHasMore(false);
          }
        }
      } catch {
        if (!cancelled) {
          setIsAuthed(false);
          setHistory([]);
          setItems([]);
          setUnread(0);
          setHasMore(false);
        }
      }
    };
    
    // Check auth once on mount
    checkAuth();
    
    // Listen for custom auth events (dispatched on login/logout)
    const handleAuthChange = (e: CustomEvent) => {
      if (e.detail?.authenticated) {
        setIsAuthed(true);
      } else {
        setIsAuthed(false);
        setHistory([]);
        setItems([]);
        setUnread(0);
        setHasMore(false);
      }
    };
    
    window.addEventListener('auth-change', handleAuthChange as EventListener);
    
    return () => { 
      cancelled = true; 
      window.removeEventListener('auth-change', handleAuthChange as EventListener);
    };
  }, []);

  // Fetch persisted notifications periodically when authed
  useEffect(() => {
    if (!isAuthed) return;
    let cancelled = false;
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${API}/notifications?limit=20`, { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const list: NotificationItem[] = (data.data || []).map((n: any) => ({ id: n._id, type: n.type, message: n.message, href: n.href, isRead: !!n.isRead }));
        setHistory(list);
        const unreadCount = (data.data || []).filter((n: any) => !n.isRead).length;
        setUnread(unreadCount);
        setHasMore(!!data.hasMore);
      } catch {}
    };
    fetchNotifications();
    const id = setInterval(fetchNotifications, 20000);
    return () => { cancelled = true; clearInterval(id); };
  }, [isAuthed]);

  // Real-time updates via SSE when authed
  useEffect(() => {
    if (!isAuthed) return;
    let es: EventSource | undefined;
    let attempt = 0;
    let timer: any;

    const connect = () => {
      try {
        es = new EventSource(`${API}/notifications/stream`, { withCredentials: true } as any);
        es.onmessage = (ev) => {
          try {
            const n = JSON.parse(ev.data);
            const item: NotificationItem = { id: n._id, type: n.type, message: n.message, href: n.href, isRead: !!n.isRead };
            setHistory(prev => [item, ...prev].slice(0, 500));
            if (!item.isRead) setUnread(prev => prev + 1);
          } catch {}
        };
        es.onerror = () => {
          try { es && es.close(); } catch {}
          const delay = Math.min(30000, 1000 * Math.pow(2, attempt));
          attempt += 1;
          timer = setTimeout(connect, delay);
        };
        es.onopen = () => { attempt = 0; };
      } catch {
        const delay = Math.min(30000, 1000 * Math.pow(2, attempt));
        attempt += 1;
        timer = setTimeout(connect, delay);
      }
    };

    connect();
    return () => { try { es && es.close(); } catch {}; if (timer) clearTimeout(timer); };
  }, [isAuthed]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}


