import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import api, { imageUrl } from '../api/client';
import type { Shop } from '../api/types';
import BusyButton from '../components/BusyButton';
import { AccountNumberInput, FieldError } from '../components/FormFields';
import { useAuth } from '../context/AuthContext';
import { useFeedback } from '../context/FeedbackContext';
import { apiErrorMessage, compactErrors, firstError, validateAccountNumber, validateTitle } from '../lib/validation';

export default function Sell() {
  const { user, loading, refreshUser } = useAuth();
  const { success, error: toastError } = useFeedback();
  const [shop, setShop] = useState<Shop | null>(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [bank, setBank] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(!user);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setReady(true);
      return;
    }
    api.get('/shop').then((r) => {
      setShop(r.data.shop);
      setReady(true);
    }).catch(() => setReady(true));
  }, [user, loading]);

  if (loading || !ready) return <div className="container page-pad">Loading…</div>;
  if (user && shop?.status === 'approved') return <Navigate to="/vendor" />;

  const apply = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const errors = compactErrors({
      name: validateTitle(name, 'Shop name'),
      accountNumber: accountNumber ? validateAccountNumber(accountNumber, { required: true }) : null,
    });
    setFieldErrors(errors);
    const summary = firstError(errors);
    if (summary) {
      setError(summary);
      toastError(summary);
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.post('/shop', {
        name,
        bio,
        payout_bank_name: bank,
        payout_account_name: accountName,
        payout_account_number: accountNumber || null,
      });
      setShop(data.shop);
      await refreshUser();
      success('Vendor application submitted');
    } catch (err: unknown) {
      const msg = apiErrorMessage(err, 'Could not submit application');
      setError(msg);
      toastError(msg);
    }
    setSaving(false);
  };

  return (
    <div className="container page-pad narrow-shell" style={{ maxWidth: 720 }}>
      <h1 className="section-title">Sell on The Tailors Market</h1>
      <p className="help-text" style={{ marginBottom: 24 }}>
        Open a shop and sell fabrics, tools, patterns, and other tailoring materials. The platform keeps 10% of product sales automatically;
        you receive 90% plus shipping on your items. Admin approval is required before products go live.
      </p>

      <div className="steps-grid" style={{ marginBottom: 32 }}>
        {[
          { step: '01', title: 'Create an account', desc: 'Sign up as a customer first, then apply to become a vendor from this page.' },
          { step: '02', title: 'Apply with shop details', desc: 'Add your shop name, bio, and bank details for payouts.' },
          { step: '03', title: 'Get approved & sell', desc: 'Once admin approves, list products, fulfill orders, and request withdrawals.' },
        ].map((item) => (
          <div key={item.step} className="step-card">
            <span className="step-number">{item.step}</span>
            <h3>{item.title}</h3>
            <p>{item.desc}</p>
          </div>
        ))}
      </div>

      {!user && (
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ marginBottom: 8 }}>Become a vendor</h2>
          <p className="help-text" style={{ marginBottom: 16 }}>
            Create a free account, then submit your shop application. You can also sign in if you already shop here.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/register?next=/sell" className="btn btn-primary">Create account & apply</Link>
            <Link to="/login?next=/sell" className="btn btn-outline">Sign in to apply</Link>
          </div>
        </div>
      )}

      {user && shop && (
        <div className="card" style={{ padding: 24 }}>
          {shop.logo && <img src={imageUrl(shop.logo)} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 12, marginBottom: 12 }} />}
          <h2 style={{ marginBottom: 8 }}>{shop.name}</h2>
          <p className="help-text">Status: <strong>{shop.status}</strong></p>
          {shop.status === 'pending' && (
            <p style={{ marginTop: 12 }}>Your shop is waiting for admin approval. You will be able to add products as soon as it is approved.</p>
          )}
          {shop.status === 'rejected' && (
            <p style={{ marginTop: 12 }}>Application was not approved{shop.rejection_reason ? `: ${shop.rejection_reason}` : '.'}</p>
          )}
          {shop.status === 'suspended' && (
            <p style={{ marginTop: 12 }}>This shop is suspended. Contact support if you need help.</p>
          )}
          <Link to="/" className="btn btn-outline" style={{ marginTop: 16 }}>Back to store</Link>
        </div>
      )}

      {user && !shop && (
        <form onSubmit={apply} className="card" style={{ padding: 24 }}>
          <h2 style={{ marginBottom: 16 }}>Shop application</h2>
          <div style={{ marginBottom: 16 }}>
            <label className="label">Shop name</label>
            <input className={`input${fieldErrors.name ? ' is-invalid' : ''}`} value={name} maxLength={120} onChange={(e) => setName(e.target.value)} required />
            <FieldError message={fieldErrors.name} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="label">About your shop</label>
            <textarea className="input" rows={4} maxLength={2000} value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="label">Bank name</label>
            <input className="input" value={bank} maxLength={120} onChange={(e) => setBank(e.target.value)} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="label">Account name</label>
            <input className="input" value={accountName} maxLength={120} onChange={(e) => setAccountName(e.target.value)} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="label">Account number</label>
            <AccountNumberInput value={accountNumber} error={fieldErrors.accountNumber} onChange={setAccountNumber} />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <BusyButton className="btn btn-primary" type="submit" busy={saving} busyLabel="Submitting…">
            Apply to sell
          </BusyButton>
        </form>
      )}
    </div>
  );
}
