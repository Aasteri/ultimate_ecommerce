import { Link } from 'react-router-dom';
import SurfaceMedia from '../../components/SurfaceMedia';
import ProductCard from '../../components/ProductCard';
import CategoryShowcase from '../../components/CategoryShowcase';
import type { HomeStructureProps } from './types';
import {
  CategoriesBlock,
  HeroMarketplace,
  NewsletterBand,
  ProductGrid,
  SectionHeader,
  StepsSection,
  VendorCta,
} from './HomeBlocks';

export function MarketplaceHome(props: HomeStructureProps) {
  const { data, branding, logoUrl, layout, totalDesigns, showMedia } = props;
  const card = (layout.card_style || 'standard') as 'standard' | 'soft' | 'framed';
  const cat = (layout.category_style || 'grid') as 'grid' | 'ribbon';

  return (
    <div className="home-structure home-structure--marketplace">
      <HeroMarketplace
        branding={branding}
        logoUrl={logoUrl}
        totalDesigns={totalDesigns}
        categoryCount={data.categories.length}
        showMedia={showMedia}
      />
      <CategoriesBlock categories={data.categories} style={cat === 'ribbon' ? 'ribbon' : 'grid'} />
      {data.new_arrivals.length > 0 && (
        <section className="container home-section" data-surface="arrivals">
          <SectionHeader title="New arrivals" subtitle="Latest additions to the shop" to="/browse?new_arrivals=1" />
          <ProductGrid products={data.new_arrivals} variant={card} />
        </section>
      )}
      {data.popular.length > 0 && (
        <section className="home-section-alt home-section-media" data-surface="popular">
          {showMedia ? <SurfaceMedia surface="popular" /> : null}
          <div className="container home-section-media-inner">
            <SectionHeader title="Popular now" subtitle="Trending with our customers" to="/browse?sort=popular" />
            <ProductGrid products={data.popular} variant={card} />
          </div>
        </section>
      )}
      <StepsSection />
      <VendorCta showMedia={showMedia} />
      <NewsletterBand showMedia={showMedia} />
    </div>
  );
}

export function EditorialHome(props: HomeStructureProps) {
  const { data, branding, logoUrl, totalDesigns, showMedia } = props;
  return (
    <div className="home-structure home-structure--editorial">
      <HeroMarketplace
        branding={branding}
        logoUrl={logoUrl}
        totalDesigns={totalDesigns}
        categoryCount={data.categories.length}
        showMedia={showMedia}
        center
      />
      <CategoriesBlock categories={data.categories} style="chips" title="Departments" subtitle="Jump into a craft aisle" />
      {data.new_arrivals.length > 0 && (
        <section className="container home-section" data-surface="arrivals">
          <SectionHeader title="New arrivals" subtitle="Lookbook edits" to="/browse?new_arrivals=1" />
          <ProductGrid products={data.new_arrivals} variant="horizontal" className="product-list-editorial" />
        </section>
      )}
      {data.popular.length > 0 && (
        <section className="container home-section" data-surface="popular">
          <SectionHeader title="Editors’ picks" subtitle="What the atelier is watching" to="/browse?sort=popular" />
          <ProductGrid products={data.popular} variant="horizontal" className="product-list-editorial" />
        </section>
      )}
      <StepsSection />
      <VendorCta showMedia={false} />
      <NewsletterBand showMedia={false} />
    </div>
  );
}

export function AtelierHome(props: HomeStructureProps) {
  const { data, showMedia } = props;
  return (
    <div className="home-structure home-structure--atelier">
      <HeroMarketplace {...props} categoryCount={data.categories.length} showMedia={showMedia} />
      <section className="home-atelier-board">
        <div className="container home-atelier-board-inner">
          <div className="home-atelier-side">
            <h2 className="section-title">Workbench aisles</h2>
            <p className="section-subtitle">Pin a category and get making</p>
            <CategoryShowcase categories={data.categories} style="rail" />
          </div>
          <div className="home-atelier-main">
            {data.new_arrivals.length > 0 && (
              <section className="home-section" data-surface="arrivals">
                <SectionHeader title="Fresh on the bench" to="/browse?new_arrivals=1" />
                <ProductGrid products={data.new_arrivals} variant="compact" className="grid-products grid-products--dense" />
              </section>
            )}
            {data.popular.length > 0 && (
              <section className="home-section" data-surface="popular">
                <SectionHeader title="Most pulled" to="/browse?sort=popular" />
                <ProductGrid products={data.popular} variant="compact" className="grid-products grid-products--dense" />
              </section>
            )}
          </div>
        </div>
      </section>
      <StepsSection />
      <VendorCta showMedia={showMedia} />
      <NewsletterBand showMedia={showMedia} />
    </div>
  );
}

export function BentoHome(props: HomeStructureProps) {
  const { data, branding, logoUrl, totalDesigns, showMedia } = props;
  return (
    <div className="home-structure home-structure--bento">
      <section className="hero hero--bento" data-surface="hero">
        <div className="hero-bg">{showMedia ? <SurfaceMedia surface="hero" /> : null}</div>
        <div className="container hero-bento">
          <div className="hero-bento-copy">
            <span className="hero-badge">{branding.hero_badge}</span>
            <h1 className="hero-title">{branding.hero_title}</h1>
            <p className="hero-subtitle">{branding.hero_subtitle}</p>
            <div className="hero-actions">
              <Link to="/browse" className="btn btn-primary btn-lg">Browse products</Link>
              <Link to="/sell" className="btn btn-outline btn-lg">Sell your supplies</Link>
            </div>
          </div>
          <div className="hero-bento-stat">
            <img src={logoUrl} alt={branding.site_name} className="hero-logo" />
            <p className="hero-card-stat">{totalDesigns}</p>
            <p className="hero-card-label">products live</p>
          </div>
          {data.new_arrivals[0] && (
            <div className="hero-bento-feature">
              <ProductCard product={data.new_arrivals[0]} variant="feature" />
            </div>
          )}
        </div>
      </section>
      <CategoriesBlock categories={data.categories} style="bento" title="Collections" subtitle="A softer path through the market" />
      {data.new_arrivals.length > 1 && (
        <section className="container home-section" data-surface="arrivals">
          <SectionHeader title="New arrivals" to="/browse?new_arrivals=1" />
          <ProductGrid products={data.new_arrivals.slice(1)} variant="soft" />
        </section>
      )}
      {data.popular.length > 0 && (
        <section className="home-section-alt home-section-media" data-surface="popular">
          {showMedia ? <SurfaceMedia surface="popular" /> : null}
          <div className="container home-section-media-inner">
            <SectionHeader title="Popular now" to="/browse?sort=popular" />
            <ProductGrid products={data.popular} variant="soft" />
          </div>
        </section>
      )}
      <StepsSection />
      <VendorCta showMedia={showMedia} />
      <NewsletterBand showMedia={showMedia} />
    </div>
  );
}

export function RunwayHome(props: HomeStructureProps) {
  const { data, branding, showMedia } = props;
  const feature = data.popular[0] || data.new_arrivals[0];
  const rail = (data.popular.length ? data.popular : data.new_arrivals).slice(1);

  return (
    <div className="home-structure home-structure--runway">
      <HeroMarketplace {...props} categoryCount={data.categories.length} showMedia={showMedia} center />
      {feature && (
        <section className="container home-section home-runway-feature" data-surface="arrivals">
          <SectionHeader title="On the runway" subtitle={branding.hero_card_label} to="/browse" />
          <div className="home-runway-stage">
            <ProductCard product={feature} variant="feature" />
            <div className="home-runway-rail">
              {rail.slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={p} variant="poster" />
              ))}
            </div>
          </div>
        </section>
      )}
      <CategoriesBlock categories={data.categories} style="pills" title="Walk the aisles" subtitle="Tap a lane" />
      {data.new_arrivals.length > 0 && (
        <section className="home-section-alt home-section-media" data-surface="popular">
          {showMedia ? <SurfaceMedia surface="popular" /> : null}
          <div className="container home-section-media-inner">
            <SectionHeader title="New arrivals" to="/browse?new_arrivals=1" />
            <ProductGrid products={data.new_arrivals} variant="poster" className="grid-products grid-products--poster" />
          </div>
        </section>
      )}
      <StepsSection />
      <VendorCta showMedia={showMedia} />
      <NewsletterBand showMedia={showMedia} />
    </div>
  );
}

export function GalleryHome(props: HomeStructureProps) {
  const { data, showMedia, layout } = props;
  return (
    <div className="home-structure home-structure--gallery">
      <HeroMarketplace {...props} categoryCount={data.categories.length} showMedia={showMedia} center />
      {(layout.bg_mode === 'mosaic' || layout.id === 'gallery_wall') && (
        <section className="home-lookbook" data-surface="lookbook" aria-label="Gallery lookbook">
          <SurfaceMedia surface="lookbook" />
          <div className="container home-lookbook-copy">
            <p className="home-lookbook-kicker">Lookbook</p>
            <h2 className="section-title">Materials in motion</h2>
            <p className="section-subtitle">Texture, fabric, and craft from the marketplace wall.</p>
          </div>
        </section>
      )}
      <CategoriesBlock categories={data.categories} style="mosaic" title="Gallery rooms" subtitle="Browse by room" />
      {data.new_arrivals.length > 0 && (
        <section className="container home-section" data-surface="arrivals">
          <SectionHeader title="New hangings" to="/browse?new_arrivals=1" />
          <ProductGrid products={data.new_arrivals} variant="poster" className="grid-products grid-products--poster" />
        </section>
      )}
      {data.popular.length > 0 && (
        <section className="home-section-alt home-section-media" data-surface="popular">
          {showMedia ? <SurfaceMedia surface="popular" /> : null}
          <div className="container home-section-media-inner">
            <SectionHeader title="Crowd favorites" to="/browse?sort=popular" />
            <ProductGrid products={data.popular} variant="poster" className="grid-products grid-products--poster" />
          </div>
        </section>
      )}
      <StepsSection />
      <VendorCta showMedia={showMedia} />
      <NewsletterBand showMedia={showMedia} />
    </div>
  );
}

export function RushHome(props: HomeStructureProps) {
  const { data, branding, showMedia } = props;
  return (
    <div className="home-structure home-structure--rush">
      <section className="hero hero--rush" data-surface="hero">
        <div className="hero-bg">{showMedia ? <SurfaceMedia surface="hero" /> : null}</div>
        <div className="container hero-rush">
          <p className="hero-badge">{branding.hero_badge}</p>
          <h1 className="hero-title">{branding.hero_title}</h1>
          <p className="hero-subtitle">{branding.hero_subtitle}</p>
          <div className="hero-rush-actions">
            <Link to="/browse" className="btn btn-primary btn-lg">Shop now</Link>
            <Link to="/sell" className="btn btn-outline btn-lg">Sell here</Link>
          </div>
        </div>
      </section>
      <div className="container home-rush-split">
        <CategoriesBlock categories={data.categories} style="list" title="Departments" subtitle="Pick a lane" />
        <div>
          {data.new_arrivals.length > 0 && (
            <section className="home-section" data-surface="arrivals">
              <SectionHeader title="Just dropped" to="/browse?new_arrivals=1" />
              <ProductGrid products={data.new_arrivals} variant="slab" className="grid-products grid-products--rush" />
            </section>
          )}
          {data.popular.length > 0 && (
            <section className="home-section" data-surface="popular">
              <SectionHeader title="Moving fast" to="/browse?sort=popular" />
              <ProductGrid products={data.popular} variant="slab" className="grid-products grid-products--rush" />
            </section>
          )}
        </div>
      </div>
      <StepsSection stacked />
      <VendorCta showMedia={false} />
      <NewsletterBand showMedia={showMedia} />
    </div>
  );
}

export function HarvestHome(props: HomeStructureProps) {
  const { data, showMedia } = props;
  return (
    <div className="home-structure home-structure--harvest">
      <HeroMarketplace {...props} categoryCount={data.categories.length} showMedia={showMedia} />
      <CategoriesBlock categories={data.categories} style="ribbon" title="Market tables" subtitle="Pull up a chair" />
      {data.popular.length > 0 && (
        <section className="container home-section" data-surface="popular">
          <SectionHeader title="Table favorites" to="/browse?sort=popular" />
          <ProductGrid products={data.popular} variant="framed" />
        </section>
      )}
      {data.new_arrivals.length > 0 && (
        <section className="home-section-alt" data-surface="arrivals">
          <div className="container">
            <SectionHeader title="New from the kitchen" to="/browse?new_arrivals=1" />
            <ProductGrid products={data.new_arrivals} variant="framed" />
          </div>
        </section>
      )}
      <StepsSection />
      <VendorCta showMedia={showMedia} />
      <NewsletterBand showMedia={showMedia} />
    </div>
  );
}
