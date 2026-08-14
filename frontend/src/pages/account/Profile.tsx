import { useState } from 'react';
import api from '../../api/client';
import BusyButton from '../../components/BusyButton';
import { FormAlert } from '../../components/FormAlert';
import { FieldError, PhoneInput } from '../../components/FormFields';
import PasswordInput from '../../components/PasswordInput';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import { apiErrorMessage, compactErrors, firstError, validatePassword, validatePersonName, validatePhone } from '../../lib/validation';

export default function AccountProfile() {
  const { user, refreshUser } = useAuth();
  const { success, error: toastError } = useFeedback();
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [marketing, setMarketing] = useState(user?.marketing_opt_in !== false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    const errors = compactErrors({
      name: validatePersonName(name),
      phone: validatePhone(phone),
      password: password ? validatePassword(password) : null,
      currentPassword: password && !currentPassword ? 'Enter your current password to change it.' : null,
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
      await api.put('/me', {
        name,
        phone,
        marketing_opt_in: marketing,
        current_password: password ? currentPassword : undefined,
        password: password || undefined,
      });
      await refreshUser();
      setPassword('');
      setCurrentPassword('');
      setMessage('Profile saved.');
      success('Profile saved');
    } catch (err: unknown) {
      const msg = apiErrorMessage(err, 'Could not save profile');
      setError(msg);
      toastError(msg);
    }
    setBusy(false);
  };

  return (
    <div className="admin-page">
      <h1>Profile</h1>
      <p className="admin-muted" style={{ marginBottom: 24 }}>Update your details. Invite code stays the same.</p>
      <FormAlert
        error={error}
        message={message}
        onDismiss={() => { setError(''); setMessage(''); }}
      />
      <form onSubmit={save} className="card admin-form-card" style={{ maxWidth: 480 }}>
        <div style={{ marginBottom: 16 }}>
          <label className="label">Name</label>
          <input className={`input${fieldErrors.name ? ' is-invalid' : ''}`} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} required />
          <FieldError message={fieldErrors.name} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label className="label">Email</label>
          <input className="input" value={user?.email ?? ''} disabled />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label className="label">Phone</label>
          <PhoneInput value={phone} error={fieldErrors.phone} onChange={setPhone} />
        </div>
        <label style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} />
          Email me about new products and offers
        </label>
        <div style={{ marginBottom: 16 }}>
          <label className="label">New password (optional)</label>
          <PasswordInput value={password} onChange={setPassword} minLength={8} autoComplete="new-password" />
        </div>
        {password && (
          <div style={{ marginBottom: 16 }}>
            <label className="label">Current password</label>
            <PasswordInput value={currentPassword} onChange={setCurrentPassword} required autoComplete="current-password" />
          </div>
        )}
        <BusyButton className="btn btn-primary" type="submit" busy={busy} busyLabel="Saving…">
          Save profile
        </BusyButton>
      </form>
    </div>
  );
}
