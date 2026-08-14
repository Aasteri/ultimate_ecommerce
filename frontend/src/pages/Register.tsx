import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import BusyButton from '../components/BusyButton';
import { FieldError } from '../components/FormFields';
import PasswordInput from '../components/PasswordInput';
import { useAuth } from '../context/AuthContext';
import { useFeedback } from '../context/FeedbackContext';
import { compactErrors, firstError, validateEmail, validatePassword, validatePersonName } from '../lib/validation';

export default function Register() {
  const { register } = useAuth();
  const { success, error: toastError } = useFeedback();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [marketingOptIn, setMarketingOptIn] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const referralCode = (searchParams.get('ref') || localStorage.getItem('referral_code') || '').toUpperCase();
  const next = searchParams.get('next');

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) localStorage.setItem('referral_code', ref.toUpperCase());
  }, [searchParams]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const errors = compactErrors({
      name: validatePersonName(name, 'Full name'),
      email: validateEmail(email),
      password: validatePassword(password),
    });
    setFieldErrors(errors);
    const summary = firstError(errors);
    if (summary) {
      setError(summary);
      toastError(summary);
      return;
    }
    setBusy(true);
    try {
      await register(name, email, password, referralCode || undefined, marketingOptIn);
      success('Account created');
      navigate(next || '/account');
    } catch {
      setError('Registration failed. Email may already be in use.');
      toastError('Registration failed. Email may already be in use.');
    }
    setBusy(false);
  };

  return (
    <div className="container auth-shell">
      <h1 className="auth-title">Create your account</h1>
      <p className="auth-subtitle">
        {next === '/sell'
          ? 'Create an account, then apply to sell tailoring materials.'
          : 'Join The Tailors Market to shop supplies for every tailor'}
      </p>
      <form onSubmit={submit} className="card">
        <div style={{ marginBottom: 16 }}>
          <label className="label">Full name</label>
          <input
            className={`input${fieldErrors.name ? ' is-invalid' : ''}`}
            value={name}
            maxLength={80}
            autoComplete="name"
            onChange={(e) => setName(e.target.value)}
            required
          />
          <FieldError message={fieldErrors.name} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label className="label">Email</label>
          <input
            className={`input${fieldErrors.email ? ' is-invalid' : ''}`}
            type="email"
            value={email}
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <FieldError message={fieldErrors.email} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label className="label">Password</label>
          <PasswordInput value={password} onChange={setPassword} minLength={8} required autoComplete="new-password" className={fieldErrors.password ? 'input is-invalid' : 'input'} />
          <FieldError message={fieldErrors.password} />
          <p className="help-text">At least 8 characters</p>
        </div>
        {error && <p className="error-msg">{error}</p>}
        {referralCode && (
          <p className="help-text" style={{ marginBottom: 12 }}>
            Referred with code <strong>{referralCode}</strong>. Your referrer earns 10% of your first purchase.
          </p>
        )}
        <label className="admin-checkbox-row" style={{ marginBottom: 16 }}>
          <input type="checkbox" checked={marketingOptIn} onChange={(e) => setMarketingOptIn(e.target.checked)} />
          <span>Email me about new products, offers, and marketplace updates. You can unsubscribe anytime.</span>
        </label>
        <BusyButton className="btn btn-primary" style={{ width: '100%' }} type="submit" busy={busy} busyLabel="Creating account…">
          Create account
        </BusyButton>
      </form>
      <p style={{ marginTop: 16, fontSize: 14, textAlign: 'center' }}>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  );
}
