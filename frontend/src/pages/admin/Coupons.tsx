import { useEffect, useState } from 'react';
import api, { formatPrice } from '../../api/client';
import { FieldError, IntegerInput, MoneyInput, PercentInput } from '../../components/FormFields';
import BusyButton from '../../components/BusyButton';
import { FormAlert } from '../../components/FormAlert';
import {
  apiErrorMessage,
  compactErrors,
  firstError,
  parseAmount,
  parseInteger,
  required,
  sanitizeCouponCode,
  validateInteger,
  validateMoney,
  validatePercent,
} from '../../lib/validation';

interface Coupon {
  id: number;
  code: string;
  type: string;
  value: number;
  min_subtotal: number;
  max_uses?: number | null;
  used_count: number;
  max_uses_per_user: number;
  expires_at?: string | null;
  is_active: boolean;
  description?: string | null;
}

const empty = {
  code: '',
  type: 'percent',
  value: '10',
  min_subtotal: '0',
  max_uses: '',
  max_uses_per_user: '1',
  expires_at: '',
  is_active: true,
  description: '',
};

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/admin/coupons').then((r) => setCoupons(r.data.data || r.data));
  useEffect(() => { load().catch(() => setError('Failed to load coupons')); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    const errors = compactErrors({
      code: required(form.code, 'Code') || (form.code.length < 3 ? 'Code must be at least 3 characters.' : null),
      value: form.type === 'percent'
        ? validatePercent(form.value, 'Percent off')
        : validateMoney(form.value, 'Discount amount'),
      min_subtotal: form.min_subtotal ? validateMoney(form.min_subtotal, 'Min subtotal', { min: 0 }) : null,
      max_uses: form.max_uses ? validateInteger(form.max_uses, 'Max uses', { min: 1, max: 100000 }) : null,
      max_uses_per_user: validateInteger(form.max_uses_per_user, 'Max per user', { min: 1, max: 100 }),
    });
    setFieldErrors(errors);
    const summary = firstError(errors);
    if (summary) {
      setError(summary);
      return;
    }
    setSaving(true);
    try {
      await api.post('/admin/coupons', {
        ...form,
        value: parseAmount(form.value),
        min_subtotal: parseAmount(form.min_subtotal) ?? 0,
        max_uses: form.max_uses ? parseInteger(form.max_uses) : null,
        max_uses_per_user: parseInteger(form.max_uses_per_user) ?? 1,
        expires_at: form.expires_at || null,
      });
      setForm(empty);
      setFieldErrors({});
      setMessage('Coupon created.');
      load();
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Could not save coupon'));
    }
    setSaving(false);
  };

  const toggle = async (c: Coupon) => {
    await api.put(`/admin/coupons/${c.id}`, { is_active: !c.is_active });
    load();
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this coupon?')) return;
    await api.delete(`/admin/coupons/${id}`);
    load();
  };

  return (
    <div className="admin-page">
      <h1>Coupons</h1>
      <p className="admin-muted" style={{ marginBottom: 24 }}>Discounts are applied automatically at checkout. Commission is calculated on the discounted product total.</p>
      <FormAlert
        error={error}
        message={message}
        onDismiss={() => { setError(''); setMessage(''); }}
      />
      <form onSubmit={save} className="card admin-form-card" style={{ marginBottom: 32 }}>
        <h3>New coupon</h3>
        <div className="admin-form-grid">
          <div>
            <label className="label">Code</label>
            <input
              className={`input${fieldErrors.code ? ' is-invalid' : ''}`}
              value={form.code}
              maxLength={32}
              onChange={(e) => setForm({ ...form, code: sanitizeCouponCode(e.target.value) })}
              required
            />
            <FieldError message={fieldErrors.code} />
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="percent">Percent off</option>
              <option value="fixed">Fixed amount</option>
            </select>
          </div>
          <div>
            <label className="label">{form.type === 'percent' ? 'Percent off' : 'Amount (₦)'}</label>
            {form.type === 'percent'
              ? <PercentInput required value={form.value} error={fieldErrors.value} onChange={(value) => setForm({ ...form, value })} />
              : <MoneyInput required value={form.value} error={fieldErrors.value} onChange={(value) => setForm({ ...form, value })} />}
          </div>
          <div>
            <label className="label">Min subtotal (₦)</label>
            <MoneyInput value={form.min_subtotal} error={fieldErrors.min_subtotal} onChange={(min_subtotal) => setForm({ ...form, min_subtotal })} />
          </div>
          <div>
            <label className="label">Max uses (blank = unlimited)</label>
            <IntegerInput value={form.max_uses} error={fieldErrors.max_uses} onChange={(max_uses) => setForm({ ...form, max_uses })} />
          </div>
          <div>
            <label className="label">Max per user</label>
            <IntegerInput value={form.max_uses_per_user} error={fieldErrors.max_uses_per_user} onChange={(max_uses_per_user) => setForm({ ...form, max_uses_per_user })} />
          </div>
          <div><label className="label">Expires</label><input className="input" type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} /></div>
          <div><label className="label">Description</label><input className="input" maxLength={255} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        </div>
        <BusyButton className="btn btn-primary" type="submit" style={{ marginTop: 16 }} busy={saving} busyLabel="Creating…">
          Create coupon
        </BusyButton>
      </form>
      {coupons.length === 0 ? (
        <div className="admin-empty card">No coupons yet.</div>
      ) : (
        <div className="table-scroll">
<table className="data-table card">
          <thead>
            <tr><th>Code</th><th>Discount</th><th>Used</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id}>
                <td><strong>{c.code}</strong><br /><span className="help-text">{c.description}</span></td>
                <td>{c.type === 'percent' ? `${c.value}%` : formatPrice(c.value)}</td>
                <td>{c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ''}</td>
                <td>{c.is_active ? 'active' : 'off'}</td>
                <td className="admin-actions-cell">
                  <button type="button" className="btn btn-ghost" onClick={() => toggle(c)}>{c.is_active ? 'Disable' : 'Enable'}</button>
                  <button type="button" className="btn btn-ghost" onClick={() => remove(c.id)}>Delete</button>
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
