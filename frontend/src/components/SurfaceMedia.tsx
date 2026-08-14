import { useEffect, useMemo, useState } from 'react';
import { imageUrl } from '../api/client';
import { useSite } from '../context/SiteProvider';

export type SurfaceKind = 'hero' | 'popular' | 'newsletter' | 'lookbook' | 'cta';

type Props = {
  surface: SurfaceKind;
  className?: string;
};

/**
 * Section-scoped media (world-standard): images live inside a section, not as a page-wide overlay.
 */
export default function SurfaceMedia({ surface, className = '' }: Props) {
  const { layout, layoutBgImages, layoutBgOverlay } = useSite();
  const mode = layout.bg_mode || 'none';
  const all = useMemo(
    () => layoutBgImages.map((path) => imageUrl(path)).filter((src) => src && !src.endsWith('/logo.png')),
    [layoutBgImages],
  );
  const [active, setActive] = useState(0);

  const images = useMemo(() => {
    if (!all.length) return [];
    if (surface === 'hero') return all;
    if (surface === 'popular') return [all[1 % all.length], all[2 % all.length]].filter(Boolean);
    if (surface === 'newsletter') return [all[Math.min(2, all.length - 1)]];
    if (surface === 'cta') return [all[Math.min(3, all.length - 1)]];
    if (surface === 'lookbook') return all.slice(0, Math.min(8, all.length));
    return all.slice(0, 1);
  }, [all, surface]);

  useEffect(() => {
    setActive(0);
  }, [layout.id, surface, images.join('|')]);

  useEffect(() => {
    if (surface !== 'hero') return;
    if (images.length < 2) return;
    if (mode !== 'slideshow' && mode !== 'crossfade' && mode !== 'strips') return;
    const ms = mode === 'strips' ? 4200 : 6000;
    const timer = window.setInterval(() => setActive((i) => (i + 1) % images.length), ms);
    return () => window.clearInterval(timer);
  }, [surface, images.length, mode, images.join('|')]);

  if (!layout.needs_background || images.length === 0 || mode === 'none') {
    return null;
  }

  // Only render lookbook mosaic for mosaic mode (or as accent for gallery_wall)
  if (surface === 'lookbook' && mode !== 'mosaic' && layout.id !== 'gallery_wall') {
    return null;
  }

  const overlay = Math.min(90, Math.max(0, layoutBgOverlay)) / 100;
  const heroMode = surface === 'hero' ? mode : surface === 'lookbook' ? 'mosaic' : 'wash';

  return (
    <div
      className={`surface-media surface-${surface} mode-${heroMode} ${className}`.trim()}
      aria-hidden="true"
      style={{ ['--surface-overlay' as string]: overlay }}
    >
      {heroMode === 'mosaic' && (
        <div className="surface-mosaic">
          {images.map((src, i) => (
            <div key={`${src}-${i}`} className="surface-tile" style={{ backgroundImage: `url("${src}")` }} />
          ))}
        </div>
      )}

      {heroMode === 'split' && (
        <div className={`surface-split split-${Math.min(4, Math.max(2, images.length))}`}>
          {images.slice(0, 4).map((src, i) => (
            <div key={`${src}-${i}`} className="surface-pane" style={{ backgroundImage: `url("${src}")` }} />
          ))}
        </div>
      )}

      {heroMode === 'strips' && (
        <div className="surface-strips">
          {images.slice(0, 4).map((src, i) => (
            <div
              key={`${src}-${i}`}
              className={`surface-strip${i === active % Math.min(4, images.length) ? ' is-pulse' : ''}`}
              style={{ backgroundImage: `url("${src}")` }}
            />
          ))}
        </div>
      )}

      {heroMode === 'layers' && (
        <>
          {images.slice(0, 5).map((src, i) => (
            <div key={`${src}-${i}`} className={`surface-layer layer-${i}`} style={{ backgroundImage: `url("${src}")` }} />
          ))}
        </>
      )}

      {(heroMode === 'slideshow' || heroMode === 'crossfade') && (
        <>
          {images.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className={`surface-slide${i === active ? ' is-active' : ''}`}
              style={{ backgroundImage: `url("${src}")` }}
            />
          ))}
        </>
      )}

      {heroMode === 'wash' && (
        <div className="surface-wash" style={{ backgroundImage: `url("${images[0]}")` }} />
      )}

      <div className="surface-veil" />
    </div>
  );
}
