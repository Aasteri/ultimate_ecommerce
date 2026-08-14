import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { formatPrice } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

interface Overview {
  referral_code: string;
  referral_percent: number;
  wallet_balance: number;
  referrals_count: number;
  converted_count: number;
  lifetime_credits: number;
  shop_available: number;
  shop_lifetime: number;
}

interface Notice {
  id: number;
  title: string;
  body?: string;
  link?: string;
  read_at?: string | null;
  created_at: string;
}

export default function AccountOverview() {
  const { user } = useAuth();
  const [data, setData] = useState<Overview | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get('/referrals').then((r) => setData(r.data));
    api.get('/notifications').then((r) => setNotices(r.data.notifications || []));
  }, []);

  if (!data) return <p className="admin-muted">Loading…</p>;

  const link = `${window.location.origin}/register?ref=${data.referral_code}`;

  return (
    <div className="admin-page">
      <h1>Your account</h1>
      <p className="admin-muted" style={{ marginBottom: 24 }}>Invite friends with your short code. Earnings are calculated automatically.</p>

      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <label className="label">Your invite code</label>
        <p style={{ fontSize: 28, fontWeight: 700, letterSpacing: 4, margin: '8px 0' }}>{data.referral_code}</p>
        <div className="form-toolbar">
          <input className="input" readOnly value={link} />
          <button type="button" className="btn btn-primary" onClick={async () => { await navigator.clipboard.writeText(link); setCopied(true); }}>
            {copied ? 'Copied' : 'Copy link'}
          </button>
        </div>
        <p className="help-text" style={{ marginTop: 8 }}>You earn {data.referral_percent}% of a referred user’s first purchase.</p>
      </div>

      <div className="admin-stat-grid" style={{ marginBottom: 24 }}>
        <div className="admin-stat-card card">
          <p className="admin-stat-label">Referral wallet</p>
          <p className="admin-stat-value">{formatPrice(data.wallet_balance)}</p>
          <p className="admin-stat-sub">{formatPrice(data.lifetime_credits)} lifetime</p>
        </div>
        <div className="admin-stat-card card">
          <p className="admin-stat-label">People invited</p>
          <p className="admin-stat-value">{data.referrals_count}</p>
          <p className="admin-stat-sub">{data.converted_count} first purchases</p>
        </div>
        {user?.shop && (
          <div className="admin-stat-card card">
            <p className="admin-stat-label">Shop balance</p>
            <p className="admin-stat-value">{formatPrice(data.shop_available)}</p>
            <p className="admin-stat-sub">{formatPrice(data.shop_lifetime)} lifetime</p>
          </div>
        )}
      </div>

      <div className="overview-actions">
        <Link to="/account/earnings" className="btn btn-primary">View earnings & withdraw</Link>
        {user?.shop?.status !== 'approved' && (
          <Link to="/sell" className="btn btn-outline">Become a vendor</Link>
        )}
      </div>

      <h2 style={{ marginBottom: 12 }}>Notifications</h2>
      {notices.length === 0 ? (
        <div className="admin-empty card">No notifications yet.</div>
      ) : (
        notices.slice(0, 8).map((n) => (
          <div key={n.id} className="card" style={{ padding: 12, marginBottom: 8, opacity: n.read_at ? 0.7 : 1 }}>
            <strong>{n.title}</strong>
            {n.body && <p className="help-text">{n.body}</p>}
          </div>
        ))
      )}
    </div>
  );
}
