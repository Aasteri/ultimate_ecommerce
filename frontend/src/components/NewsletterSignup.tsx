import { useState } from 'react';
import api from '../api/client';
import BusyButton from './BusyButton';
import { useFeedback } from '../context/FeedbackContext';
import { validateEmail } from '../lib/validation';

export default function NewsletterSignup({ compact = false }: { compact?: boolean }) {
  const { success, error: toastError } = useFeedback();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailError = validateEmail(email);
    if (emailError) {
      setStatus('error');
      setMessage(emailError);
      toastError(emailError);
      return;
    }
    setBusy(true);
    setStatus('idle');
    setMessage('');
    try {
      await api.post('/newsletter', { email });
      setStatus('ok');
      setMessage('Thanks for subscribing!');
      setEmail('');
      success('Subscribed to the newsletter');
    } catch {
      setStatus('error');
      setMessage('Could not subscribe. Please try again.');
      toastError('Could not subscribe. Please try again.');
    }
    setBusy(false);
  };

  return (
    <div className={compact ? 'footer-newsletter' : undefined}>
      <form onSubmit={subscribe} className={compact ? 'footer-newsletter-form' : 'newsletter-form'}>
        <input
          className="input"
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={busy}
        />
        <BusyButton className="btn btn-primary" type="submit" busy={busy} busyLabel="…">
          Subscribe
        </BusyButton>
      </form>
      {status === 'ok' && <p className="success-msg" style={{ marginTop: 8 }}>{message}</p>}
      {status === 'error' && <p className="error-msg" style={{ marginTop: 8 }}>{message}</p>}
    </div>
  );
}
