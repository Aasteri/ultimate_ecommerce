import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import api, { imageUrl, setSiteCurrency } from '../api/client';

export type SiteBranding = {
  site_name: string;
  site_logo?: string | null;
  hero_badge: string;
  hero_title: string;
  hero_subtitle: string;
  hero_card_label: string;
};

export type SiteLayout = {
  id: string;
  label: string;
  group: string;
  description: string;
  needs_background: boolean;
  overlay_default: number;
  max_backgrounds: number;
  bg_mode: string;
  structure: string;
  card_style: string;
  category_style: string;
  demo_images: string[];
};

type SiteContextType = {
  branding: SiteBranding;
  logoUrl: string;
  layout: SiteLayout;
  layoutBgImages: string[];
  layoutBgImage: string | null;
  layoutBgOverlay: number;
  refreshSite: () => Promise<void>;
};

const defaults: SiteBranding = {
  site_name: 'The Tailors Market',
  site_logo: null,
  hero_badge: 'Marketplace for tailors',
  hero_title: 'Everything a tailor needs, in one market',
  hero_subtitle: 'Shop fabrics, tools, threads, machines, and digital patterns from trusted vendors. Download files instantly or get physical supplies delivered.',
  hero_card_label: 'Curated supplies',
};

const defaultLayout: SiteLayout = {
  id: 'classic',
  label: 'Classic marketplace',
  group: 'Core UI',
  description: 'The default storefront layout.',
  needs_background: false,
  overlay_default: 0,
  max_backgrounds: 0,
  bg_mode: 'none',
  structure: 'marketplace',
  card_style: 'standard',
  category_style: 'grid',
  demo_images: [],
};

const SiteContext = createContext<SiteContextType | null>(null);

function applyTheme(vars?: Record<string, string> | null) {
  if (!vars) return;
  const root = document.documentElement;
  Object.entries(vars).forEach(([key, value]) => {
    if (key.startsWith('--') && value) root.style.setProperty(key, value);
  });
  const mode = vars['--theme-mode'] === 'dark' ? 'dark' : 'light';
  root.dataset.theme = mode;
  root.style.colorScheme = mode;
}

function applyLayout(layoutId: string, images: string[], overlay: number, bgMode: string, structure = 'marketplace') {
  const root = document.documentElement;
  root.dataset.layout = layoutId || 'classic';
  root.dataset.layoutBg = bgMode || 'none';
  root.dataset.structure = structure || 'marketplace';
  const first = images[0] ? imageUrl(images[0]) : '';
  if (first) {
    root.style.setProperty('--layout-bg-image', `url("${first}")`);
  } else {
    root.style.removeProperty('--layout-bg-image');
  }
  images.slice(0, 8).forEach((path, i) => {
    root.style.setProperty(`--layout-bg-${i + 1}`, `url("${imageUrl(path)}")`);
  });
  for (let i = images.length; i < 8; i += 1) {
    root.style.removeProperty(`--layout-bg-${i + 1}`);
  }
  root.style.setProperty('--layout-bg-overlay', String(Math.min(90, Math.max(0, overlay)) / 100));
  root.style.setProperty('--layout-bg-count', String(images.length));
}

export function SiteProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<SiteBranding>(defaults);
  const [layout, setLayout] = useState<SiteLayout>(defaultLayout);
  const [layoutBgImages, setLayoutBgImages] = useState<string[]>([]);
  const [layoutBgOverlay, setLayoutBgOverlay] = useState(0);

  const refreshSite = async () => {
    try {
      const { data } = await api.get('/settings');
      if (data.currency) setSiteCurrency(data.currency);
      if (data.site_name) document.title = data.site_name;
      applyTheme(data.theme);

      const nextLayout: SiteLayout = data.layout
        ? {
            id: data.layout.id || data.layout_id || 'classic',
            label: data.layout.label || 'Classic marketplace',
            group: data.layout.group || 'Core UI',
            description: data.layout.description || '',
            needs_background: Boolean(data.layout.needs_background),
            overlay_default: Number(data.layout.overlay_default ?? 0),
            max_backgrounds: Number(data.layout.max_backgrounds ?? 0),
            bg_mode: data.layout.bg_mode || 'none',
            structure: data.layout.structure || 'marketplace',
            card_style: data.layout.card_style || 'standard',
            category_style: data.layout.category_style || 'grid',
            demo_images: Array.isArray(data.layout.demo_images) ? data.layout.demo_images : [],
          }
        : { ...defaultLayout, id: data.layout_id || 'classic' };

      let images: string[] = Array.isArray(data.layout_bg_images)
        ? data.layout_bg_images.filter((x: unknown): x is string => typeof x === 'string' && x.trim() !== '')
        : (data.layout_bg_image ? [data.layout_bg_image] : []);
      if (nextLayout.needs_background && images.length === 0 && nextLayout.demo_images.length) {
        images = nextLayout.demo_images;
      }
      const overlay = Number(data.layout_bg_overlay ?? nextLayout.overlay_default ?? 0);
      setLayout(nextLayout);
      setLayoutBgImages(images);
      setLayoutBgOverlay(overlay);
      applyLayout(nextLayout.id, images, overlay, nextLayout.bg_mode, nextLayout.structure);

      setBranding({
        site_name: data.site_name || defaults.site_name,
        site_logo: data.site_logo || null,
        hero_badge: data.hero_badge || defaults.hero_badge,
        hero_title: data.hero_title || defaults.hero_title,
        hero_subtitle: data.hero_subtitle || defaults.hero_subtitle,
        hero_card_label: data.hero_card_label || defaults.hero_card_label,
      });
    } catch {
      setSiteCurrency('NGN');
      applyLayout('classic', [], 0, 'none', 'marketplace');
    }
  };

  useEffect(() => {
    void refreshSite();
  }, []);

  const logoUrl = branding.site_logo ? imageUrl(branding.site_logo) : '/logo.png';
  const layoutBgImage = layoutBgImages[0] || null;

  const value = useMemo(
    () => ({ branding, logoUrl, layout, layoutBgImages, layoutBgImage, layoutBgOverlay, refreshSite }),
    [branding, logoUrl, layout, layoutBgImages, layoutBgImage, layoutBgOverlay],
  );

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite must be used within SiteProvider');
  return ctx;
}
