import { useEffect, useState } from 'react';
import api, { formatPrice } from '../../api/client';
import BusyButton from '../../components/BusyButton';
import { FormAlert } from '../../components/FormAlert';
import { useAuth } from '../../context/AuthContext';

interface ReferralData {
  referral_code: string;
  referral_percent: number;
  wallet_balance: number;
  referrals_count: number;
  converted_count: number;
  lifetime_credits: number;
  shop_available: number;
  shop_lifetime: number;
  transactions: Array<{ id: number; type: string; amount: number; description?: string; created_at: string }>;
  payouts: Array<{ id: number; amount: number; status: string; created_at: string }>;
}

export default function AccountEarnings() {
  const { user, refreshUser } = useAuth();
  const [data, setData] = useState<ReferralData | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [requesting, setRequesting] = useState(false);

  const load = () => api.get('/referrals').then((r) => setData(r.data));
  useEffect(() => { load().catch(() => setError('Could not load earnings')); }, []);

  if (!data) return <p className="admin-muted">{error || 'Loading…'}</p>;

  const requestPayout = async () => {
    if (requesting || data.wallet_balance <= 0) return;
    setError('');
    setMessage('');
    setRequesting(true);
    try {
      await api.post('/referrals/payouts');
      setMessage('Withdrawal requested. Admin will pay it, then you will be notified.');
      await load();
      await refreshUser();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Payout failed');
    }
    setRequesting(false);
  };

  return (
    <div className="admin-page">
      <h1>Earnings</h1>
      <p className="admin-muted" style={{ marginBottom: 24 }}>
        Invite code <strong>{data.referral_code}</strong> · {data.referral_percent}% of a referred user’s first purchase is credited automatically.
      </p>
      <div className="admin-stat-grid" style={{ marginBottom: 24 }}>
        <div className="admin-stat-card card">
          <p className="admin-stat-label">Referral wallet</p>
          <p className="admin-stat-value">{formatPrice(data.wallet_balance)}</p>
        </div>
        <div className="admin-stat-card card">
          <p className="admin-stat-label">Lifetime referral credits</p>
          <p className="admin-stat-value">{formatPrice(data.lifetime_credits)}</p>
        </div>
        {user?.shop && (
          <div className="admin-stat-card card">
            <p className="admin-stat-label">Shop available</p>
            <p className="admin-stat-value">{formatPrice(data.shop_available)}</p>
            <p className="admin-stat-sub">{formatPrice(data.shop_lifetime)} lifetime · withdraw from Vendor → Payouts</p>
          </div>
        )}
      </div>
      <FormAlert
        error={error}
        message={message}
        onDismiss={() => { setError(''); setMessage(''); }}
      />
      <BusyButton className="btn btn-primary" type="button" onClick={requestPayout} busy={requesting} disabled={data.wallet_balance <= 0} busyLabel="Requesting…" style={{ marginBottom: 24 }}>
        Request referral withdrawal
      </BusyButton>
      <h3 style={{ marginBottom: 12 }}>Activity</h3>
      {data.transactions.length === 0 ? (
        <p className="help-text">No referral credits yet. Share your invite code to start earning.</p>
      ) : (
        <div className="table-scroll">
          <table className="data-table card">
            <thead>
              <tr><th>Date</th><th>Type</th><th>Amount</th><th>Note</th></tr>
            </thead>
            <tbody>
              {data.transactions.map((t) => (
                <tr key={t.id}>
                  <td>{new Date(t.created_at).toLocaleDateString()}</td>
                  <td>{t.type.replace('_', ' ')}</td>
                  <td>{formatPrice(t.amount)}</td>
                  <td>{t.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
