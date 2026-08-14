import axios, { type InternalAxiosRequestConfig } from 'axios';

export const ensureSessionId = () => {
  let sessionId = localStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('session_id', sessionId);
  }
  return sessionId;
};

type BusyHandlers = {
  beginBusy: () => void;
  endBusy: () => void;
};

let busyHandlers: BusyHandlers | null = null;

export const bindApiBusyHandlers = (handlers: BusyHandlers | null) => {
  busyHandlers = handlers;
};

const shouldTrackBusy = (config: InternalAxiosRequestConfig) => {
  if (config.headers?.['X-Skip-Busy']) return false;
  const method = (config.method || 'get').toLowerCase();
  return method !== 'get' && method !== 'head' && method !== 'options';
};

const api = axios.create({
  baseURL: '/api',
  headers: { Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['X-Session-Id'] = ensureSessionId();
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  if (shouldTrackBusy(config)) {
    (config as InternalAxiosRequestConfig & { __busyTracked?: boolean }).__busyTracked = true;
    busyHandlers?.beginBusy();
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if ((response.config as InternalAxiosRequestConfig & { __busyTracked?: boolean }).__busyTracked) {
      busyHandlers?.endBusy();
    }
    return response;
  },
  (error) => {
    if ((error.config as InternalAxiosRequestConfig & { __busyTracked?: boolean } | undefined)?.__busyTracked) {
      busyHandlers?.endBusy();
    }
    return Promise.reject(error);
  },
);

export default api;

export const imageUrl = (path?: string | null) => {
  if (!path) return '/logo.png';
  if (path.startsWith('http')) return path;
  return `/storage/${path}`;
};

let siteCurrency = 'NGN';

export const setSiteCurrency = (currency: string) => {
  siteCurrency = currency;
};

export const getSiteCurrency = () => siteCurrency;

export const formatPrice = (amount: number | string, currency?: string) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  const curr = currency ?? siteCurrency;
  const locale = curr === 'NGN' ? 'en-NG' : 'en-US';
  return new Intl.NumberFormat(locale, { style: 'currency', currency: curr }).format(num);
};

export const formatDimensions = (width?: number | string | null, height?: number | string | null) => {
  if (!width || !height) return null;
  const w = parseFloat(String(width));
  const h = parseFloat(String(height));
  if (!w || !h) return null;
  const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, ''));
  return `${fmt(w)} × ${fmt(h)} in`;
};
