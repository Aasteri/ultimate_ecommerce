export type ProductOffer = 'digital' | 'physical' | 'both';

export function offerFromFlags(digital?: boolean, physical?: boolean): ProductOffer | '' {
  if (digital && physical) return 'both';
  if (digital) return 'digital';
  if (physical) return 'physical';
  return '';
}

export function flagsFromOffer(offer: ProductOffer | '') {
  return {
    is_digital_available: offer === 'digital' || offer === 'both',
    is_physical_available: offer === 'physical' || offer === 'both',
  };
}

export const OFFER_OPTIONS: Array<{ value: ProductOffer; title: string; desc: string }> = [
  { value: 'digital', title: 'Digital', desc: 'Downloadable file after payment' },
  { value: 'physical', title: 'Physical', desc: 'Shipped item with stock' },
  { value: 'both', title: 'Both', desc: 'Buyers choose digital or physical' },
];
