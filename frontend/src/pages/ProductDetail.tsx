import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import api, { ensureSessionId, imageUrl, formatPrice, formatDimensions } from '../api/client';
import type { Product } from '../api/types';
import { IntegerInput } from '../components/FormFields';
import BusyButton from '../components/BusyButton';
import { useFeedback } from '../context/FeedbackContext';
import { parseInteger } from '../lib/validation';

export default function ProductDetail() {
  const { slug } = useParams();
  const { success, error: toastError } = useFeedback();
  const [product, setProduct] = useState<Product | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [variant, setVariant] = useState<'digital' | 'physical'>('digital');
  const [quantity, setQuantity] = useState('1');
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState('');
  const [added, setAdded] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    ensureSessionId();
    api.get(`/products/${slug}`).then((r) => {
      setProduct(r.data);
      setActiveIndex(0);
      if (r.data.is_digital_available) setVariant('digital');
      else if (r.data.is_physical_available) setVariant('physical');
    });
  }, [slug]);

  if (!product) return <div className="container page-pad">Loading...</div>;

  const gallery = (product.images && product.images.length > 0)
    ? [...product.images].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)
    : (product.preview_image ? [{ id: 0, path: product.preview_image, sort_order: 0, is_primary: true }] : []);
  const mainSrc = gallery[activeIndex]?.path || product.preview_image;
  const price = variant === 'digital' ? product.digital_price : product.physical_price;
  const maxQty = variant === 'physical' ? Math.max(product.physical_stock, 1) : 500;
  const qty = Math.min(maxQty, Math.max(1, parseInteger(quantity) ?? 1));

  const go = (dir: number) => {
    if (gallery.length < 2) return;
    setActiveIndex((i) => (i + dir + gallery.length) % gallery.length);
  };

  const addToCart = async () => {
    setQuantity(String(qty));
    setAdding(true);
    setMessage('');
    setAdded(false);
    try {
      ensureSessionId();
      await api.post('/cart/add', {
        product_id: product.id,
        variant_type: variant,
        quantity: qty,
      });
      setMessage('Added to cart. Keep shopping or proceed to checkout when ready.');
      setAdded(true);
      success('Added to cart');
    } catch {
      setMessage('Could not add to cart. Please try again.');
      toastError('Could not add to cart');
    }
    setAdding(false);
  };

  return (
    <div className="container page-pad product-detail-page">
      <div className="product-detail-grid">
        <div className="product-detail-gallery">
          <div
            className="card product-detail-media product-detail-slider"
            onTouchStart={(e) => { touchStartX.current = e.changedTouches[0]?.clientX ?? null; }}
            onTouchEnd={(e) => {
              if (touchStartX.current == null) return;
              const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
              if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
              touchStartX.current = null;
            }}
          >
            <img src={imageUrl(mainSrc)} alt={product.title} />
            {gallery.length > 1 && (
              <>
                <button type="button" className="gallery-nav gallery-nav--prev" aria-label="Previous photo" onClick={() => go(-1)}>
                  <ChevronLeft size={20} />
                </button>
                <button type="button" className="gallery-nav gallery-nav--next" aria-label="Next photo" onClick={() => go(1)}>
                  <ChevronRight size={20} />
                </button>
                <div className="gallery-dots">
                  {gallery.map((img, i) => (
                    <button
                      key={img.id || img.path}
                      type="button"
                      className={`gallery-dot${i === activeIndex ? ' is-active' : ''}`}
                      aria-label={`Photo ${i + 1}`}
                      onClick={() => setActiveIndex(i)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="product-gallery-thumbs" role="list">
              {gallery.map((img, i) => (
                <button
                  key={img.id || img.path}
                  type="button"
                  className={`product-gallery-thumb${i === activeIndex ? ' is-active' : ''}`}
                  onClick={() => setActiveIndex(i)}
                  aria-label={`View photo ${i + 1}`}
                >
                  <img src={imageUrl(img.path)} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product-detail-info">
          <h1 className="product-detail-title">{product.title}</h1>
          {product.category && <p className="muted-line">{product.category.name}</p>}
          {product.shop && (
            <p className="muted-line">
              Sold by <Link to={`/shop/${product.shop.slug}`}>{product.shop.name}</Link>
            </p>
          )}

          <div className="badge-row">
            {product.formats?.map((f) => (
              <span key={f.id} className="badge badge-format">{f.format}</span>
            ))}
          </div>

          {!!product.colors?.length && (
            <div className="product-attr-block">
              <p className="label">Colors</p>
              <div className="product-color-list">
                {product.colors.map((c) => (
                  <span key={c} className="product-color-chip" data-color={c.toLowerCase()}>{c}</span>
                ))}
              </div>
            </div>
          )}

          {!!product.features?.length && (
            <div className="product-attr-block">
              <p className="label">Features</p>
              <ul className="product-feature-list">
                {product.features.map((f) => <li key={f}>{f}</li>)}
              </ul>
            </div>
          )}

          {formatDimensions(product.width_mm, product.height_mm) && (
            <p className="muted-line" style={{ marginBottom: 24 }}>
              {formatDimensions(product.width_mm, product.height_mm)}
            </p>
          )}

          <div style={{ marginBottom: 24 }}>
            <p className="label">Choose type</p>
            <div className="variant-row">
              {product.is_digital_available && (
                <button
                  type="button"
                  className={`btn ${variant === 'digital' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => { setVariant('digital'); setAdded(false); }}
                >
                  Digital — {formatPrice(product.digital_price ?? 0)}
                </button>
              )}
              {product.is_physical_available && (
                <button
                  type="button"
                  className={`btn ${variant === 'physical' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => { setVariant('physical'); setAdded(false); }}
                >
                  Physical — {formatPrice(product.physical_price ?? 0)}
                </button>
              )}
            </div>
            {variant === 'digital' && <p className="help-text">Downloadable file after payment.</p>}
            {variant === 'physical' && <p className="help-text">Shipped to you. {product.physical_stock} in stock.</p>}
          </div>

          <p className="product-price">{formatPrice(price ?? 0)}</p>

          <div className="product-actions">
            <IntegerInput
              className="input qty-input"
              value={quantity}
              maxDigits={3}
              onChange={(value) => {
                if (value === '') { setQuantity(''); return; }
                const n = parseInteger(value);
                if (n === null) return;
                setQuantity(String(Math.min(maxQty, n)));
              }}
              onBlur={() => setQuantity(String(qty))}
            />
            <BusyButton type="button" className="btn btn-primary" onClick={addToCart} busy={adding} busyLabel="Adding…">
              Add to cart
            </BusyButton>
          </div>

          {message && <p className={message.includes('Could not') ? 'error-msg' : 'success-msg'}>{message}</p>}

          {added && (
            <div className="product-post-add">
              <Link to="/browse" className="btn btn-outline">Continue shopping</Link>
              <Link to="/cart" className="btn btn-primary">Proceed to checkout</Link>
            </div>
          )}

          {product.description && (
            <div className="product-description">
              <h3>Description</h3>
              <p>{product.description}</p>
            </div>
          )}

          <p className="help-text" style={{ marginTop: 16 }}>
            Digital files include production use. See our <Link to="/page/licensing">licensing</Link> terms.
          </p>
        </div>
      </div>
    </div>
  );
}
