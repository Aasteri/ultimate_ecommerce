import type { InputHTMLAttributes } from 'react';
import {
  sanitizeAccountNumber,
  sanitizeDecimal,
  sanitizeInteger,
  sanitizeMoney,
  sanitizePercent,
  sanitizePhone,
} from '../lib/validation';

type BaseProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> & {
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

export function FieldError({ message }: { message?: string | null }) {
  if (!message) return null;
  return <p className="field-error" role="alert">{message}</p>;
}

function RestrictedInput({
  value,
  onChange,
  error,
  sanitize,
  inputMode,
  maxLength,
  className = 'input',
  ...rest
}: BaseProps & {
  sanitize: (raw: string) => string;
  inputMode: 'decimal' | 'numeric' | 'tel';
  maxLength: number;
}) {
  return (
    <>
      <input
        {...rest}
        className={`${className}${error ? ' is-invalid' : ''}`}
        type="text"
        inputMode={inputMode}
        autoComplete={rest.autoComplete ?? 'off'}
        spellCheck={false}
        maxLength={maxLength}
        value={value}
        aria-invalid={error ? true : undefined}
        onFocus={(e) => {
          rest.onFocus?.(e);
          // Makes replacing a lone "0" natural (type "5" → "5", not "05")
          if (value === '0') e.currentTarget.select();
        }}
        onChange={(e) => {
          let raw = e.target.value;
          if (value === '0' && raw.length === 2 && raw.startsWith('0') && raw !== '0.') {
            raw = raw.slice(1);
          }
          onChange(sanitize(raw));
        }}
        onPaste={(e) => {
          e.preventDefault();
          onChange(sanitize(e.clipboardData.getData('text')));
        }}
      />
      <FieldError message={error} />
    </>
  );
}

/** Naira / money amounts — up to 10 digits before decimal, 2 after (e.g. 8500 or 8500.50). */
export function MoneyInput(props: BaseProps) {
  return (
    <RestrictedInput
      {...props}
      sanitize={sanitizeMoney}
      inputMode="decimal"
      maxLength={13}
      placeholder={props.placeholder ?? 'e.g. 8500'}
      className={props.className ? `${props.className} money-input` : 'input money-input'}
    />
  );
}

/** Whole numbers only (stock, qty, sort order, etc.). */
export function IntegerInput(props: BaseProps & { maxDigits?: number }) {
  const { maxDigits = 9, ...rest } = props;
  return (
    <RestrictedInput
      {...rest}
      sanitize={(raw) => sanitizeInteger(raw, maxDigits)}
      inputMode="numeric"
      maxLength={maxDigits}
    />
  );
}

/** 0–100 percentages. */
export function PercentInput(props: BaseProps) {
  return (
    <RestrictedInput
      {...props}
      sanitize={sanitizePercent}
      inputMode="decimal"
      maxLength={6}
      placeholder={props.placeholder ?? 'e.g. 10'}
    />
  );
}

/** Generic decimals (dimensions, etc.) — not currency. */
export function DecimalInput(props: BaseProps) {
  return (
    <RestrictedInput
      {...props}
      sanitize={(raw) => sanitizeDecimal(raw, 6, 2)}
      inputMode="decimal"
      maxLength={10}
      placeholder={props.placeholder ?? 'e.g. 12.5'}
    />
  );
}

export function PhoneInput(props: BaseProps) {
  return (
    <RestrictedInput
      {...props}
      sanitize={sanitizePhone}
      inputMode="tel"
      maxLength={20}
      autoComplete={props.autoComplete ?? 'tel'}
    />
  );
}

export function AccountNumberInput(props: BaseProps) {
  return (
    <RestrictedInput
      {...props}
      sanitize={sanitizeAccountNumber}
      inputMode="numeric"
      maxLength={10}
      placeholder={props.placeholder ?? '10-digit NUBAN'}
    />
  );
}
