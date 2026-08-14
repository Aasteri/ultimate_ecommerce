import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { formatPrice } from '../../api/client';
import type { VendorOrder } from '../../api/types';

interface Stats {
  commission_rate: number;
  available_balance: number;
  lifetime_earnings: number;
  products_count: number;
  published_products: number;
  orders_count: number;
  paid_orders: number;
  pending_payouts: number;
  recent_orders: VendorOrder[];
}

export default function VendorDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/vendor/dashboard')
      .then((r) => setStats(r.data))
      .catch(() => setError('Failed to load vendor dashboard'));
  }, []);

  if (error) return <div className="admin-page"><p className="error-msg">{error}</p></div>;
  if (!stats) return <div className="admin-page"><p className="admin-muted">Loading…</p></div>;

  const cards = [
    { label: 'Available balance', value: formatPrice(stats.available_balance), sub: `${formatPrice(stats.lifetime_earnings)} lifetime`, link: '/vendor/payouts' },
    { label: 'Commission', value: `${stats.commission_rate}%`, sub: 'Kept by the platform on product sales', link: '/vendor/orders' },
    { label: 'Products', value: stats.published_products, sub: `${stats.products_count} total`, link: '/vendor/products' },
    { label: 'Paid orders', value: stats.paid_orders, sub: `${stats.orders_count} total`, link: '/vendor/orders' },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Vendor dashboard</h1>
          <p className="admin-muted">Sales, commission, and payouts are calculated automatically.</p>
        </div>
        <Link to="/vendor/products" className="btn btn-primary">Add product</Link>
      </div>
      <div className="admin-stat-grid">
        {cards.map((c) => (
          <Link key={c.label} to={c.link} className="admin-stat-card card">
            <p className="admin-stat-label">{c.label}</p>
            <p className="admin-stat-value">{c.value}</p>
            {c.sub && <p className="admin-stat-sub">{c.sub}</p>}
          </Link>
        ))}
      </div>
      <section className="admin-section">
        <div className="admin-section-header">
          <h2>Recent orders</h2>
          <Link to="/vendor/orders">View all →</Link>
        </div>
        {stats.recent_orders.length === 0 ? (
          <div className="admin-empty card">No orders yet.</div>
        ) : (
          <div className="table-scroll">
<table className="data-table card">
            <thead>
              <tr><th>Vendor order</th><th>Customer order</th><th>Your payout</th><th>Status</th></tr>
            </thead>
            <tbody>
              {stats.recent_orders.map((o) => (
                <tr key={o.id}>
                  <td>{o.vendor_order_number}</td>
                  <td>{o.order?.order_number}</td>
                  <td>{formatPrice(o.vendor_amount)}</td>
                  <td>{o.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
</div>
        )}
      </section>
    </div>
  );
}
