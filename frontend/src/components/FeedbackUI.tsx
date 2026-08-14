import { AlertCircle, CheckCircle2, Info, Loader2, X } from 'lucide-react';
import { useFeedback, type ToastKind } from '../context/FeedbackContext';

function ToastIcon({ kind }: { kind: ToastKind }) {
  if (kind === 'success') return <CheckCircle2 size={22} aria-hidden />;
  if (kind === 'error') return <AlertCircle size={22} aria-hidden />;
  return <Info size={22} aria-hidden />;
}

export default function FeedbackUI() {
  const { toasts, busyCount, dismiss } = useFeedback();
  const busy = busyCount > 0;

  return (
    <>
      <div className={`app-busy-bar ${busy ? 'is-active' : ''}`} aria-hidden={!busy} />
      {busy && (
        <div className="app-busy-pill" role="status" aria-live="polite">
          <Loader2 size={14} className="btn-spinner" aria-hidden />
          <span>Working…</span>
        </div>
      )}
      <div className="toast-stack" aria-live="polite" aria-relevant="additions">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.kind}`} role="status">
            <span className="toast-icon">
              <ToastIcon kind={t.kind} />
            </span>
            <p>{t.message}</p>
            <button type="button" className="toast-close" onClick={() => dismiss(t.id)} aria-label="Dismiss">
              <X size={18} />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
