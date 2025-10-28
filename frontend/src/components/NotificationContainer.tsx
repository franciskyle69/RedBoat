import { useNotifications } from "../contexts/NotificationContext";
import { useNavigate } from "react-router-dom";

export default function NotificationContainer() {
  const { items, remove } = useNotifications();
  const navigate = useNavigate();

  return (
    <div style={{
      position: 'fixed',
      top: 16,
      right: 16,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      {items.map((n) => (
        <div
          key={n.id}
          style={{
            minWidth: 260,
            maxWidth: 380,
            padding: '10px 12px',
            borderRadius: 8,
            color: '#1f2937',
            background: n.type === 'success' ? '#d1fae5' : n.type === 'error' ? '#fee2e2' : n.type === 'warning' ? '#fef3c7' : '#e5e7eb',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}
          onClick={() => {
            if (n.href) navigate(n.href);
            remove(n.id);
          }}
        >
          {n.message}
        </div>
      ))}
    </div>
  );
}


