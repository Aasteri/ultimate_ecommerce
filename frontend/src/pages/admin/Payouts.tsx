import { useEffect, useState } from 'react';
import api, { formatPrice } from '../../api/client';
import type { Payout } from '../../api/types';
import BusyButton from '../../components/BusyButton';
import { FormAlert } from '../../components/FormAlert';

interface WalletPayout {
  id: number;
  amount: number;
  status: string;
  notes?: string | null;
  created_at: string;
  user?: { id: number; name: string; email: string };
}

export default function AdminPayouts() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [wallet, setWallet] = useState<WalletPayout[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const load = () => Promise.all([
    api.get('/admin/payouts'),
    api.get('/admin/wallet-payouts'),
  ]).then(([a, b]) => {
    setPayouts(a.data.data || a.data);
    setWallet(b.data.data || b.data);
  });

  useEffect(() => { load().catch(() => setError('Failed to load payouts')); }, []);

  const updateVendor = async (id: number, status: string) => {
    const key = `v-${id}-${status}`;
    if (busyKey) return;
    setBusyKey(key);
    setError('');
    setMessage('');
    try {
      await api.put(`/admin/payouts/${id}`, { status });
      setMessage(status === 'paid' ? 'Vendor payout marked as paid.' : `Vendor payout marked as ${status}.`);
      await load();
    } catch {
      setError('Could not update payout');
    }
    setBusyKey(null);
  };

  const updateWallet = async (id: number, status: string) => {
    const key = `w-${id}-${status}`;
    if (busyKey) return;
    setBusyKey(key);
    setError('');
    setMessage('');
    try {
      await api.put(`/admin/wallet-payouts/${id}`, { status });
      setMessage(status === 'paid' ? 'Wallet payout marked as paid.' : `Wallet payout marked as ${status}.`);
      await load();
    } catch {
      setError('Could not update payout');
    }
    setBusyKey(null);
  };

  return (
    <div className="admin-page">
      <h1>Payouts</h1>
      <p className="admin-muted" style={{ marginBottom: 24 }}>
        After you transfer the money yourself, click <strong>Payment made</strong>. The vendor or user is notified in the app and by email.
      </p>
      <FormAlert
        error={error}
        message={message}
        onDismiss={() => { setError(''); setMessage(''); }}
      />

      <h2 style={{ marginBottom: 12 }}>Vendor payouts</h2>
      {payouts.length === 0 ? (
        <div className="admin-empty card" style={{ marginBottom: 32 }}>No vendor payouts.</div>
      ) : (
        <div className="table-scroll">
          <table className="data-table card" style={{ marginBottom: 32 }}>
            <thead>
              <tr><th>Shop</th><th>Amount</th><th>Status</th><th>Date</th><th></th></tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p.id}>
                  <td>{p.shop?.name}<br /><span className="help-text">{p.shop?.user?.email}</span></td>
                  <td>{formatPrice(p.amount)}</td>
                  <td>{p.status}</td>
                  <td>{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="admin-actions-cell">
                    {p.status !== 'paid' && (
                      <BusyButton type="button" className="btn btn-primary" busy={busyKey === `v-${p.id}-paid`} busyLabel="Saving…" onClick={() => updateVendor(p.id, 'paid')}>
                        Payment made
                      </BusyButton>
                    )}
                    {p.status === 'pending' && (
                      <BusyButton type="button" className="btn btn-outline" busy={busyKey === `v-${p.id}-rejected`} busyLabel="Saving…" onClick={() => updateVendor(p.id, 'rejected')}>
                        Reject
                      </BusyButton>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 style={{ marginBottom: 12 }}>Referral wallet payouts</h2>
      {wallet.length === 0 ? (
        <div className="admin-empty card">No referral payouts.</div>
      ) : (
        <div className="table-scroll">
          <table className="data-table card">
            <thead>
              <tr><th>User</th><th>Amount</th><th>Status</th><th>Date</th><th></th></tr>
            </thead>
            <tbody>
              {wallet.map((p) => (
                <tr key={p.id}>
                  <td>{p.user?.name}<br /><span className="help-text">{p.user?.email}</span></td>
                  <td>{formatPrice(p.amount)}</td>
                  <td>{p.status}</td>
                  <td>{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="admin-actions-cell">
                    {p.status !== 'paid' && (
                      <BusyButton type="button" className="btn btn-primary" busy={busyKey === `w-${p.id}-paid`} busyLabel="Saving…" onClick={() => updateWallet(p.id, 'paid')}>
                        Payment made
                      </BusyButton>
                    )}
                    {p.status === 'pending' && (
                      <BusyButton type="button" className="btn btn-outline" busy={busyKey === `w-${p.id}-rejected`} busyLabel="Saving…" onClick={() => updateWallet(p.id, 'rejected')}>
                        Reject
                      </BusyButton>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
