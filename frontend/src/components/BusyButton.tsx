import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  busy?: boolean;
  busyLabel?: string;
  children: ReactNode;
};

export default function BusyButton({
  busy = false,
  busyLabel,
  children,
  className = 'btn btn-primary',
  disabled,
  type = 'button',
  ...rest
}: Props) {
  const isDisabled = disabled || busy;

  return (
    <button
      {...rest}
      type={type}
      className={`${className}${busy ? ' is-busy' : ''}`}
      disabled={isDisabled}
      aria-busy={busy || undefined}
      aria-disabled={isDisabled || undefined}
    >
      {busy && <Loader2 size={16} className="btn-spinner" aria-hidden />}
      <span>{busy ? (busyLabel ?? children) : children}</span>
    </button>
  );
}
