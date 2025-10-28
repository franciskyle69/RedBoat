import { createContext, useContext, useMemo, useState, ReactNode, useCallback, useEffect } from "react";

export type NotificationType = "success" | "error" | "info" | "warning";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  message: string;
  durationMs?: number;
  href?: string;
}

interface NotificationContextValue {
  notify: (message: string, type?: NotificationType, durationMs?: number, href?: string) => void;
  remove: (id: string) => void;
  items: NotificationItem[];
  history: NotificationItem[];
  unread: number;
  markAllRead: () => void;
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

  const remove = useCallback((id: string) => {
    setItems(prev => prev.filter(n => n.id !== id));
  }, []);

  const notify = useCallback((message: string, type: NotificationType = "info", durationMs = 3500, href?: string) => {
    const id = Math.random().toString(36).slice(2);
    const item: NotificationItem = { id, type, message, durationMs, href };
    setItems(prev => [...prev, item]);
    setHistory(prev => [{ ...item, durationMs: undefined }, ...prev].slice(0, 100));
    setUnread(prev => prev + 1);
    if (durationMs && durationMs > 0) {
      setTimeout(() => remove(id), durationMs);
    }
  }, [remove]);

  const markAllRead = useCallback(() => setUnread(0), []);

  const value = useMemo(() => ({ items, notify, remove, history, unread, markAllRead }), [items, notify, remove, history, unread, markAllRead]);

  // Fetch persisted notifications periodically
  useEffect(() => {
    let cancelled = false;
    const fetchNotifications = async () => {
      try {
        const res = await fetch('http://localhost:5000/notifications', { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const list: NotificationItem[] = (data.data || []).map((n: any) => ({ id: n._id, type: n.type, message: n.message, href: n.href }));
        setHistory(list);
        const unreadCount = (data.data || []).filter((n: any) => !n.isRead).length;
        setUnread(unreadCount);
      } catch {}
    };
    fetchNotifications();
    const id = setInterval(fetchNotifications, 20000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}


