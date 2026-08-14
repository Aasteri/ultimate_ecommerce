import { useEffect, useState } from 'react';
import api, { formatPrice } from '../../api/client';
import type { OrderItem, VendorOrder } from '../../api/types';

export default function VendorOrders() {
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [selected, setSelected] = useState<{ vendor_order: VendorOrder; items: OrderItem[] } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => api.get('/vendor/orders').then((r) => {
    setOrders(r.data.data || r.data);
    setLoading(false);
  });

  useEffect(() => { load().catch(() => setLoading(false)); }, []);

  const open = async (id: number) => {
    const { data } = await api.get(`/vendor/orders/${id}`);
    setSelected(data);
  };

  const fulfill = async (itemId: number, fulfillment_status: string) => {
    if (!selected) return;
    const { data } = await api.put(`/vendor/orders/${selected.vendor_order.id}/fulfillment`, {
      item_id: itemId,
      fulfillment_status,
    });
    setSelected(data);
    load();
  };

  if (loading) return <p className="admin-muted">Loading orders…</p>;

  return (
    <div className="admin-page">
      <h1>Orders</h1>
      <p className="admin-muted" style={{ marginBottom: 24 }}>
        Your share is calculated automatically: 90% of product sales plus shipping for your items.
      </p>
      {selected && (
        <div className="card" style={{ padding: 16, marginBottom: 24 }}>
          <div className="split-row">
            <h3>{selected.vendor_order.vendor_order_number}</h3>
            <button type="button" className="btn btn-ghost" onClick={() => setSelected(null)}>Close</button>
          </div>
          <p className="help-text">
            Subtotal {formatPrice(selected.vendor_order.subtotal)} · Commission {formatPrice(selected.vendor_order.commission_amount)} ({selected.vendor_order.commission_rate}%) · Shipping {formatPrice(selected.vendor_order.shipping_cost)} · You receive {formatPrice(selected.vendor_order.vendor_amount)}
          </p>
          {selected.items.map((item) => (
            <div key={item.id} className="split-row" style={{ padding: '8px 0', borderTop: '1px solid var(--border)' }}>
              <div>
                <strong>{item.product_title}</strong>
                <p className="help-text">{item.variant_type} × {item.quantity}</p>
              </div>
              {item.variant_type === 'physical' ? (
                <select className="input" value={item.fulfillment_status} onChange={(e) => fulfill(item.id, e.target.value)} style={{ maxWidth: 160 }}>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                </select>
              ) : (
                <span className="help-text">Digital</span>
              )}
            </div>
          ))}
        </div>
      )}
      {orders.length === 0 ? (
        <div className="admin-empty card">No orders yet.</div>
      ) : (
        <div className="table-scroll">
        <table className="data-table card">
          <thead>
            <tr><th>Order</th><th>Customer order</th><th>Your payout</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>{o.vendor_order_number}</td>
                <td>{o.order?.order_number}</td>
                <td>{formatPrice(o.vendor_amount)}</td>
                <td>{o.status}</td>
                <td><button type="button" className="btn btn-ghost" onClick={() => open(o.id)}>View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
