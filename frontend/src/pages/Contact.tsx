import { useState } from 'react';
import api from '../api/client';
import BusyButton from '../components/BusyButton';
import { FieldError } from '../components/FormFields';
import { useFeedback } from '../context/FeedbackContext';
import { compactErrors, firstError, validateEmail, validateMinLength, validatePersonName } from '../lib/validation';

export default function Contact() {
  const { success, error: toastError } = useFeedback();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = compactErrors({
      name: validatePersonName(form.name),
      email: validateEmail(form.email),
      message: validateMinLength(form.message, 'Message', 10),
    });
    setFieldErrors(errors);
    const summary = firstError(errors);
    if (summary) {
      toastError(summary);
      return;
    }
    setBusy(true);
    try {
      await api.post('/contact', form);
      setSent(true);
      success('Message sent successfully');
    } catch {
      toastError('Could not send message. Please try again.');
    }
    setBusy(false);
  };

  return (
    <div className="container page-pad narrow-shell">
      <h1 className="section-title">Contact us</h1>
      <p className="auth-subtitle">
        Send us a message and we'll get back to you, usually within one business day.
      </p>
      {sent ? (
        <p className="success-msg">Message sent successfully!</p>
      ) : (
        <form onSubmit={submit} className="card" style={{ padding: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <label className="label">Name</label>
            <input className={`input${fieldErrors.name ? ' is-invalid' : ''}`} value={form.name} maxLength={80} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <FieldError message={fieldErrors.name} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="label">Email</label>
            <input className={`input${fieldErrors.email ? ' is-invalid' : ''}`} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <FieldError message={fieldErrors.email} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="label">Subject</label>
            <input className="input" value={form.subject} maxLength={120} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="label">Message</label>
            <textarea className={`input${fieldErrors.message ? ' is-invalid' : ''}`} rows={5} maxLength={5000} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
            <FieldError message={fieldErrors.message} />
          </div>
          <BusyButton className="btn btn-primary" type="submit" busy={busy} busyLabel="Sending…">
            Send message
          </BusyButton>
        </form>
      )}
    </div>
  );
}
