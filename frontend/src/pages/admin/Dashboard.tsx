import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { formatPrice } from '../../api/client';
import type { Order } from '../../api/types';

interface DashboardStats {
  total_products: number;
  published_products: number;
  draft_products: number;
  total_orders: number;
  paid_orders: number;
  total_revenue: number | string;
  revenue_this_month: number | string;
  pending_physical_orders: number;
  shipping_discussion_needed: number;
  newsletter_subscribers: number;
  unread_messages: number;
  pending_shops: number;
  approved_shops: number;
  pending_payouts: number;
  pending_wallet_payouts: number;
  platform_commission: number | string;
  recent_orders: Order[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/dashboard')
      .then((r) => setStats(r.data))
      .catch(() => setError('Failed to load dashboard. Check that you are signed in as admin.'));
  }, []);

  if (error) {
    return (
      <div className="admin-page">
        <p className="error-msg">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return <div className="admin-page"><p className="admin-muted">Loading dashboard…</p></div>;
  }

  const statCards = [
    { label: 'Published products', value: stats.published_products, sub: `${stats.draft_products} drafts`, link: '/admin/products' },
    { label: 'Total revenue', value: formatPrice(stats.total_revenue), sub: `${formatPrice(stats.revenue_this_month)} this month`, link: '/admin/orders' },
    { label: 'Paid orders', value: stats.paid_orders, sub: `${stats.total_orders} total`, link: '/admin/orders' },
    { label: 'Pending physical', value: stats.pending_physical_orders, sub: 'Awaiting fulfillment', link: '/admin/orders' },
    { label: 'Shipping to discuss', value: stats.shipping_discussion_needed, sub: 'International paid orders', link: '/admin/messages' },
    { label: 'Subscribers', value: stats.newsletter_subscribers, link: '/admin/newsletter' },
    { label: 'Unread messages', value: stats.unread_messages, link: '/admin/messages' },
    { label: 'Pending shops', value: stats.pending_shops, sub: `${stats.approved_shops} approved`, link: '/admin/shops' },
    { label: 'Vendor payouts', value: stats.pending_payouts, sub: `${stats.pending_wallet_payouts} referral payouts`, link: '/admin/payouts' },
    { label: 'Platform commission', value: formatPrice(stats.platform_commission), sub: '10% of vendor product sales', link: '/admin/orders' },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="admin-muted">Overview of your store</p>
        </div>
        <div className="admin-quick-actions">
          <Link to="/admin/products" className="btn btn-primary">Add product</Link>
          <Link to="/admin/orders" className="btn btn-outline">View orders</Link>
        </div>
      </div>

      <div className="admin-stat-grid">
        {statCards.map((c) => (
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
          <Link to="/admin/orders">View all →</Link>
        </div>

        {stats.recent_orders.length === 0 ? (
          <div className="admin-empty card">No orders yet.</div>
        ) : (
          <>
            <div className="admin-card-list">
              {stats.recent_orders.map((o) => {
                const u = (o as Order & { user?: { name: string; email: string } }).user;
                return (
                  <article key={o.id} className="card admin-list-card">
                    <div className="admin-list-card-top">
                      <div>
                        <strong>{o.order_number}</strong>
                        <p className="admin-cell-muted">{u?.name ?? '—'} · {u?.email}</p>
                      </div>
                      <div className="admin-list-card-meta">
                        <span className={`admin-badge admin-badge--${o.payment_status}`}>{o.payment_status}</span>
                        <strong>{formatPrice(o.total)}</strong>
                      </div>
                    </div>
                    <div className="admin-list-card-actions">
                      <span className="admin-muted">{o.status}</span>
                      <Link to={`/admin/orders/${o.id}`} className="btn btn-primary">View</Link>
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="table-scroll admin-desktop-table">
              <table className="data-table card">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_orders.map((o) => (
                    <tr key={o.id}>
                      <td><strong>{o.order_number}</strong></td>
                      <td>
                        {(o as Order & { user?: { name: string; email: string } }).user?.name ?? '—'}
                        <span className="admin-cell-muted">
                          {(o as Order & { user?: { email: string } }).user?.email}
                        </span>
                      </td>
                      <td>{formatPrice(o.total)}</td>
                      <td>
                        <span className={`admin-badge admin-badge--${o.payment_status}`}>{o.payment_status}</span>
                      </td>
                      <td>{o.status}</td>
                      <td>{new Date(o.created_at).toLocaleDateString()}</td>
                      <td className="admin-actions-cell">
                        <Link to={`/admin/orders/${o.id}`} className="btn btn-outline">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
