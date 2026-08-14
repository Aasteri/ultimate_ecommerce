import { Link } from 'react-router-dom';
import type { Category } from '../api/types';

export type CategoryStyle = 'grid' | 'chips' | 'bento' | 'rail' | 'pills' | 'mosaic' | 'list' | 'ribbon';

const ACCENTS = [
  '#2d5a4a', '#c4a77d', '#5b7c99', '#8b5a6b',
  '#6b8e4e', '#7a6344', '#4a6fa5', '#9b6b4f',
  '#3d6b5a', '#a67c52', '#5c6b7a', '#6d4c5e',
];

export default function CategoryShowcase({
  categories,
  style = 'grid',
}: {
  categories: Category[];
  style?: CategoryStyle;
}) {
  if (style === 'chips' || style === 'pills') {
    return (
      <div className={`category-showcase category-showcase--${style}`}>
        {categories.map((cat) => (
          <Link key={cat.id} to={`/browse?category=${cat.slug}`} className="category-chip">
            <span>{cat.name}</span>
            <em>{cat.published_products_count ?? 0}</em>
          </Link>
        ))}
      </div>
    );
  }

  if (style === 'list') {
    return (
      <div className="category-showcase category-showcase--list">
        {categories.map((cat, i) => (
          <Link key={cat.id} to={`/browse?category=${cat.slug}`} className="category-list-item">
            <span className="category-list-index">{String(i + 1).padStart(2, '0')}</span>
            <span className="category-list-name">{cat.name}</span>
            <span className="category-list-count">{cat.published_products_count ?? 0}</span>
          </Link>
        ))}
      </div>
    );
  }

  if (style === 'rail' || style === 'ribbon') {
    return (
      <div className={`category-showcase category-showcase--${style}`}>
        {categories.map((cat) => (
          <Link key={cat.id} to={`/browse?category=${cat.slug}`} className="category-rail-item">
            <strong>{cat.name}</strong>
            <span>{cat.published_products_count ?? 0} products</span>
          </Link>
        ))}
      </div>
    );
  }

  if (style === 'bento' || style === 'mosaic') {
    return (
      <div className={`category-showcase category-showcase--${style}`}>
        {categories.map((cat, i) => (
          <Link
            key={cat.id}
            to={`/browse?category=${cat.slug}`}
            className={`category-bento-item${i === 0 ? ' is-feature' : ''}`}
            style={{ '--cat-accent': ACCENTS[i % ACCENTS.length] } as React.CSSProperties}
          >
            <span className="category-bento-accent" />
            <h3>{cat.name}</h3>
            <p>{cat.published_products_count ?? 0} products</p>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="category-grid category-showcase category-showcase--grid">
      {categories.map((cat, i) => (
        <Link
          key={cat.id}
          to={`/browse?category=${cat.slug}`}
          className="category-card"
          style={{ '--cat-accent': ACCENTS[i % ACCENTS.length] } as React.CSSProperties}
        >
          <div className="category-card-accent" />
          <h3 className="category-card-title">{cat.name}</h3>
          <p className="category-card-count">
            {cat.published_products_count ?? 0} products
          </p>
          {cat.children && cat.children.length > 0 && (
            <p className="category-card-children">
              {cat.children.slice(0, 3).map((c) => c.name).join(' · ')}
              {cat.children.length > 3 ? ' …' : ''}
            </p>
          )}
        </Link>
      ))}
    </div>
  );
}
