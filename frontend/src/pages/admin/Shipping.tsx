import { useEffect, useState } from 'react';
import api, { formatPrice } from '../../api/client';
import { FieldError, IntegerInput, MoneyInput } from '../../components/FormFields';
import BusyButton from '../../components/BusyButton';
import { FormAlert } from '../../components/FormAlert';
import { apiErrorMessage, compactErrors, firstError, parseAmount, parseInteger, validateInteger, validateMoney, validateTitle } from '../../lib/validation';

interface ShippingRateRow {
  id: number;
  type: 'lagos_area' | 'state';
  code: string;
  name: string;
  base_rate: number | string;
  is_active: boolean;
  sort_order: number;
}

const emptyForm = {
  type: 'state' as 'lagos_area' | 'state',
  name: '',
  code: '',
  base_rate: '',
  is_active: true,
  sort_order: '0',
};

export default function AdminShipping() {
  const [rates, setRates] = useState<ShippingRateRow[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [meta, setMeta] = useState({ extra_block_size: 15, extra_block_fee: 1000, store_location: '' });

  const load = async () => {
    const [listRes, tableRes] = await Promise.all([
      api.get('/admin/shipping-rates/list'),
      api.get('/admin/shipping-rates'),
    ]);
    setRates(listRes.data);
    setMeta({
      extra_block_size: tableRes.data.extra_block_size,
      extra_block_fee: tableRes.data.extra_block_fee,
      store_location: tableRes.data.store_location,
    });
  };

  useEffect(() => {
    load().catch(() => setError('Failed to load shipping rates'));
  }, []);

  const reset = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setFieldErrors({});
  };

  const closeForm = () => {
    reset();
    setError('');
    setMessage('');
  };

  const startEdit = (r: ShippingRateRow) => {
    setEditingId(r.id);
    setShowForm(true);
    setForm({
      type: r.type,
      name: r.name,
      code: r.code,
      base_rate: String(r.base_rate),
      is_active: r.is_active,
      sort_order: String(r.sort_order ?? 0),
    });
    setMessage('');
    setError('');
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    const errors = compactErrors({
      name: validateTitle(form.name, 'Name'),
      base_rate: validateMoney(form.base_rate, 'Base rate', { min: 0 }),
      sort_order: form.sort_order ? validateInteger(form.sort_order, 'Sort order', { min: 0, max: 9999 }) : null,
    });
    setFieldErrors(errors);
    const summary = firstError(errors);
    if (summary) {
      setError(summary);
      return;
    }
    setSaving(true);
    const payload = {
      type: form.type,
      name: form.name.trim(),
      code: form.code || undefined,
      base_rate: parseAmount(form.base_rate),
      is_active: form.is_active,
      sort_order: parseInteger(form.sort_order) ?? 0,
    };
    try {
      if (editingId) {
        await api.put(`/admin/shipping-rates/${editingId}`, payload);
        setMessage('Rate updated.');
      } else {
        await api.post('/admin/shipping-rates', payload);
        setMessage('Rate created.');
      }
      reset();
      await load();
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Failed to save rate'));
    }
    setSaving(false);
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this shipping rate?')) return;
    await api.delete(`/admin/shipping-rates/${id}`);
    if (editingId === id) reset();
    await load();
  };

  const toggleActive = async (r: ShippingRateRow) => {
    await api.put(`/admin/shipping-rates/${r.id}`, { is_active: !r.is_active });
    await load();
  };

  const lagos = rates.filter((r) => r.type === 'lagos_area');
  const states = rates.filter((r) => r.type === 'state');

  const RateTable = ({ rows, title }: { rows: ShippingRateRow[]; title: string }) => (
    <>
      <h2 style={{ fontSize: 18, margin: '28px 0 12px' }}>{title}</h2>
      {rows.length === 0 ? (
        <div className="admin-empty card">No rates yet.</div>
      ) : (
        <div className="table-scroll">
          <table className="data-table card">
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>Base (1–{meta.extra_block_size} pcs)</th>
                <th>Active</th>
                <th>Sort</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.name}</strong></td>
                  <td>{r.code}</td>
                  <td>{formatPrice(r.base_rate)}</td>
                  <td>
                    <button type="button" className="btn btn-ghost" onClick={() => toggleActive(r)}>
                      {r.is_active ? 'Yes' : 'No'}
                    </button>
                  </td>
                  <td>{r.sort_order}</td>
                  <td className="admin-actions-cell">
                    <button type="button" className="btn btn-ghost" onClick={() => startEdit(r)}>Edit</button>
                    <button type="button" className="btn btn-ghost" onClick={() => remove(r.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Shipping rates</h1>
          <p className="admin-muted">{meta.store_location || 'Nigeria piece-based shipping'}</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            if (showForm) closeForm();
            else {
              setShowForm(true);
              setError('');
              setMessage('');
            }
          }}
        >
          {showForm ? 'Cancel' : 'Add rate'}
        </button>
      </div>

      <FormAlert
        error={error}
        message={message}
        onDismiss={() => { setError(''); setMessage(''); }}
      />

      <div className="card admin-form-card">
        <h3>Quantity rule</h3>
        <p className="admin-muted">
          Base rate covers 1–{meta.extra_block_size} pieces. Each extra block of {meta.extra_block_size} pieces
          (or part thereof) adds {formatPrice(meta.extra_block_fee)}.
        </p>
        <p className="admin-muted" style={{ marginTop: 8 }}>
          International orders: product payment allowed, shipping discussed with sales, admin notified via Messages.
        </p>
      </div>

      {showForm && (
        <form onSubmit={save} className="card admin-form-card">
          <h3>{editingId ? 'Edit rate' : 'New rate'}</h3>
          <div className="admin-form-grid">
            <div>
              <label className="label">Type</label>
              <select
                className="input"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as 'lagos_area' | 'state' })}
                disabled={!!editingId}
              >
                <option value="lagos_area">Lagos delivery area</option>
                <option value="state">Nigeria state</option>
              </select>
            </div>
            <div>
              <label className="label">Name / label</label>
              <input
                className={`input${fieldErrors.name ? ' is-invalid' : ''}`}
                value={form.name}
                maxLength={80}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={form.type === 'lagos_area' ? 'e.g. Epe' : 'e.g. Ogun'}
                required
              />
              <FieldError message={fieldErrors.name} />
            </div>
            <div>
              <label className="label">Code</label>
              <input
                className="input"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="Auto from name if blank"
              />
            </div>
            <div>
              <label className="label">Base rate (₦)</label>
              <MoneyInput
                required
                value={form.base_rate}
                error={fieldErrors.base_rate}
                onChange={(base_rate) => setForm({ ...form, base_rate })}
              />
            </div>
            <div>
              <label className="label">Sort order</label>
              <IntegerInput
                value={form.sort_order}
                error={fieldErrors.sort_order}
                onChange={(sort_order) => setForm({ ...form, sort_order })}
              />
            </div>
          </div>
          <div className="admin-checkbox-row">
            <label>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              Active
            </label>
          </div>
          <BusyButton className="btn btn-primary" type="submit" style={{ marginTop: 16 }} busy={saving} busyLabel="Saving…">
            {editingId ? 'Update rate' : 'Create rate'}
          </BusyButton>
        </form>
      )}

      <RateTable rows={lagos} title="Lagos delivery areas" />
      <RateTable rows={states} title="Nigeria states" />
    </div>
  );
}
