import { useEffect, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export function scrollToFeedback(id = 'form-feedback') {
  window.setTimeout(() => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 40);
}

type FormAlertProps = {
  error?: string;
  message?: string;
  id?: string;
  onDismiss?: () => void;
};

export function FormAlert({ error, message, id = 'form-feedback', onDismiss }: FormAlertProps) {
  const text = error || message;
  const kind = error ? 'error' : 'success';

  useEffect(() => {
    if (text) scrollToFeedback(id);
  }, [text, id]);

  if (!text) return null;

  return (
    <div
      id={id}
      className={`form-alert form-alert--${kind}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="form-alert-icon" aria-hidden>
        {kind === 'error' ? <AlertCircle size={22} /> : <CheckCircle2 size={22} />}
      </div>
      <div className="form-alert-body">
        <strong>{kind === 'error' ? 'Something went wrong' : 'Success'}</strong>
        <p>{text}</p>
      </div>
      {onDismiss && (
        <button type="button" className="form-alert-close" onClick={onDismiss} aria-label="Dismiss">
          <X size={18} />
        </button>
      )}
    </div>
  );
}

export function FormAlertSlot({ children }: { children?: ReactNode }) {
  return <div className="form-alert-slot">{children}</div>;
}
