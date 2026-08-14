import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import ProductCard from '../components/ProductCard';
import type { Product } from '../api/types';

export default function Browse() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(params.get('search') || '');
  const [color, setColor] = useState(params.get('color') || '');
  const [offer, setOffer] = useState(params.get('offer') || '');
  const [colors, setColors] = useState<string[]>([]);

  useEffect(() => {
    api.get('/products/filters').then((r) => setColors(r.data.colors || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const query = new URLSearchParams();
    if (params.get('category')) query.set('category', params.get('category')!);
    if (params.get('new_arrivals')) query.set('new_arrivals', '1');
    if (params.get('sort')) query.set('sort', params.get('sort')!);
    if (search) query.set('search', search);
    if (color) query.set('color', color);
    if (offer) query.set('offer', offer);

    api.get(`/products?${query}`).then((r) => {
      setProducts(r.data.data || r.data);
      setLoading(false);
    });
  }, [params, search, color, offer]);

  const setParam = (key: string, value: string) => {
    const p = new URLSearchParams(params);
    if (value) p.set(key, value);
    else p.delete(key);
    setParams(p);
  };

  return (
    <div className="container page-pad">
      <h1 className="section-title">Browse products</h1>

      <div className="browse-toolbar">
        <input
          className="input"
          placeholder="Search products, features…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input" value={offer} onChange={(e) => setOffer(e.target.value)}>
          <option value="">All types</option>
          <option value="digital">Digital</option>
          <option value="physical">Physical</option>
          <option value="both">Digital + Physical</option>
        </select>
        <select className="input" value={color} onChange={(e) => setColor(e.target.value)}>
          <option value="">All colors</option>
          {colors.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          className="input"
          value={params.get('sort') || 'newest'}
          onChange={(e) => setParam('sort', e.target.value)}
        >
          <option value="newest">Newest</option>
          <option value="popular">Popular</option>
          <option value="price_low">Price: Low</option>
          <option value="price_high">Price: High</option>
        </select>
      </div>

      {(params.get('category') || params.get('new_arrivals') || color || offer || search) && (
        <p className="help-text" style={{ marginBottom: 16 }}>
          {params.get('category') && <>Category filter on · </>}
          {params.get('new_arrivals') && <>New arrivals · </>}
          {offer && <>Type: {offer} · </>}
          {color && <>Color: {color} · </>}
          <button type="button" className="btn btn-ghost" onClick={() => {
            setSearch('');
            setColor('');
            setOffer('');
            setParams(new URLSearchParams());
          }}>Clear filters</button>
        </p>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : products.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No products found.</p>
      ) : (
        <div className="grid-products">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
