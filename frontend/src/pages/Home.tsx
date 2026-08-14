import { useEffect, useState } from 'react';
import api from '../api/client';
import { useSite } from '../context/SiteProvider';
import type { Category, Product } from '../api/types';
import {
  AtelierHome,
  BentoHome,
  EditorialHome,
  GalleryHome,
  HarvestHome,
  MarketplaceHome,
  RunwayHome,
  RushHome,
} from './home/structures';

export default function Home() {
  const { branding, logoUrl, layout } = useSite();
  const [data, setData] = useState<{
    new_arrivals: Product[];
    popular: Product[];
    categories: Category[];
    published_count?: number;
  } | null>(null);

  useEffect(() => {
    api.get('/home').then((r) => setData(r.data));
  }, []);

  if (!data) {
    return (
      <div className="home-loading">
        <img src={logoUrl} alt={branding.site_name} className="home-loading-logo" />
        <p>Loading products…</p>
      </div>
    );
  }

  const totalDesigns = data.published_count ?? data.categories.reduce(
    (sum, c) => sum + (c.published_products_count ?? 0),
    0,
  );

  const props = {
    data,
    branding,
    logoUrl,
    layout,
    totalDesigns,
    showMedia: Boolean(layout.needs_background),
  };

  const structure = layout.structure || 'marketplace';

  switch (structure) {
    case 'editorial':
      return <EditorialHome {...props} />;
    case 'atelier':
      return <AtelierHome {...props} />;
    case 'bento':
      return <BentoHome {...props} />;
    case 'runway':
      return <RunwayHome {...props} />;
    case 'gallery':
      return <GalleryHome {...props} />;
    case 'rush':
      return <RushHome {...props} />;
    case 'harvest':
      return <HarvestHome {...props} />;
    default:
      return <MarketplaceHome {...props} />;
  }
}
