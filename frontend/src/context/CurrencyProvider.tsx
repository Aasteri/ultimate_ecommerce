import { useEffect } from 'react';
import api, { setSiteCurrency } from '../api/client';

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    api.get('/settings').then((r) => {
      if (r.data.currency) setSiteCurrency(r.data.currency);
      if (r.data.site_name) document.title = r.data.site_name;
    }).catch(() => setSiteCurrency('NGN'));
  }, []);

  return <>{children}</>;
}
