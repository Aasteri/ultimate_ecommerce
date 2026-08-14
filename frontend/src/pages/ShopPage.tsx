import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api, { imageUrl } from '../api/client';
import ProductCard from '../components/ProductCard';
import type { Product, Shop } from '../api/types';

export default function ShopPage() {
  const { slug } = useParams();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/shops/${slug}`)
      .then((r) => {
        setShop(r.data.shop);
        setProducts(r.data.products?.data || r.data.products || []);
      })
      .catch(() => setError('Shop not found'));
  }, [slug]);

  if (error) return <div className="container page-pad"><p className="error-msg">{error}</p></div>;
  if (!shop) return <div className="container page-pad">Loading…</div>;

  return (
    <div className="container page-pad">
      <div className="card shop-header">
        <img src={imageUrl(shop.logo)} alt="" className="shop-header-logo" />
        <div className="shop-header-text">
          <h1 className="section-title" style={{ marginBottom: 8 }}>{shop.name}</h1>
          {shop.bio && <p className="help-text">{shop.bio}</p>}
        </div>
      </div>
      {products.length === 0 ? (
        <p className="help-text">This shop has no published products yet.</p>
      ) : (
        <div className="grid-products">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
