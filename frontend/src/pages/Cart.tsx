import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { ensureSessionId, imageUrl, formatPrice } from '../api/client';
import type { Cart } from '../api/types';
import BusyButton from '../components/BusyButton';
import { useAuth } from '../context/AuthContext';
import { useFeedback } from '../context/FeedbackContext';

export default function CartPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useFeedback();
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = () => {
    ensureSessionId();
    return api.get('/cart').then((r) => setCart(r.data)).catch(() => setCart({ id: 0, items: [], subtotal: 0, item_count: 0 }));
  };

  useEffect(() => { load(); }, []);

  const updateQty = async (id: number, quantity: number) => {
    if (quantity < 1) return;
    setBusyId(id);
    try {
      await api.put(`/cart/items/${id}`, { quantity });
      await load();
    } catch {
      toastError('Could not update quantity');
    }
    setBusyId(null);
  };

  const remove = async (id: number) => {
    setBusyId(id);
    try {
      await api.delete(`/cart/items/${id}`);
      await load();
      success('Item removed');
    } catch {
      toastError('Could not remove item');
    }
    setBusyId(null);
  };

  const goCheckout = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  if (!cart) return <div className="container page-pad">Loading...</div>;

  if (cart.items.length === 0) {
    return (
      <div className="container page-pad empty-state">
        <h2>Your cart is empty</h2>
        <Link to="/browse" className="btn btn-primary" style={{ marginTop: 16 }}>Browse products</Link>
      </div>
    );
  }

  return (
    <div className="container page-pad cart-page">
      <h1 className="section-title">Your cart</h1>

      <div className="card cart-list">
        {cart.items.map((item) => (
          <div key={item.id} className="cart-row">
            <img src={imageUrl(item.preview_image)} alt="" className="cart-thumb" />
            <div className="cart-row-main">
              <Link to={`/product/${item.slug}`} className="cart-title">{item.title}</Link>
              {item.shop && (
                <p className="help-text" style={{ margin: '4px 0 0' }}>
                  Sold by <Link to={`/shop/${item.shop.slug}`}>{item.shop.name}</Link>
                </p>
              )}
              <div className="cart-meta">
                <span className={`badge ${item.variant_type === 'digital' ? 'badge-digital' : 'badge-physical'}`}>
                  {item.variant_type}
                </span>
                <div className="cart-qty">
                  <button type="button" className="btn btn-outline qty-btn" disabled={busyId === item.id} onClick={() => updateQty(item.id, item.quantity - 1)}>−</button>
                  <span>{item.quantity}</span>
                  <button type="button" className="btn btn-outline qty-btn" disabled={busyId === item.id} onClick={() => updateQty(item.id, item.quantity + 1)}>+</button>
                </div>
              </div>
            </div>
            <div className="cart-row-side">
              <p className="cart-line-total">{formatPrice(item.line_total)}</p>
              <BusyButton type="button" className="btn btn-ghost" busy={busyId === item.id} busyLabel="Updating…" onClick={() => remove(item.id)}>
                Remove
              </BusyButton>
            </div>
          </div>
        ))}
        <div className="cart-subtotal">
          <span>Subtotal</span>
          <span>{formatPrice(cart.subtotal)}</span>
        </div>
      </div>

      <div className="cart-actions">
        <Link to="/browse" className="btn btn-outline">Continue shopping</Link>
        <button type="button" className="btn btn-primary" onClick={goCheckout}>
          Proceed to checkout
        </button>
      </div>
      {!user && (
        <p className="help-text" style={{ marginTop: 12, textAlign: 'center' }}>
          Sign in at checkout to complete your order.
        </p>
      )}
    </div>
  );
}
