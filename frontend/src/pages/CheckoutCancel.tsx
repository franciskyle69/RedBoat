import { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import UserLayout from '../components/UserLayout';
import { useNotifications } from '../contexts/NotificationContext';

export default function CheckoutCancel() {
  const [params] = useSearchParams();
  const { notify } = useNotifications();

  useEffect(() => {
    const bookingId = params.get('bookingId');
    if (bookingId) {
      notify('Payment was canceled. You can try again anytime from your booking.', 'warning');
    }
  }, [params, notify]);

  return (
    <UserLayout pageTitle="Payment Canceled">
      <div className="user-content">
        <div className="card">
          <h3>Payment canceled</h3>
          <p>Your payment was canceled. Your booking remains pending until payment is completed.</p>
          <div style={{ marginTop: 16 }}>
            <Link to="/user/bookings" className="btn-outline">Back to My Bookings</Link>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
