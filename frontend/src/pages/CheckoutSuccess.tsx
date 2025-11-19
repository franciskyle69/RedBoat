import { useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import UserLayout from '../components/UserLayout';
import { useNotifications } from '../contexts/NotificationContext';

export default function CheckoutSuccess() {
  const [params] = useSearchParams();
  const { notify } = useNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    const sessionId = params.get('session_id');
    const run = async () => {
      if (!sessionId) return;
      try {
        const res = await fetch(`http://localhost:5000/payments/confirm?session_id=${encodeURIComponent(sessionId)}`, {
          credentials: 'include',
        });
        if (res.ok) {
          notify('Payment confirmed. Booking marked as paid.', 'success');
          // Optionally redirect to bookings after a short delay
          setTimeout(() => navigate('/user/bookings'), 600);
        } else {
          const err = await res.json().catch(() => ({} as any));
          notify(err.message || 'Payment confirmed on Stripe, but booking update is pending.', 'warning');
        }
      } catch (e) {
        notify('Payment confirmed on Stripe, but server confirmation failed.', 'warning');
      }
    };
    run();
  }, [params, notify, navigate]);

  return (
    <UserLayout pageTitle="Payment Successful">
      <div className="user-content">
        <div className="card">
          <h3>Thank you!</h3>
          <p>Your payment was successful. You can view your booking details below.</p>
          <div style={{ marginTop: 16 }}>
            <Link to="/user/bookings" className="btn-primary">Go to My Bookings</Link>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
