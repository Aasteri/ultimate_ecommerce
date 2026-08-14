import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import BusyButton from '../components/BusyButton';

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [email, setEmail] = useState('');
  const [knownEmail, setKnownEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.get(`/newsletter/unsubscribe/${token}`)
      .then((r) => {
        setKnownEmail(r.data.email || '');
        setEmail(r.data.email || '');
        if (r.data.is_active === false) {
          setMessage('This email is already unsubscribed.');
        }
      })
      .catch(() => setError('This unsubscribe link is invalid.'));
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const { data } = await api.post('/newsletter/unsubscribe', {
        token: token || undefined,
        email: email || undefined,
      });
      setMessage(data.message);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Could not unsubscribe');
    }
    setBusy(false);
  };

  return (
    <div className="container auth-shell">
      <h1 className="auth-title">Unsubscribe</h1>
      <p className="auth-subtitle">
        Stop receiving marketing and newsletter emails from The Tailors Market.
      </p>
      <form onSubmit={submit} className="card">
        <div style={{ marginBottom: 16 }}>
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required={!token}
            disabled={!!knownEmail}
          />
        </div>
        {error && <p className="error-msg">{error}</p>}
        {message && <p className="success-msg">{message}</p>}
        {!message && (
          <BusyButton className="btn btn-primary" type="submit" busy={busy} busyLabel="Working…" style={{ width: '100%' }}>
            Unsubscribe
          </BusyButton>
        )}
      </form>
    </div>
  );
}
