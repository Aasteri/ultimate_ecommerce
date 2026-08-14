import { useEffect, useState } from 'react';
import api, { formatPrice } from '../../api/client';
import type { Shop } from '../../api/types';
import BusyButton from '../../components/BusyButton';
import { FormAlert } from '../../components/FormAlert';
import { IntegerInput, MoneyInput, PercentInput } from '../../components/FormFields';
import { parseAmount, parseInteger, validateInteger, validateMoney, validatePercent } from '../../lib/validation';

function CommissionCell({ shop, onSave }: { shop: Shop; onSave: (id: number, rate: string) => void }) {
  const [value, setValue] = useState(shop.commission_rate != null ? String(shop.commission_rate) : '');
  return (
    <PercentInput
      value={value}
      placeholder="10"
      style={{ maxWidth: 80 }}
      onChange={setValue}
      onBlur={() => onSave(shop.id, value)}
    />
  );
}

export default function AdminShops() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [approvedShops, setApprovedShops] = useState<Shop[]>([]);
  const [filter, setFilter] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [shopId, setShopId] = useState('');
  const [amount, setAmount] = useState('250000');
  const [days, setDays] = useState('90');
  const [seeding, setSeeding] = useState(false);

  const load = () => api.get('/admin/shops', { params: { ...(filter ? { status: filter } : {}), per_page: 100 } }).then((r) => {
    setShops(r.data.data || r.data);
  });

  const loadApproved = () => api.get('/admin/shops', { params: { status: 'approved', per_page: 100 } }).then((r) => {
    setApprovedShops(r.data.data || r.data);
  });

  useEffect(() => { load().catch(() => setError('Failed to load shops')); }, [filter]);
  useEffect(() => { loadApproved().catch(() => {}); }, []);

  const update = async (id: number, status: string) => {
    setError('');
    try {
      await api.put(`/admin/shops/${id}`, { status, rejection_reason: status === 'rejected' ? reason : null });
      setReason('');
      load();
    } catch {
      setError('Update failed');
    }
  };

  const setCommission = async (id: number, rate: string) => {
    if (rate === '') {
      await api.put(`/admin/shops/${id}`, { commission_rate: null });
      load();
      return;
    }
    if (validatePercent(rate, 'Commission')) {
      setError('Commission must be a number between 0 and 100.');
      return;
    }
    await api.put(`/admin/shops/${id}`, { commission_rate: parseAmount(rate) });
    load();
  };

  const seedActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) {
      setError('Select a vendor shop first.');
      return;
    }
    const amountError = validateMoney(amount, 'Sales amount', { min: 1000, max: 50_000_000 });
    const daysError = validateInteger(days, 'Days', { min: 14, max: 365 });
    if (amountError || daysError) {
      setError(amountError || daysError || '');
      return;
    }
    setError('');
    setMessage('');
    setSeeding(true);
    try {
      const { data } = await api.post(`/admin/shops/${shopId}/seed-activity`, {
        amount: parseAmount(amount),
        days: parseInteger(days) ?? 90,
      });
      setMessage(
        `${data.message}: ${data.orders} orders, ${data.customers} customers, ${formatPrice(data.sales_total)} sales, ${formatPrice(data.vendor_earnings)} vendor earnings, ${formatPrice(data.available_balance)} available.`
      );
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(msg || 'Could not generate activity');
    }
    setSeeding(false);
  };

  const approved = approvedShops.length ? approvedShops : shops.filter((s) => s.status === 'approved');

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Shops</h1>
          <p className="admin-muted">Approve vendors before they can sell. Default commission is 10%.</p>
        </div>
        <select className="input" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>
      <FormAlert
        error={error}
        message={message}
        onDismiss={() => { setError(''); setMessage(''); }}
      />

      <form onSubmit={seedActivity} className="card admin-form-card" style={{ marginBottom: 24 }}>
        <h3>Seed vendor activity</h3>
        <p className="help-text" style={{ marginTop: 0, marginBottom: 16 }}>
          Creates realistic Nigerian customers, paid orders, earnings and some payout history for a vendor who needs a live-looking account. The shop must already have published products.
        </p>
        <div className="admin-form-grid">
          <div>
            <label className="label">Vendor shop</label>
            <select className="input" value={shopId} onChange={(e) => setShopId(e.target.value)} required>
              <option value="">Select shop</option>
              {approved.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.user?.name})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Sales amount (₦)</label>
            <MoneyInput required value={amount} onChange={setAmount} />
          </div>
          <div>
            <label className="label">Spread over (days)</label>
            <IntegerInput value={days} onChange={setDays} />
          </div>
        </div>
        <BusyButton className="btn btn-primary" type="submit" style={{ marginTop: 16 }} busy={seeding} busyLabel="Generating…">
          Generate activity
        </BusyButton>
      </form>

      <div style={{ marginBottom: 16 }}>
        <label className="label">Rejection reason (used when rejecting)</label>
        <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} />
      </div>
      {shops.length === 0 ? (
        <div className="admin-empty card">No shops yet.</div>
      ) : (
        <div className="table-scroll">
<table className="data-table card">
          <thead>
            <tr><th>Shop</th><th>Owner</th><th>Status</th><th>Commission %</th><th></th></tr>
          </thead>
          <tbody>
            {shops.map((s) => (
              <tr key={s.id}>
                <td>
                  <strong>{s.name}</strong>
                  <p className="help-text">/{s.slug} · {s.products_count ?? 0} products</p>
                </td>
                <td>{s.user?.name}<br /><span className="help-text">{s.user?.email}</span></td>
                <td>{s.status}</td>
                <td>
                  <CommissionCell shop={s} onSave={setCommission} />
                </td>
                <td className="admin-actions-cell">
                  {s.status !== 'approved' && <button type="button" className="btn btn-primary" onClick={() => update(s.id, 'approved')}>Approve</button>}
                  {s.status === 'pending' && <button type="button" className="btn btn-outline" onClick={() => update(s.id, 'rejected')}>Reject</button>}
                  {s.status === 'approved' && <button type="button" className="btn btn-outline" onClick={() => update(s.id, 'suspended')}>Suspend</button>}
                  {s.status === 'approved' && (
                    <button type="button" className="btn btn-ghost" onClick={() => setShopId(String(s.id))}>Use for seed</button>
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
