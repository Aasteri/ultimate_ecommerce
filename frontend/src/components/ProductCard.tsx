import { Link } from 'react-router-dom';
import { imageUrl, formatPrice, formatDimensions } from '../api/client';
import type { Product } from '../api/types';

export type ProductCardVariant = 'standard' | 'horizontal' | 'compact' | 'poster' | 'soft' | 'slab' | 'framed' | 'feature';

export default function ProductCard({
  product,
  variant = 'standard',
}: {
  product: Product;
  variant?: ProductCardVariant;
}) {
  const price = product.digital_price ?? product.physical_price ?? 0;
  const className = `card product-card product-card--${variant}`;

  if (variant === 'horizontal') {
    return (
      <Link to={`/product/${product.slug}`} className={className}>
        <div className="product-card-media">
          <img src={imageUrl(product.preview_image)} alt={product.title} />
        </div>
        <div className="product-card-body">
          <div className="product-card-meta">
            {product.shop && <p className="muted-line">{product.shop.name}</p>}
            <h3 className="product-card-title">{product.title}</h3>
            <p className="product-card-price">{formatPrice(price)}</p>
          </div>
          <div className="badge-row">
            {product.formats?.slice(0, 3).map((f) => (
              <span key={f.id} className="badge badge-format">{f.format}</span>
            ))}
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'feature') {
    return (
      <Link to={`/product/${product.slug}`} className={className}>
        <div className="product-card-media">
          <img src={imageUrl(product.preview_image)} alt={product.title} />
        </div>
        <div className="product-card-body">
          <p className="product-card-kicker">Featured</p>
          <h3 className="product-card-title">{product.title}</h3>
          {product.shop && <p className="muted-line">{product.shop.name}</p>}
          <p className="product-card-price">{formatPrice(price)}</p>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/product/${product.slug}`} className={className}>
      <div className="product-card-media">
        <img src={imageUrl(product.preview_image)} alt={product.title} />
      </div>
      <div className="product-card-body">
        <h3 className="product-card-title">{product.title}</h3>
        {product.shop && (
          <p className="muted-line">{product.shop.name}</p>
        )}
        {variant !== 'compact' && variant !== 'poster' && (
          <div className="badge-row">
            {product.formats?.slice(0, 4).map((f) => (
              <span key={f.id} className="badge badge-format">{f.format}</span>
            ))}
          </div>
        )}
        {variant !== 'compact' && !!product.colors?.length && (
          <div className="product-card-colors" aria-label="Colors">
            {product.colors.slice(0, 5).map((c) => (
              <span key={c} className="product-color-dot" title={c} data-color={c.toLowerCase()} />
            ))}
          </div>
        )}
        {variant !== 'compact' && formatDimensions(product.width_mm, product.height_mm) && (
          <p className="muted-line">{formatDimensions(product.width_mm, product.height_mm)}</p>
        )}
        <p className="product-card-price">{formatPrice(price)}</p>
      </div>
    </Link>
  );
}
