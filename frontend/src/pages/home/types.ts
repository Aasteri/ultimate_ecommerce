import type { Category, Product } from '../../api/types';
import type { SiteBranding, SiteLayout } from '../../context/SiteProvider';

export type HomeData = {
  new_arrivals: Product[];
  popular: Product[];
  categories: Category[];
  published_count?: number;
};

export type HomeStructureProps = {
  data: HomeData;
  branding: SiteBranding;
  logoUrl: string;
  layout: SiteLayout;
  totalDesigns: number;
  showMedia: boolean;
};
