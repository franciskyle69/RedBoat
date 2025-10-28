import { useEffect, useRef, useState } from "react";
import { useNotifications } from "../contexts/NotificationContext";

export default function NotificationBell() {
  const { unread, history, markAllRead } = useNotifications();
  const navigate = (window as any).appNavigate as ((path: string) => void) | undefined;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  useEffect(() => {
    if (open) markAllRead();
  }, [open, markAllRead]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          position: 'relative',
          background: 'none',
          border: '1px solid #e5e7eb',
          borderRadius: 6,
          padding: '6px 10px',
          cursor: 'pointer'
        }}
      >
        🔔
        {unread > 0 && (
          <span style={{
            position: 'absolute',
            top: -6,
            right: -6,
            background: '#ef4444',
            color: 'white',
            borderRadius: 999,
            fontSize: 10,
            padding: '2px 6px',
            minWidth: 18,
            textAlign: 'center'
          }}>{unread}</span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: '120%',
          width: 320,
          maxHeight: 420,
          overflowY: 'auto',
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          zIndex: 9999
        }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', fontWeight: 600 }}>Notifications</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {history.length === 0 ? (
              <div style={{ padding: 12, color: '#6b7280' }}>No notifications yet</div>
            ) : (
              history.map(item => (
                <div key={item.id} style={{ padding: '10px 12px', borderBottom: '1px solid #f9fafb', fontSize: 14, cursor: item.href ? 'pointer' : 'default' }}
                  onClick={() => { if (item.href && navigate) navigate(item.href); }}>
                  <span style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    marginRight: 8,
                    background: item.type === 'success' ? '#10b981' : item.type === 'error' ? '#ef4444' : item.type === 'warning' ? '#f59e0b' : '#6b7280'
                  }} />
                  {item.message}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}


