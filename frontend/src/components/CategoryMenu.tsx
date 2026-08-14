import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import api from '../api/client';
import type { Category } from '../api/types';

export default function CategoryMenu({ onNavigate }: { onNavigate?: () => void }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data));
  }, []);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const go = () => {
    setOpen(false);
    onNavigate?.();
  };

  return (
    <div ref={ref} className="category-menu">
      <button
        type="button"
        className="btn btn-ghost category-menu-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        Categories <ChevronDown size={14} />
      </button>

      {open && (
        <div className="card category-menu-panel">
          <Link
            to="/browse"
            className="nav-dropdown-item"
            onClick={go}
            style={{ fontWeight: 600, color: 'var(--primary)' }}
          >
            All products
          </Link>
          {categories.map((cat) => (
            <div key={cat.id}>
              <Link
                to={`/browse?category=${cat.slug}`}
                className="nav-dropdown-item"
                onClick={go}
              >
                {cat.name}
                {cat.published_products_count != null && (
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    {cat.published_products_count}
                  </span>
                )}
              </Link>
              {cat.children?.map((child) => (
                <Link
                  key={child.id}
                  to={`/browse?category=${child.slug}`}
                  className="nav-dropdown-item nav-dropdown-child"
                  onClick={go}
                >
                  {child.name}
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
