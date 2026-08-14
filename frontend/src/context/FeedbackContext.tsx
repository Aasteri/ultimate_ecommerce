import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface FeedbackContextType {
  toasts: ToastItem[];
  busyCount: number;
  toast: (message: string, kind?: ToastKind) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  dismiss: (id: number) => void;
  beginBusy: () => void;
  endBusy: () => void;
}

const FeedbackContext = createContext<FeedbackContextType | null>(null);

let toastId = 1;

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [busyCount, setBusyCount] = useState(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = toastId++;
    setToasts((prev) => [...prev.slice(-4), { id, kind, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, kind === 'error' ? 8000 : 5500);
  }, []);

  const success = useCallback((message: string) => toast(message, 'success'), [toast]);
  const error = useCallback((message: string) => toast(message, 'error'), [toast]);
  const info = useCallback((message: string) => toast(message, 'info'), [toast]);

  const beginBusy = useCallback(() => {
    setBusyCount((n) => {
      const next = n + 1;
      if (next === 1) document.body.classList.add('app-is-busy');
      return next;
    });
  }, []);
  const endBusy = useCallback(() => {
    setBusyCount((n) => {
      const next = Math.max(0, n - 1);
      if (next === 0) document.body.classList.remove('app-is-busy');
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ toasts, busyCount, toast, success, error, info, dismiss, beginBusy, endBusy }),
    [toasts, busyCount, toast, success, error, info, dismiss, beginBusy, endBusy],
  );

  return <FeedbackContext.Provider value={value}>{children}</FeedbackContext.Provider>;
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedback must be used within FeedbackProvider');
  return ctx;
}
