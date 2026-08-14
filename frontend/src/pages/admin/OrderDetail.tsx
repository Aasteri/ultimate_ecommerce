import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api, { formatPrice } from '../../api/client';
import type { Order } from '../../api/types';
import { useFeedback } from '../../context/FeedbackContext';

type OrderDetail = Order & {
  user?: { name: string; email: string; phone?: string | null };
  notes?: string | null;
  payment_reference?: string | null;
};

export default function AdminOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: toastError } = useFeedback();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () =>
    api.get(`/admin/orders/${id}`)
      .then((r) => setOrder(r.data))
      .catch(() => {
        toastError('Order not found');
        navigate('/admin/orders');
      })
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, [id]);

  const updateFulfillment = async (itemId: number, status: string) => {
    try {
      await api.put(`/admin/orders/${id}/fulfillment`, { item_id: itemId, fulfillment_status: status });
      success('Fulfillment updated');
      load();
    } catch {
      toastError('Could not update fulfillment');
    }
  };

  const updateOrderStatus = async (status: string) => {
    try {
      await api.put(`/admin/orders/${id}/status`, { status });
      success('Order status updated');
      load();
    } catch {
      toastError('Could not update status');
    }
  };

  if (loading) return <p className="admin-muted">Loading order…</p>;
  if (!order) return null;

  const address = order.shipping_address || {};

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <Link to="/admin/orders" className="admin-back-link">← All orders</Link>
          <h1>{order.order_number}</h1>
          <p className="admin-muted">{new Date(order.created_at).toLocaleString()}</p>
        </div>
        <div className="admin-quick-actions">
          <select
            className="input"
            value={order.status}
            onChange={(e) => updateOrderStatus(e.target.value)}
          >
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="admin-detail-grid">
        <section className="card admin-form-card">
          <h3>Customer</h3>
          <p><strong>{order.user?.name ?? '—'}</strong></p>
          <p className="admin-muted">{order.user?.email}</p>
          {order.user?.phone && <p className="admin-muted">{order.user.phone}</p>}
        </section>

        <section className="card admin-form-card">
          <h3>Payment</h3>
          <p>
            <span className={`admin-badge admin-badge--${order.payment_status}`}>{order.payment_status}</span>
          </p>
          <p className="muted-line">Subtotal: {formatPrice(order.subtotal)}</p>
          {(order.discount_amount ?? 0) > 0 && (
            <p className="muted-line">Discount: −{formatPrice(order.discount_amount ?? 0)}</p>
          )}
          <p className="muted-line">Shipping: {formatPrice(order.shipping_cost)}</p>
          <p><strong>Total: {formatPrice(order.total)}</strong></p>
          {order.payment_reference && (
            <p className="help-text">Ref: {order.payment_reference}</p>
          )}
        </section>

        {Object.keys(address).length > 0 && (
          <section className="card admin-form-card">
            <h3>Shipping</h3>
            {order.shipping_discussion_needed && (
              <p className="admin-badge admin-badge--pending" style={{ marginBottom: 8 }}>Discuss shipping</p>
            )}
            <p>{address.name}</p>
            <p className="muted-line">{address.phone}</p>
            <p className="muted-line">{address.street}</p>
            <p className="muted-line">{[address.city, address.state, address.country].filter(Boolean).join(', ')}</p>
            {address.lagos_area && <p className="muted-line">Lagos area: {address.lagos_area}</p>}
          </section>
        )}
      </div>

      <section className="card admin-form-card" style={{ marginTop: 16 }}>
        <h3>Items</h3>
        <div className="admin-order-items">
          {order.items?.map((item) => (
            <div key={item.id} className="admin-order-item-row">
              <div>
                <strong>{item.product_title}</strong>
                <p className="admin-cell-muted">
                  {item.variant_type} × {item.quantity} · {formatPrice(item.total_price)}
                </p>
              </div>
              {item.variant_type === 'physical' ? (
                <select
                  className="input admin-inline-select"
                  value={item.fulfillment_status || 'pending'}
                  onChange={(e) => updateFulfillment(item.id, e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                </select>
              ) : (
                <span className="admin-badge admin-badge--published">Digital</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {order.notes && (
        <section className="card admin-form-card" style={{ marginTop: 16 }}>
          <h3>Notes</h3>
          <p>{order.notes}</p>
        </section>
      )}
    </div>
  );
}
