import { useEffect, type ReactNode } from 'react';
import { bindApiBusyHandlers } from '../api/client';
import { FeedbackProvider, useFeedback } from '../context/FeedbackContext';
import FeedbackUI from '../components/FeedbackUI';

function ApiBusyBridge({ children }: { children: ReactNode }) {
  const { beginBusy, endBusy } = useFeedback();

  useEffect(() => {
    bindApiBusyHandlers({ beginBusy, endBusy });
    return () => bindApiBusyHandlers(null);
  }, [beginBusy, endBusy]);

  return (
    <>
      <FeedbackUI />
      {children}
    </>
  );
}

export default function AppFeedback({ children }: { children: ReactNode }) {
  return (
    <FeedbackProvider>
      <ApiBusyBridge>{children}</ApiBusyBridge>
    </FeedbackProvider>
  );
}
