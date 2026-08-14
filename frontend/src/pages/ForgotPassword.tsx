import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import BusyButton from '../components/BusyButton';
import PasswordInput from '../components/PasswordInput';
import { apiErrorMessage, compactErrors, firstError, sanitizeOtp, validateEmail, validatePassword } from '../lib/validation';

export default function ForgotPassword() {
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const sendCode = async () => {
    setError('');
    setMessage('');
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post('/password/forgot', { email });
      setMessage(data.message);
      setStep('reset');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number; data?: { message?: string } } }).response;
      setError(status?.data?.message || 'Could not send code. Please try again.');
      if (status?.status === 429) setStep('reset');
    }
    setBusy(false);
  };

  const requestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendCode();
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    const errors = compactErrors({
      email: validateEmail(email),
      otp: otp.length !== 6 ? 'Enter the 6-digit code from your email.' : null,
      password: validatePassword(password),
      passwordConfirm: password !== passwordConfirm ? 'Passwords do not match.' : null,
    });
    const summary = firstError(errors);
    if (summary) {
      setError(summary);
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post('/password/reset', {
        email,
        otp,
        password,
      });
      setMessage(data.message);
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Could not reset password'));
    }
    setBusy(false);
  };

  return (
    <div className="container auth-shell">
      <h1 className="auth-title">Forgot password</h1>
      <p className="auth-subtitle">
        We will email you a 6-digit code. If it does not arrive quickly, check your spam or junk folder.
      </p>

      {step === 'request' ? (
        <form onSubmit={requestCode} className="card">
          <div style={{ marginBottom: 16 }}>
            <label className="label">Account email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          {error && <p className="error-msg">{error}</p>}
          {message && <p className="success-msg">{message}</p>}
          <BusyButton className="btn btn-primary" style={{ width: '100%' }} type="submit" busy={busy} busyLabel="Sending…">
            Send reset code
          </BusyButton>
        </form>
      ) : (
        <form onSubmit={resetPassword} className="card">
          <div style={{ marginBottom: 16 }}>
            <label className="label">Account email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="label">6-digit code</label>
            <input
              className="input"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(sanitizeOtp(e.target.value))}
              required
              placeholder="123456"
            />
            <p className="help-text">Check your inbox and spam/junk folder for the code from The Tailors Market.</p>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="label">New password</label>
            <PasswordInput value={password} onChange={setPassword} minLength={8} required autoComplete="new-password" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="label">Confirm new password</label>
            <PasswordInput value={passwordConfirm} onChange={setPasswordConfirm} minLength={8} required autoComplete="new-password" />
          </div>
          {error && <p className="error-msg">{error}</p>}
          {message && <p className="success-msg">{message}</p>}
          <BusyButton className="btn btn-primary" style={{ width: '100%' }} type="submit" busy={busy} busyLabel="Saving…">
            Update password
          </BusyButton>
          <BusyButton
            type="button"
            className="btn btn-outline"
            style={{ width: '100%', marginTop: 8 }}
            busy={busy}
            busyLabel="Sending…"
            onClick={() => sendCode()}
          >
            Resend code
          </BusyButton>
        </form>
      )}

      <p style={{ marginTop: 16, fontSize: 14, textAlign: 'center' }}>
        <Link to="/login">Back to sign in</Link>
      </p>
    </div>
  );
}
