import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { formatPrice } from '../../api/client';
import type { Order } from '../../api/types';

export default function AccountOrders() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    api.get('/orders').then((r) => setOrders(r.data.data || r.data));
  }, []);

  return (
    <div className="admin-page">
      <h1>Orders</h1>
      <p className="admin-muted" style={{ marginBottom: 24 }}>Your purchases on The Tailors Market.</p>
      {orders.length === 0 ? (
        <div className="admin-empty card">
          No orders yet. <Link to="/browse">Browse products</Link>
        </div>
      ) : (
        <div className="table-scroll">
        <table className="data-table card">
          <thead>
            <tr><th>Order</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th></tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>{o.order_number}</td>
                <td>{formatPrice(o.total)}</td>
                <td>{o.payment_status}</td>
                <td>{o.status}</td>
                <td>{new Date(o.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
