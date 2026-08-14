import { useEffect, useState } from 'react';
import api, { imageUrl } from '../../api/client';
import type { Shop } from '../../api/types';
import BusyButton from '../../components/BusyButton';
import { FormAlert } from '../../components/FormAlert';
import { AccountNumberInput, FieldError } from '../../components/FormFields';
import { useAuth } from '../../context/AuthContext';
import { compactErrors, firstError, validateAccountNumber, validateTitle } from '../../lib/validation';

export default function VendorSettings() {
  const { refreshUser } = useAuth();
  const [shop, setShop] = useState<Shop | null>(null);
  const [form, setForm] = useState({ name: '', bio: '', payout_bank_name: '', payout_account_name: '', payout_account_number: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.get('/shop').then((r) => {
      const s = r.data.shop as Shop;
      setShop(s);
      setForm({
        name: s.name || '',
        bio: s.bio || '',
        payout_bank_name: s.payout_bank_name || '',
        payout_account_name: s.payout_account_name || '',
        payout_account_number: s.payout_account_number || '',
      });
    });
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    const errors = compactErrors({
      name: validateTitle(form.name, 'Shop name'),
      payout_account_number: form.payout_account_number
        ? validateAccountNumber(form.payout_account_number, { required: true })
        : null,
    });
    setFieldErrors(errors);
    const summary = firstError(errors);
    if (summary) {
      setError(summary);
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.put('/shop', {
        ...form,
        payout_account_number: form.payout_account_number || null,
      });
      setShop(data.shop);
      setMessage('Shop updated.');
      await refreshUser();
    } catch {
      setError('Failed to save');
    }
    setSaving(false);
  };

  const uploadLogo = async (file: File) => {
    setUploading(true);
    setError('');
    try {
      const body = new FormData();
      body.append('logo', file);
      const { data } = await api.post('/shop/logo', body);
      setShop(data.shop);
      setMessage('Logo uploaded.');
    } catch {
      setError('Failed to upload logo');
    }
    setUploading(false);
  };

  if (!shop) return <p className="admin-muted">Loading…</p>;

  return (
    <div className="admin-page">
      <h1>Shop settings</h1>
      <p className="admin-muted" style={{ marginBottom: 24 }}>Public storefront: /shop/{shop.slug}</p>
      <FormAlert
        error={error}
        message={message}
        onDismiss={() => { setError(''); setMessage(''); }}
      />
      <form onSubmit={save} className="card admin-form-card" style={{ maxWidth: 520 }}>
        {shop.logo && <img src={imageUrl(shop.logo)} alt="" className="admin-preview-thumb" />}
        <div style={{ marginBottom: 16 }}>
          <label className="label">Logo</label>
          <input type="file" accept="image/*" disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogo(f); }} />
          {uploading && <p className="help-text">Uploading logo…</p>}
        </div>
        <div style={{ marginBottom: 16 }}>
          <label className="label">Shop name</label>
          <input className={`input${fieldErrors.name ? ' is-invalid' : ''}`} value={form.name} maxLength={120} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <FieldError message={fieldErrors.name} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label className="label">Bio</label>
          <textarea className="input" rows={4} maxLength={2000} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label className="label">Bank name</label>
          <input className="input" value={form.payout_bank_name} maxLength={120} onChange={(e) => setForm({ ...form, payout_bank_name: e.target.value })} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label className="label">Account name</label>
          <input className="input" value={form.payout_account_name} maxLength={120} onChange={(e) => setForm({ ...form, payout_account_name: e.target.value })} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label className="label">Account number</label>
          <AccountNumberInput value={form.payout_account_number} error={fieldErrors.payout_account_number} onChange={(payout_account_number) => setForm({ ...form, payout_account_number })} />
        </div>
        <BusyButton className="btn btn-primary" type="submit" busy={saving} busyLabel="Saving…">
          Save
        </BusyButton>
      </form>
    </div>
  );
}
