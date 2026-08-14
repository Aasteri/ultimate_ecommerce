import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import BusyButton from '../components/BusyButton';
import { FieldError } from '../components/FormFields';
import PasswordInput from '../components/PasswordInput';
import { useAuth } from '../context/AuthContext';
import { useFeedback } from '../context/FeedbackContext';
import { compactErrors, firstError, validateEmail, validatePassword } from '../lib/validation';

export default function Login() {
  const { login } = useAuth();
  const { success, error: toastError } = useFeedback();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const errors = compactErrors({
      email: validateEmail(email),
      password: validatePassword(password, { min: 1 }),
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
      const loggedIn = await login(email, password);
      success('Signed in successfully');
      if (loggedIn.role === 'admin') navigate('/admin');
      else if (next) navigate(next);
      else if (loggedIn.shop?.status === 'approved') navigate('/vendor');
      else navigate('/account');
    } catch {
      setError('Invalid credentials');
      toastError('Invalid email or password');
    }
    setBusy(false);
  };

  return (
    <div className="container auth-shell">
      <h1 className="auth-title">Welcome back</h1>
      <p className="auth-subtitle">Sign in to The Tailors Market</p>
      <form onSubmit={submit} className="card">
        <div style={{ marginBottom: 16 }}>
          <label className="label">Email</label>
          <input
            className={`input${fieldErrors.email ? ' is-invalid' : ''}`}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <FieldError message={fieldErrors.email} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label className="label">Password</label>
          <PasswordInput value={password} onChange={setPassword} required autoComplete="current-password" className={fieldErrors.password ? 'input is-invalid' : 'input'} />
          <FieldError message={fieldErrors.password} />
        </div>
        <p style={{ fontSize: 13, marginBottom: 16, textAlign: 'right' }}>
          <Link to="/forgot-password">Forgot password?</Link>
        </p>
        {error && <p className="error-msg">{error}</p>}
        <BusyButton className="btn btn-primary" style={{ width: '100%' }} type="submit" busy={busy} busyLabel="Signing in…">
          Sign in
        </BusyButton>
      </form>
      <p style={{ marginTop: 16, fontSize: 14, textAlign: 'center' }}>
        New here? <Link to={next ? `/register?next=${encodeURIComponent(next)}` : '/register'}>Create an account</Link>
      </p>
    </div>
  );
}
