import { Link } from 'react-router-dom';
import { Download, Package, ShieldCheck, Sparkles } from 'lucide-react';
import NewsletterSignup from '../../components/NewsletterSignup';
import ProductCard, { type ProductCardVariant } from '../../components/ProductCard';
import CategoryShowcase, { type CategoryStyle } from '../../components/CategoryShowcase';
import SurfaceMedia from '../../components/SurfaceMedia';
import type { HomeStructureProps } from './types';
import type { Product } from '../../api/types';

export function HeroMarketplace({ branding, logoUrl, totalDesigns, categoryCount, showMedia, center = false }: {
  branding: HomeStructureProps['branding'];
  logoUrl: string;
  totalDesigns: number;
  categoryCount: number;
  showMedia: boolean;
  center?: boolean;
}) {
  return (
    <section className={`hero${center ? ' hero--center' : ''}`} data-surface="hero">
      <div className="hero-bg">{showMedia ? <SurfaceMedia surface="hero" /> : null}</div>
      <div className={`container hero-inner${center ? ' hero-inner--center' : ''}`}>
        <div className="hero-content">
          <span className="hero-badge"><Sparkles size={14} />{branding.hero_badge}</span>
          <h1 className="hero-title">{branding.hero_title}</h1>
          <p className="hero-subtitle">{branding.hero_subtitle}</p>
          <div className="hero-actions">
            <Link to="/browse" className="btn btn-primary btn-lg">Browse products</Link>
            <Link to="/sell" className="btn btn-outline btn-lg">Sell your supplies</Link>
          </div>
          <div className="hero-features">
            <span><Download size={16} /> Instant digital downloads</span>
            <span><Package size={16} /> Physical supplies shipped</span>
            <span><ShieldCheck size={16} /> Trusted vendors</span>
          </div>
        </div>
        {!center && (
          <div className="hero-visual">
            <div className="hero-card">
              <img src={logoUrl} alt={branding.site_name} className="hero-logo" />
              <p className="hero-card-label">{branding.hero_card_label}</p>
              <p className="hero-card-stat">{totalDesigns} products</p>
              <p className="hero-card-sub">{categoryCount} categories</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export function SectionHeader({ title, subtitle, to, linkLabel = 'View all →' }: {
  title: string;
  subtitle?: string;
  to?: string;
  linkLabel?: string;
}) {
  return (
    <div className="section-header">
      <div>
        <h2 className="section-title" style={{ marginBottom: subtitle ? 4 : 0 }}>{title}</h2>
        {subtitle ? <p className="section-subtitle">{subtitle}</p> : null}
      </div>
      {to ? <Link to={to} className="section-link">{linkLabel}</Link> : null}
    </div>
  );
}

export function ProductGrid({ products, variant = 'standard', className = 'grid-products' }: {
  products: Product[];
  variant?: ProductCardVariant;
  className?: string;
}) {
  return (
    <div className={className}>
      {products.map((p) => <ProductCard key={p.id} product={p} variant={variant} />)}
    </div>
  );
}

export function StepsSection({ stacked = false }: { stacked?: boolean }) {
  const items = [
    { step: '01', title: 'Browse', desc: 'Explore fabrics, threads, tools, machines, patterns, and other tailor supplies.' },
    { step: '02', title: 'Choose type', desc: 'Buy a digital file for instant download, a physical item to ship, or both when a listing offers them.' },
    { step: '03', title: 'Make & sell', desc: 'Download files right away or receive supplies at your door, then get to work.' },
  ];
  return (
    <section className={`container home-section${stacked ? ' home-section--stacked-steps' : ''}`} data-surface="steps">
      <h2 className="section-title" style={{ textAlign: stacked ? 'left' : 'center', marginBottom: 40 }}>How it works</h2>
      <div className={`steps-grid${stacked ? ' steps-grid--stack' : ''}`}>
        {items.map((item) => (
          <div key={item.step} className="step-card">
            <span className="step-number">{item.step}</span>
            <h3>{item.title}</h3>
            <p>{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function VendorCta({ showMedia }: { showMedia: boolean }) {
  const body = (
    <div className="card home-cta">
      <div>
        <h2 className="section-title" style={{ marginBottom: 8 }}>Sell to tailors nationwide</h2>
        <p className="help-text">Open a shop, list digital files or physical supplies, and get paid 90% of every sale. Apply in a few minutes.</p>
      </div>
      <Link to="/sell" className="btn btn-primary">Become a vendor</Link>
    </div>
  );
  return (
    <section className="container home-section home-cta-section" data-surface="cta">
      {showMedia ? <div className="home-cta-media-wrap"><SurfaceMedia surface="cta" />{body}</div> : body}
    </section>
  );
}

export function NewsletterBand({ showMedia }: { showMedia: boolean }) {
  return (
    <section className="newsletter-section home-section-media" data-surface="newsletter">
      {showMedia ? <SurfaceMedia surface="newsletter" /> : null}
      <div className="container newsletter-inner home-section-media-inner">
        <div>
          <h2>Stay in the loop</h2>
          <p>New supplies and marketplace updates — straight to your inbox.</p>
        </div>
        <NewsletterSignup />
      </div>
    </section>
  );
}

export function CategoriesBlock({ categories, style, title = 'Shop by category', subtitle = 'Fabrics, tools, patterns, and more' }: {
  categories: HomeStructureProps['data']['categories'];
  style: CategoryStyle;
  title?: string;
  subtitle?: string;
}) {
  return (
    <section className="container home-section" data-surface="categories">
      {title ? <SectionHeader title={title} subtitle={subtitle} to="/browse" /> : null}
      <CategoryShowcase categories={categories} style={style} />
    </section>
  );
}
