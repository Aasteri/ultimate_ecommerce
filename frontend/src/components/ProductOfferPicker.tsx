import { OFFER_OPTIONS, type ProductOffer } from '../lib/productOffer';

export default function ProductOfferPicker({
  value,
  onChange,
}: {
  value: ProductOffer | '';
  onChange: (value: ProductOffer) => void;
}) {
  return (
    <div className="product-offer">
      <label className="label">Product type</label>
      <p className="help-text" style={{ marginTop: 0, marginBottom: 12 }}>
        Required. The rest of the form changes based on this choice.
      </p>
      <div className="product-offer-grid">
        {OFFER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`product-offer-card ${value === opt.value ? 'is-selected' : ''}`}
            onClick={() => onChange(opt.value)}
          >
            <strong>{opt.title}</strong>
            <span>{opt.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
