import { useCallback, useRef, useState } from 'react';

/**
 * Runs an async click/submit handler once at a time and exposes `busy`.
 * Prevents double-submit from rapid clicks.
 */
export function useBusyAction<Args extends unknown[] = []>(
  action: (...args: Args) => Promise<void> | void,
) {
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);

  const run = useCallback(async (...args: Args) => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    try {
      await action(...args);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }, [action]);

  return { busy, run };
}
