import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { formatPrice, imageUrl } from '../api/client';
import { openFlutterwaveCheckout } from '../lib/flutterwave';
import type { Cart } from '../api/types';
import { useAuth } from '../context/AuthContext';
import type { ShippingAddress } from '../components/ShippingAddressFields';
import BusyButton from '../components/BusyButton';
import { useFeedback } from '../context/FeedbackContext';
import { sanitizeCouponCode, validateMinLength, validatePersonName, validatePhone } from '../lib/validation';

const ShippingAddressFields = lazy(() => import('../components/ShippingAddressFields'));

interface PaymentConfig {
  method?: 'v3_inline' | 'v4_redirect';
  public_key?: string;
  checkout_url?: string;
  tx_ref: string;
  amount: number;
  currency: string;
  redirect_url: string;
  payment_options?: string;
  customer: { email: string; name: string; phone_number?: string };
  customizations?: { title: string; description: string };
  is_test: boolean;
  use_simulate: boolean;
}

interface Quote {
  shipping_cost: number;
  base_rate: number;
  extra_blocks: number;
  needs_discussion: boolean;
  is_nigeria: boolean;
  label: string;
  shops?: Array<{ shop_id: number | null; shop_name: string; quantity: number; shipping_cost: number }>;
}

const emptyAddress: ShippingAddress = {
  name: '',
  phone: '',
  street: '',
  city: '',
  state: '',
  country: '',
  country_code: '',
  state_code: '',
  lagos_area: '',
};

export default function Checkout() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const { success, error: toastError, info } = useFeedback();
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart | null>(null);
  const [address, setAddress] = useState<ShippingAddress>(emptyAddress);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);
  const [useSimulate, setUseSimulate] = useState(false);
  const [testingInfo, setTestingInfo] = useState<{
    docs_url: string;
    note: string;
    test_cards: Array<{ label: string; number: string; cvv: string; expiry: string; pin?: string; otp?: string }>;
  } | null>(null);
  const [pendingOrderNumber, setPendingOrderNumber] = useState<string | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponLabel, setCouponLabel] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponBusy, setCouponBusy] = useState(false);

  const hasPhysical = cart?.items.some((i) => i.variant_type === 'physical') ?? false;
  const physicalQty = useMemo(
    () => cart?.items.filter((i) => i.variant_type === 'physical').reduce((sum, i) => sum + i.quantity, 0) ?? 0,
    [cart],
  );

  const loadCart = useCallback(() => {
    return api.get('/cart').then((r) => setCart(r.data));
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login'); return; }
    setAddress((prev) => ({ ...prev, name: prev.name || user.name }));
    loadCart();
    api.get('/checkout/config').then((r) => {
      setIsTestMode(r.data.is_test);
      setUseSimulate(r.data.use_simulate);
      if (r.data.testing) setTestingInfo(r.data.testing);
    }).catch(() => {});
  }, [user, authLoading, navigate, loadCart]);

  // Refresh cart when returning from browsing more products
  useEffect(() => {
    const onFocus = () => { if (!pendingOrderNumber) loadCart(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') onFocus();
    });
    return () => window.removeEventListener('focus', onFocus);
  }, [loadCart, pendingOrderNumber]);

  useEffect(() => {
    if (!hasPhysical || !address.country || !address.state) {
      setQuote(null);
      return;
    }
    if (address.country_code === 'NG' && address.state.toLowerCase() === 'lagos' && !address.lagos_area) {
      setQuote(null);
      return;
    }

    const timer = setTimeout(() => {
      setQuoting(true);
      api.post('/shipping/quote', {
        country: address.country,
        state: address.state,
        lagos_area: address.lagos_area || null,
        quantity: physicalQty,
      })
        .then((r) => setQuote(r.data))
        .catch(() => setQuote(null))
        .finally(() => setQuoting(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [hasPhysical, address.country, address.state, address.lagos_area, address.country_code, physicalQty]);

  const subtotal = Number(cart?.subtotal ?? 0);
  const shippingCost = hasPhysical && quote && !quote.needs_discussion ? Number(quote.shipping_cost) : 0;
  const total = Math.max(0, subtotal - couponDiscount + shippingCost);

  useEffect(() => {
    setCouponDiscount(0);
    setCouponLabel('');
    setCouponError('');
  }, [subtotal]);
  const shippingReady = !hasPhysical || (
    !!address.name &&
    !!address.phone &&
    !!address.street &&
    !!address.city &&
    !!address.state &&
    !!address.country &&
    !(address.country_code === 'NG' && address.state.toLowerCase() === 'lagos' && !address.lagos_area) &&
    quote !== null
  );

  const updateQty = async (id: number, quantity: number) => {
    if (quantity < 1 || pendingOrderNumber) return;
    const { data } = await api.put(`/cart/items/${id}`, { quantity });
    setCart(data);
  };

  const removeItem = async (id: number) => {
    if (pendingOrderNumber) return;
    const { data } = await api.delete(`/cart/items/${id}`);
    setCart(data);
  };

  const buildPayload = () => {
    const payload: Record<string, unknown> = { notes };
    if (couponLabel) payload.coupon_code = couponCode;
    if (hasPhysical) {
      payload.shipping_address = {
        name: address.name,
        phone: address.phone,
        street: address.street,
        city: address.city,
        state: address.state,
        country: address.country,
        lagos_area: address.lagos_area || null,
      };
    }
    return payload;
  };

  const initiateOrder = async (): Promise<PaymentConfig> => {
    const { data } = await api.post('/checkout/initiate', buildPayload());
    setPendingOrderNumber(data.order.order_number);
    // Keep current cart visible until payment finishes; backend already cleared it
    return data.payment as PaymentConfig;
  };

  const assertShipping = (): boolean => {
    if (hasPhysical) {
      const shippingError = validatePersonName(address.name, 'Full name')
        || validatePhone(address.phone, { required: true })
        || validateMinLength(address.street, 'Street address', 5)
        || (!shippingReady ? 'Please complete your shipping details.' : null);
      if (shippingError) {
        setError(shippingError);
        toastError(shippingError);
        return false;
      }
      return true;
    }
    if (!shippingReady) {
      setError('Please complete your shipping details.');
      toastError('Please complete your shipping details.');
      return false;
    }
    return true;
  };

  const payWithFlutterwave = async () => {
    setError('');
    if (!assertShipping()) return;
    setLoading(true);
    info('Preparing payment…');
    try {
      const payment = await initiateOrder();

      if (payment.use_simulate) {
        const msg = 'Demo Flutterwave keys cannot open the payment modal. Use "Simulate test payment" below, or add your own test keys in Admin → Settings.';
        setError(msg);
        toastError(msg);
        setLoading(false);
        return;
      }

      // Live (v4): redirect to Flutterwave hosted checkout
      if (payment.method === 'v4_redirect' || payment.checkout_url) {
        if (!payment.checkout_url) {
          throw new Error('Flutterwave checkout URL was not returned. Check live Client ID / Secret in Admin → Settings.');
        }
        info('Redirecting to Flutterwave…');
        window.location.assign(payment.checkout_url);
        return;
      }

      // Test (v3): inline modal
      if (!payment.public_key) {
        throw new Error('Flutterwave test public key is missing.');
      }

      await openFlutterwaveCheckout({
        public_key: payment.public_key,
        tx_ref: payment.tx_ref,
        amount: payment.amount,
        currency: payment.currency,
        payment_options: payment.payment_options,
        redirect_url: payment.redirect_url,
        customer: payment.customer,
        customizations: payment.customizations,
        callback: async (response) => {
          if (response.status === 'successful') {
            try {
              await api.post('/checkout/verify', { transaction_id: response.transaction_id });
              await refreshUser();
              success('Payment successful');
              navigate(`/checkout/callback?status=successful&transaction_id=${response.transaction_id}`);
            } catch {
              setError('Payment received but verification failed. Contact support.');
              toastError('Payment received but verification failed. Contact support.');
            }
          }
        },
        onclose: () => setLoading(false),
      }, payment.is_test);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      const msg = err.response?.data?.message || err.message || 'Checkout failed';
      setError(msg);
      toastError(msg);
      setLoading(false);
      loadCart();
      setPendingOrderNumber(null);
    }
  };

  const simulatePayment = async () => {
    setError('');
    if (!assertShipping()) return;
    setLoading(true);
    try {
      let orderNumber = pendingOrderNumber;
      if (!orderNumber) {
        const payment = await initiateOrder();
        orderNumber = payment.tx_ref;
      }
      await api.post('/checkout/simulate', { order_number: orderNumber });
      success('Test payment completed');
      navigate('/checkout/callback?status=simulated');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      const msg = err.response?.data?.message || 'Simulation failed';
      setError(msg);
      toastError(msg);
      loadCart();
      setPendingOrderNumber(null);
    }
    setLoading(false);
  };

  if (!cart) return <div className="container page-pad">Loading...</div>;

  if (cart.items.length === 0 && !pendingOrderNumber) {
    return (
      <div className="container page-pad empty-state">
        <h2>Your cart is empty</h2>
        <Link to="/browse" className="btn btn-primary" style={{ marginTop: 16 }}>Browse products</Link>
      </div>
    );
  }

  return (
    <div className="container page-pad checkout-layout">
      <div className="checkout-main">
        <div className="checkout-main-header">
          <h1 className="section-title" style={{ marginBottom: 0 }}>Checkout</h1>
          {!pendingOrderNumber && (
            <Link to="/browse" className="btn btn-outline">
              + Add more items
            </Link>
          )}
        </div>

        <div className="card checkout-items-card">
          <h3>Your items</h3>
          {cart.items.map((item) => (
            <div key={item.id} className="checkout-item-row">
              <img src={imageUrl(item.preview_image)} alt="" className="checkout-item-thumb" />
              <div className="checkout-item-info">
                <Link to={`/product/${item.slug}`} className="cart-title">{item.title}</Link>
                {item.shop && (
                  <p className="help-text" style={{ margin: '4px 0 0' }}>
                    {item.shop.name}
                  </p>
                )}
                <div className="cart-meta">
                  <span className={`badge ${item.variant_type === 'digital' ? 'badge-digital' : 'badge-physical'}`}>
                    {item.variant_type}
                  </span>
                  {!pendingOrderNumber && (
                    <div className="cart-qty">
                      <button type="button" className="btn btn-outline qty-btn" onClick={() => updateQty(item.id, item.quantity - 1)}>−</button>
                      <span>{item.quantity}</span>
                      <button type="button" className="btn btn-outline qty-btn" onClick={() => updateQty(item.id, item.quantity + 1)}>+</button>
                    </div>
                  )}
                  {pendingOrderNumber && <span className="help-text">Qty: {item.quantity}</span>}
                </div>
              </div>
              <div className="checkout-item-side">
                <strong>{formatPrice(item.line_total)}</strong>
                {!pendingOrderNumber && (
                  <button type="button" className="btn btn-ghost" onClick={() => removeItem(item.id)}>Remove</button>
                )}
              </div>
            </div>
          ))}
          {!pendingOrderNumber && (
            <Link to="/browse" className="btn btn-outline checkout-add-more">
              + Add more items
            </Link>
          )}
        </div>

        {hasPhysical && (
          <div className="card checkout-shipping">
            <h3>Shipping details</h3>
            <p className="help-text" style={{ marginBottom: 16 }}>
              Required for physical items. Nigeria shipping is calculated from your destination and quantity.
            </p>
            <Suspense fallback={<p className="help-text">Loading location lists…</p>}>
              <ShippingAddressFields value={address} onChange={setAddress} />
            </Suspense>
            {quote?.needs_discussion && (
              <div className="notice-card notice-warn">
                International shipping will be discussed with sales after you pay for the products.
                Admin will be notified automatically.
              </div>
            )}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label className="label">Order notes (optional)</label>
          <textarea className="input" rows={3} maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {useSimulate && (
          <div className="card notice-card notice-warn" style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Local test simulation</p>
            <p className="help-text" style={{ marginBottom: 12 }}>
              {testingInfo?.note ?? 'Demo keys cannot open the Flutterwave payment modal.'}
            </p>
            <BusyButton className="btn btn-primary" onClick={simulatePayment} busy={loading} disabled={!shippingReady} busyLabel="Processing…" style={{ width: '100%' }}>
              Simulate test payment
            </BusyButton>
          </div>
        )}

        {isTestMode && !useSimulate && testingInfo && (
          <div className="card notice-card notice-ok" style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Flutterwave test mode</p>
            <p className="help-text" style={{ marginBottom: 12 }}>{testingInfo.note}</p>
            {testingInfo.test_cards.map((card) => (
              <div key={card.label} className="help-text" style={{ marginBottom: 8 }}>
                <strong>{card.label}:</strong> {card.number} · CVV {card.cvv} · Exp {card.expiry}
                {card.pin && ` · PIN ${card.pin}`}{card.otp && ` · OTP ${card.otp}`}
              </div>
            ))}
          </div>
        )}

        {error && <p className="error-msg" style={{ marginBottom: 12 }}>{error}</p>}

        {!useSimulate && (
          <BusyButton
            className="btn btn-primary checkout-pay-btn"
            onClick={payWithFlutterwave}
            busy={loading}
            disabled={!shippingReady || cart.items.length === 0}
            busyLabel="Opening payment…"
          >
            {`Pay ${formatPrice(total)} with Flutterwave`}
          </BusyButton>
        )}
      </div>

      <aside className="checkout-sidebar">
        <div className="card checkout-summary sticky-summary">
          <h3>Order summary</h3>

          <div className="checkout-summary-items">
            {cart.items.map((item) => (
              <div key={item.id} className="checkout-line">
                <span>{item.title} × {item.quantity}</span>
                <span>{formatPrice(item.line_total)}</span>
              </div>
            ))}
          </div>

          <div className="checkout-totals">
            <div className="checkout-line">
              <span>Items subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>

            <div style={{ margin: '12px 0' }}>
              <label className="label">Coupon</label>
              <div className="form-toolbar" style={{ marginBottom: 0 }}>
                <input className="input" value={couponCode} maxLength={32} onChange={(e) => setCouponCode(sanitizeCouponCode(e.target.value))} placeholder="CODE" disabled={!!pendingOrderNumber} />
                <BusyButton
                  type="button"
                  className="btn btn-outline"
                  busy={couponBusy}
                  disabled={!!pendingOrderNumber}
                  busyLabel="Applying…"
                  onClick={async () => {
                    setCouponError('');
                    if (couponCode.length < 3) {
                      setCouponError('Enter a valid coupon code.');
                      return;
                    }
                    setCouponBusy(true);
                    try {
                      const { data } = await api.post('/checkout/coupon', { code: couponCode, subtotal });
                      setCouponDiscount(Number(data.discount));
                      setCouponLabel(data.code);
                      success(`Coupon ${data.code} applied`);
                    } catch (err: unknown) {
                      setCouponDiscount(0);
                      setCouponLabel('');
                      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Invalid coupon';
                      setCouponError(msg);
                      toastError(msg);
                    }
                    setCouponBusy(false);
                  }}
                >
                  Apply
                </BusyButton>
              </div>
              {couponError && <p className="error-msg">{couponError}</p>}
              {couponLabel && (
                <div className="checkout-line" style={{ marginTop: 8 }}>
                  <span>Coupon {couponLabel}</span>
                  <span>−{formatPrice(couponDiscount)}</span>
                </div>
              )}
            </div>

            {hasPhysical && (
              <div className="shipping-fee-box">
                <div className="checkout-line">
                  <span>Shipping fee</span>
                  <span>
                    {quoting
                      ? 'Calculating…'
                      : !quote
                        ? 'Enter address'
                        : quote.needs_discussion
                          ? 'Discuss with sales'
                          : formatPrice(shippingCost)}
                  </span>
                </div>
                {quote && !quote.needs_discussion && (
                  <p className="shipping-fee-note">
                    {quote.shops && quote.shops.length > 1
                      ? quote.shops.map((s) => `${s.shop_name}: ${formatPrice(s.shipping_cost)}`).join(' · ')
                      : quote.label}
                    {quote.extra_blocks > 0
                      ? ` · extra blocks ${quote.extra_blocks}×₦1,000`
                      : quote.shops && quote.shops.length > 1
                        ? ''
                        : ` · base rate for ${physicalQty} piece${physicalQty === 1 ? '' : 's'}`}
                  </p>
                )}
                {quote?.needs_discussion && (
                  <p className="shipping-fee-note">
                    Product total is payable now. Shipping cost will be agreed with sales.
                  </p>
                )}
              </div>
            )}

            <div className="checkout-line checkout-total">
              <span>Order total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          {!pendingOrderNumber && (
            <Link to="/browse" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>
              + Add more items
            </Link>
          )}
        </div>
      </aside>
    </div>
  );
}
