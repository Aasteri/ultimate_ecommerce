import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function CheckoutCallback() {
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'cancelled'>('loading');
  const [message, setMessage] = useState('Verifying payment...');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const txId = params.get('transaction_id') || params.get('id') || params.get('charge_id');
    const reference = params.get('tx_ref') || params.get('reference');
    const paymentStatus = (params.get('status') || '').toLowerCase();

    if (paymentStatus === 'cancelled' || paymentStatus === 'canceled') {
      setStatus('cancelled');
      setMessage('Payment was cancelled.');
      return;
    }

    if (paymentStatus === 'simulated') {
      refreshUser();
      setStatus('success');
      setMessage('Test payment completed successfully.');
      return;
    }

    if (
      paymentStatus &&
      !['successful', 'succeeded', 'completed', 'success'].includes(paymentStatus) &&
      !txId &&
      !reference
    ) {
      setStatus('failed');
      setMessage('Payment was not completed.');
      return;
    }

    if (!txId && !reference) {
      setStatus('failed');
      setMessage('Payment reference not found. If you completed payment, check your orders or contact support.');
      return;
    }

    const body = txId
      ? { transaction_id: txId }
      : { reference: reference as string };

    api.post('/checkout/verify', body)
      .then(async () => {
        await refreshUser();
        setStatus('success');
        setMessage('Payment verified successfully.');
      })
      .catch(() => {
        setStatus('failed');
        setMessage('Payment verification failed. If you were charged, contact support with your order number.');
      });
  }, [refreshUser]);

  if (status === 'loading') {
    return (
      <div className="container status-shell">
        <p>{message}</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="container status-shell">
        <h2 className="auth-title">Payment successful!</h2>
        <p className="auth-subtitle">{message}</p>
        <Link to="/downloads" className="btn btn-primary">View downloads</Link>
      </div>
    );
  }

  return (
    <div className="container status-shell">
      <h2 className="auth-title">{status === 'cancelled' ? 'Payment cancelled' : 'Payment issue'}</h2>
      <p className="auth-subtitle">{message}</p>
      <Link to="/cart" className="btn btn-outline">Back to cart</Link>
    </div>
  );
}
