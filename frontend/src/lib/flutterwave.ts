declare global {
  interface Window {
    FlutterwaveCheckout: (config: FlutterwaveCheckoutConfig) => void;
  }
}

export interface FlutterwaveCheckoutConfig {
  public_key: string;
  tx_ref: string;
  amount: number;
  currency: string;
  payment_options?: string;
  redirect_url?: string;
  customer: {
    email: string;
    name: string;
    phone_number?: string;
  };
  customizations?: {
    title?: string;
    description?: string;
    logo?: string;
  };
  callback?: (response: FlutterwaveCallbackResponse) => void;
  onclose?: () => void;
}

export interface FlutterwaveCallbackResponse {
  status: string;
  transaction_id: string;
  tx_ref: string;
}

const SCRIPT_TEST = 'https://checkout-v2.dev-flutterwave.com/v3.js';
const SCRIPT_LIVE = 'https://checkout.flutterwave.com/v3.js';

let scriptPromise: Promise<void> | null = null;

export function loadFlutterwaveScript(isTest: boolean): Promise<void> {
  if (typeof window.FlutterwaveCheckout === 'function') return Promise.resolve();

  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const src = isTest ? SCRIPT_TEST : SCRIPT_LIVE;
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Flutterwave checkout'));
    document.body.appendChild(script);
  });

  return scriptPromise;
}

export async function openFlutterwaveCheckout(
  config: FlutterwaveCheckoutConfig,
  isTest: boolean,
): Promise<void> {
  await loadFlutterwaveScript(isTest);

  const payload = {
    ...config,
    public_key: config.public_key,
    PBFPubKey: config.public_key,
    amount: String(config.amount),
  };

  window.FlutterwaveCheckout(payload as unknown as FlutterwaveCheckoutConfig);
}
