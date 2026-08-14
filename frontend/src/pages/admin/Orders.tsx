import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { formatPrice } from '../../api/client';
import type { Order } from '../../api/types';

type OrderWithUser = Order & { user?: { name: string; email: string } };

export default function AdminOrders() {
  const [orders, setOrders] = useState<OrderWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ payment_status: '', status: '' });

  const load = () => {
    const params = new URLSearchParams();
    if (filter.payment_status) params.set('payment_status', filter.payment_status);
    if (filter.status) params.set('status', filter.status);
    const qs = params.toString();
    return api.get(`/admin/orders${qs ? `?${qs}` : ''}`).then((r) => {
      setOrders(r.data.data || r.data);
      setLoading(false);
    });
  };

  useEffect(() => { load().catch(() => setLoading(false)); }, [filter]);

  const updateOrderStatus = async (orderId: number, status: string) => {
    await api.put(`/admin/orders/${orderId}/status`, { status });
    load();
  };

  if (loading) return <p className="admin-muted">Loading orders…</p>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Orders</h1>
          <p className="admin-muted">{orders.length} orders shown</p>
        </div>
        <div className="admin-filters">
          <select className="input" value={filter.payment_status} onChange={(e) => setFilter({ ...filter, payment_status: e.target.value })}>
            <option value="">All payments</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <select className="input" value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="admin-empty card">No orders match your filters.</div>
      ) : (
        <>
          <div className="admin-card-list">
            {orders.map((o) => (
              <article key={o.id} className="card admin-list-card">
                <div className="admin-list-card-top">
                  <div>
                    <strong>{o.order_number}</strong>
                    <p className="admin-cell-muted">{o.user?.name ?? '—'} · {o.user?.email}</p>
                    <p className="admin-cell-muted">{new Date(o.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="admin-list-card-meta">
                    <span className={`admin-badge admin-badge--${o.payment_status}`}>{o.payment_status}</span>
                    <strong>{formatPrice(o.total)}</strong>
                  </div>
                </div>
                {o.shipping_discussion_needed && (
                  <span className="admin-badge admin-badge--pending">discuss shipping</span>
                )}
                <div className="admin-list-card-actions">
                  <select
                    className="input"
                    value={o.status}
                    onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <Link to={`/admin/orders/${o.id}`} className="btn btn-primary">View</Link>
                </div>
              </article>
            ))}
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
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <strong>{o.order_number}</strong>
                      {o.shipping_discussion_needed && (
                        <span className="admin-badge admin-badge--pending" style={{ display: 'block', marginTop: 4 }}>
                          discuss shipping
                        </span>
                      )}
                    </td>
                    <td>
                      {o.user?.name ?? '—'}
                      <span className="admin-cell-muted">{o.user?.email}</span>
                    </td>
                    <td>{formatPrice(o.total)}</td>
                    <td><span className={`admin-badge admin-badge--${o.payment_status}`}>{o.payment_status}</span></td>
                    <td>
                      <select
                        className="input admin-inline-select"
                        value={o.status}
                        onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
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
    </div>
  );
}
