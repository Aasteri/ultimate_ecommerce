/** Digits before the decimal point for money (e.g. 9999999999.99). */
const MONEY_INT_DIGITS = 10;
const MONEY_DEC_DIGITS = 2;

export function sanitizeMoney(raw: string, maxIntDigits = MONEY_INT_DIGITS): string {
  const cleaned = String(raw ?? '').replace(/[^\d.]/g, '');
  if (!cleaned) return '';

  const dot = cleaned.indexOf('.');
  let intPart = dot === -1 ? cleaned : cleaned.slice(0, dot);
  let decPart = dot === -1 ? '' : cleaned.slice(dot + 1).replace(/\./g, '');

  intPart = intPart.replace(/^0+(?=\d)/, '').slice(0, maxIntDigits);
  decPart = decPart.slice(0, MONEY_DEC_DIGITS);

  if (dot === -1) return intPart;

  // Keep a trailing dot while typing (e.g. "1500.")
  if (cleaned.endsWith('.') && decPart === '') {
    return `${intPart || '0'}.`;
  }

  return `${intPart || '0'}.${decPart}`;
}

export function sanitizeDecimal(raw: string, maxIntDigits = 6, places = MONEY_DEC_DIGITS): string {
  const cleaned = String(raw ?? '').replace(/[^\d.]/g, '');
  if (!cleaned) return '';

  const dot = cleaned.indexOf('.');
  let intPart = dot === -1 ? cleaned : cleaned.slice(0, dot);
  let decPart = dot === -1 ? '' : cleaned.slice(dot + 1).replace(/\./g, '');

  intPart = intPart.replace(/^0+(?=\d)/, '').slice(0, maxIntDigits);
  decPart = decPart.slice(0, places);

  if (dot === -1) return intPart;
  if (cleaned.endsWith('.') && decPart === '') return `${intPart || '0'}.`;
  return `${intPart || '0'}.${decPart}`;
}

export function sanitizePercent(raw: string): string {
  const next = sanitizeDecimal(raw, 3, 2);
  if (!next || next === '.') return next;
  const amount = Number(next.endsWith('.') ? next.slice(0, -1) : next);
  if (Number.isFinite(amount) && amount > 100) return '100';
  return next;
}

export function sanitizeInteger(raw: string, maxDigits = 9): string {
  const digits = String(raw ?? '').replace(/\D/g, '').slice(0, maxDigits);
  if (!digits) return '';
  if (/^0+$/.test(digits)) return '0';
  return digits.replace(/^0+/, '');
}

export function sanitizePhone(raw: string): string {
  let value = String(raw ?? '').replace(/[^\d+\s-]/g, '').slice(0, 20);
  const plus = value.startsWith('+');
  value = (plus ? '+' : '') + value.replace(/\+/g, '');
  return value;
}

export function sanitizeAccountNumber(raw: string): string {
  return String(raw ?? '').replace(/\D/g, '').slice(0, 10);
}

export function sanitizeOtp(raw: string): string {
  return String(raw ?? '').replace(/\D/g, '').slice(0, 6);
}

export function sanitizeCouponCode(raw: string): string {
  return String(raw ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 32);
}

export function sanitizeSlug(raw: string): string {
  return String(raw ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-/, '')
    .slice(0, 80);
}

export function parseAmount(value: string): number | null {
  const normalized = String(value ?? '').trim().replace(/\.$/, '');
  if (!normalized) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

export function parseInteger(value: string): number | null {
  const normalized = String(value ?? '').trim();
  if (!normalized) return null;
  if (!/^\d+$/.test(normalized)) return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

export function required(value: string, label: string): string | null {
  if (!value.trim()) return `${label} is required.`;
  return null;
}

export function validateEmail(value: string, label = 'Email'): string | null {
  if (!value.trim()) return `${label} is required.`;
  if (!isEmail(value)) return 'Enter a valid email address.';
  return null;
}

export function validatePersonName(value: string, label = 'Name'): string | null {
  const trimmed = value.trim();
  if (!trimmed) return `${label} is required.`;
  if (trimmed.length < 2) return `${label} must be at least 2 characters.`;
  if (trimmed.length > 80) return `${label} is too long.`;
  // Letters, spaces, and common name punctuation — not a digit dump.
  if (!/^[\p{L}\p{M}][\p{L}\p{M} .',-]*$/u.test(trimmed)) {
    return `${label} can only contain letters and common punctuation.`;
  }
  return null;
}

export function validateTitle(value: string, label = 'Title'): string | null {
  const trimmed = value.trim();
  if (!trimmed) return `${label} is required.`;
  if (trimmed.length < 2) return `${label} must be at least 2 characters.`;
  if (trimmed.length > 120) return `${label} is too long.`;
  return null;
}

export function validatePassword(value: string, { required: need = true, min = 8 } = {}): string | null {
  if (!value) return need ? 'Password is required.' : null;
  if (value.length < min) return `Password must be at least ${min} characters.`;
  if (value.length > 100) return 'Password is too long.';
  return null;
}

export function validateMoney(
  value: string,
  label = 'Price',
  { required: need = true, min = 1, max = 99_999_999 } = {},
): string | null {
  if (!value.trim() || value.trim() === '.') return need ? `${label} is required.` : null;
  const amount = parseAmount(value);
  if (amount === null) return `${label} must be a valid amount, e.g. 1500 or 1500.50.`;
  if (amount < min) return `${label} must be at least ₦${min.toLocaleString()}.`;
  if (amount > max) return `${label} is too large.`;
  return null;
}

export function validateDecimal(
  value: string,
  label: string,
  { required: need = false, min = 0, max = 500 } = {},
): string | null {
  if (!value.trim() || value.trim() === '.') return need ? `${label} is required.` : null;
  const amount = parseAmount(value);
  if (amount === null) return `${label} must be a number, e.g. 12 or 12.5.`;
  if (amount < min) return `${label} must be at least ${min}.`;
  if (amount > max) return `${label} cannot be more than ${max}.`;
  return null;
}

export function validateInteger(
  value: string,
  label: string,
  { required: need = true, min = 0, max = 1_000_000 } = {},
): string | null {
  if (!value.trim()) return need ? `${label} is required.` : null;
  const n = parseInteger(value);
  if (n === null) return `${label} must be a whole number.`;
  if (n < min) return `${label} must be at least ${min}.`;
  if (n > max) return `${label} cannot be more than ${max}.`;
  return null;
}

export function validatePercent(value: string, label: string, { required: need = true } = {}): string | null {
  if (!value.trim() || value.trim() === '.') return need ? `${label} is required.` : null;
  const amount = parseAmount(value);
  if (amount === null) return `${label} must be a number.`;
  if (amount < 0 || amount > 100) return `${label} must be between 0 and 100.`;
  return null;
}

export function validatePhone(value: string, { required: need = false } = {}): string | null {
  const digits = value.replace(/\D/g, '');
  if (!digits) return need ? 'Phone number is required.' : null;
  if (digits.length < 10 || digits.length > 15) return 'Enter a valid phone number (10–15 digits).';
  return null;
}

export function validateAccountNumber(value: string, { required: need = false } = {}): string | null {
  if (!value.trim()) return need ? 'Account number is required.' : null;
  if (!/^\d{10}$/.test(value)) return 'Account number must be 10 digits.';
  return null;
}

export function validateMinLength(value: string, label: string, min: number): string | null {
  if (!value.trim()) return `${label} is required.`;
  if (value.trim().length < min) return `${label} must be at least ${min} characters.`;
  return null;
}

export function firstError(errors: Record<string, string | null | undefined>): string | null {
  for (const message of Object.values(errors)) {
    if (message) return message;
  }
  return null;
}

export function validateProductFields(form: {
  title: string;
  offer: string;
  digital_price: string;
  physical_price: string;
  physical_stock: string;
  width_mm: string;
  height_mm: string;
  is_digital_available: boolean;
  is_physical_available: boolean;
}): Record<string, string> {
  return compactErrors({
    title: validateTitle(form.title, 'Title'),
    offer: form.offer ? null : 'Select whether this product is digital, physical, or both.',
    digital_price: form.is_digital_available ? validateMoney(form.digital_price, 'Digital price') : null,
    physical_price: form.is_physical_available ? validateMoney(form.physical_price, 'Physical price') : null,
    physical_stock: form.is_physical_available
      ? validateInteger(form.physical_stock || '0', 'Stock', { min: 0, max: 100000 })
      : null,
    width_mm: form.is_physical_available && form.width_mm
      ? validateDecimal(form.width_mm, 'Width', { min: 0.01, max: 500 })
      : null,
    height_mm: form.is_physical_available && form.height_mm
      ? validateDecimal(form.height_mm, 'Height', { min: 0.01, max: 500 })
      : null,
  });
}

export function compactErrors(errors: Record<string, string | null | undefined>): Record<string, string> {
  const next: Record<string, string> = {};
  for (const [key, message] of Object.entries(errors)) {
    if (message) next[key] = message;
  }
  return next;
}

export function apiErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response?.data;
  if (data?.errors) {
    const first = Object.values(data.errors).find((list) => list?.[0]);
    if (first?.[0]) return first[0];
  }
  return data?.message || fallback;
}
