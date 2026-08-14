import { useEffect, useState } from 'react';
import api, { formatPrice } from '../../api/client';
import type { Payout } from '../../api/types';
import BusyButton from '../../components/BusyButton';
import { FormAlert } from '../../components/FormAlert';

export default function VendorPayouts() {
  const [available, setAvailable] = useState(0);
  const [lifetime, setLifetime] = useState(0);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [details, setDetails] = useState({ payout_bank_name: '', payout_account_name: '', payout_account_number: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [requesting, setRequesting] = useState(false);

  const load = () => api.get('/vendor/payouts').then((r) => {
    setAvailable(r.data.available_balance);
    setLifetime(r.data.lifetime_earnings);
    setDetails(r.data.payout_details || details);
    setPayouts(r.data.payouts?.data || r.data.payouts || []);
  });

  useEffect(() => { load().catch(() => setError('Failed to load payouts')); }, []);

  const request = async () => {
    if (requesting || available <= 0) return;
    setError('');
    setMessage('');
    setRequesting(true);
    try {
      await api.post('/vendor/payouts');
      setMessage('Withdrawal requested. Admin has been notified. After they pay you, you will get an in-app and email notice.');
      load();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Request failed');
    }
    setRequesting(false);
  };

  return (
    <div className="admin-page">
      <h1>Payouts</h1>
      <p className="admin-muted" style={{ marginBottom: 24 }}>
        Available balance is 90% of paid product sales plus shipping, minus amounts already requested.
      </p>
      <div className="admin-stat-grid" style={{ marginBottom: 24 }}>
        <div className="admin-stat-card card">
          <p className="admin-stat-label">Available</p>
          <p className="admin-stat-value">{formatPrice(available)}</p>
        </div>
        <div className="admin-stat-card card">
          <p className="admin-stat-label">Lifetime earnings</p>
          <p className="admin-stat-value">{formatPrice(lifetime)}</p>
        </div>
      </div>
      <p className="help-text" style={{ marginBottom: 12 }}>
        Bank: {details.payout_bank_name || '—'} · {details.payout_account_name || '—'} · {details.payout_account_number || 'Add details in shop settings'}
      </p>
      <FormAlert
        error={error}
        message={message}
        onDismiss={() => { setError(''); setMessage(''); }}
      />
      <BusyButton className="btn btn-primary" type="button" onClick={request} busy={requesting} disabled={available <= 0} busyLabel="Requesting…" style={{ marginBottom: 24 }}>
        {`Request payout of ${formatPrice(available)}`}
      </BusyButton>
      {payouts.length === 0 ? (
        <div className="admin-empty card">No payout requests yet.</div>
      ) : (
        <div className="table-scroll">
          <table className="data-table card">
            <thead>
              <tr><th>Date</th><th>Amount</th><th>Status</th></tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p.id}>
                  <td>{new Date(p.created_at).toLocaleDateString()}</td>
                  <td>{formatPrice(p.amount)}</td>
                  <td>{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
