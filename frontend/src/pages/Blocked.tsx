import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import { useNotifications } from '../contexts/NotificationContext';

export default function Blocked() {
  const { notify } = useNotifications();

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/logout`, { method: 'POST', credentials: 'include' });
    } catch {}
    notify('You have been signed out.', 'info');
    window.location.assign('/');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 560,
        background: 'white',
        borderRadius: 12,
        boxShadow: '0 10px 30px rgba(2, 6, 23, 0.08)',
        padding: 24,
        textAlign: 'center'
      }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fee2e2',
          color: '#b91c1c',
          fontWeight: 800,
          marginBottom: 12
        }}>!
        </div>
        <h2 style={{ margin: '0 0 8px 0' }}>Account blocked</h2>
        <p style={{ color: '#64748b', margin: 0 }}>
          Your account has been restricted. If you believe this is a mistake, please contact support.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
          <button onClick={handleLogout} className="btn-outline">
            Sign out
          </button>
          <Link to="/contact" className="btn-primary">
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
