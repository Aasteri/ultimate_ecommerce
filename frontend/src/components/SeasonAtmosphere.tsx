import type { CSSProperties } from 'react';
import { useSite } from '../context/SiteProvider';

type FxKind =
  | 'petal'
  | 'sun'
  | 'leaf'
  | 'snow'
  | 'rain'
  | 'sparkle'
  | 'heart'
  | 'ember'
  | 'orb'
  | 'confetti';

const LAYOUT_FX: Record<string, { kind: FxKind; count: number }> = {
  spring: { kind: 'petal', count: 16 },
  summer: { kind: 'sun', count: 10 },
  autumn: { kind: 'leaf', count: 14 },
  winter: { kind: 'snow', count: 22 },
  monsoon: { kind: 'rain', count: 28 },
  christmas: { kind: 'snow', count: 18 },
  valentine: { kind: 'heart', count: 12 },
  halloween: { kind: 'orb', count: 10 },
  easter: { kind: 'confetti', count: 14 },
  thanksgiving: { kind: 'leaf', count: 12 },
  diwali: { kind: 'sparkle', count: 16 },
  new_year: { kind: 'sparkle', count: 18 },
  mothers_day: { kind: 'petal', count: 14 },
  ramadan: { kind: 'sparkle', count: 12 },
};

export default function SeasonAtmosphere() {
  const { layout } = useSite();
  const fx = LAYOUT_FX[layout.id];
  if (!fx) return null;

  return (
    <div
      className={`season-fx season-fx--${fx.kind} season-fx--layout-${layout.id}`}
      data-season-fx={fx.kind}
      aria-hidden="true"
    >
      {Array.from({ length: fx.count }, (_, i) => (
        <span
          key={i}
          className="season-fx__particle"
          style={
            {
              '--i': i,
              '--n': fx.count,
              '--x': `${((i * 47) % 100)}%`,
              '--delay': `${((i * 0.37) % 8).toFixed(2)}s`,
              '--dur': `${(8 + (i % 7) * 1.4).toFixed(1)}s`,
              '--scale': `${(0.55 + (i % 5) * 0.18).toFixed(2)}`,
              '--drift': `${(i % 2 === 0 ? 1 : -1) * (12 + (i % 6) * 6)}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
