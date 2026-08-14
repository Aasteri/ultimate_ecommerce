import { useEffect, useState } from 'react';
import api, { formatPrice } from '../../api/client';

interface ReferralRow {
  id: number;
  name: string;
  email: string;
  referral_first_order_id: number | null;
  created_at: string;
  referred_by?: { id: number; name: string; email: string; referral_code: string };
}

export default function AdminReferrals() {
  const [total, setTotal] = useState(0);
  const [converted, setConverted] = useState(0);
  const [credits, setCredits] = useState(0);
  const [pending, setPending] = useState(0);
  const [rows, setRows] = useState<ReferralRow[]>([]);

  useEffect(() => {
    api.get('/admin/referrals').then((r) => {
      setTotal(r.data.total_referrals);
      setConverted(r.data.converted);
      setCredits(r.data.credits_paid);
      setPending(r.data.pending_wallet_payouts);
      setRows(r.data.referrals?.data || []);
    });
  }, []);

  return (
    <div className="admin-page">
      <h1>Referrals</h1>
      <p className="admin-muted" style={{ marginBottom: 24 }}>
        Referrers automatically receive 10% of a referred user’s first product purchase, taken from platform commission.
      </p>
      <div className="admin-stat-grid" style={{ marginBottom: 24 }}>
        <div className="admin-stat-card card"><p className="admin-stat-label">Referred users</p><p className="admin-stat-value">{total}</p></div>
        <div className="admin-stat-card card"><p className="admin-stat-label">First purchases</p><p className="admin-stat-value">{converted}</p></div>
        <div className="admin-stat-card card"><p className="admin-stat-label">Credits paid</p><p className="admin-stat-value">{formatPrice(credits)}</p></div>
        <div className="admin-stat-card card"><p className="admin-stat-label">Pending payouts</p><p className="admin-stat-value">{pending}</p></div>
      </div>
      {rows.length === 0 ? (
        <div className="admin-empty card">No referrals yet.</div>
      ) : (
        <div className="table-scroll">
<table className="data-table card">
          <thead>
            <tr><th>Referred user</th><th>Referred by</th><th>First purchase</th><th>Joined</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.name}<br /><span className="help-text">{r.email}</span></td>
                <td>{r.referred_by?.name}<br /><span className="help-text">{r.referred_by?.referral_code}</span></td>
                <td>{r.referral_first_order_id ? 'Yes' : 'Not yet'}</td>
                <td>{new Date(r.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
</div>
      )}
    </div>
  );
}
