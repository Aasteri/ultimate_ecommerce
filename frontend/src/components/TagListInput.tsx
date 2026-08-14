import { useState, type FormEvent, type KeyboardEvent } from 'react';

const COLOR_SUGGESTIONS = [
  'Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple',
  'Pink', 'Brown', 'Grey', 'Navy', 'Cream', 'Gold', 'Silver', 'Multicolor',
];

const FEATURE_SUGGESTIONS = [
  '100% cotton', 'Polyester', 'Linen', 'Washable', 'Iron-friendly',
  'Stretch', 'Heavyweight', 'Lightweight', 'Made in Nigeria', 'Wholesale pack',
];

type TagListInputProps = {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  help?: string;
  max?: number;
};

export function TagListInput({
  label,
  values,
  onChange,
  suggestions = [],
  placeholder = 'Type and press Enter',
  help,
  max = 20,
}: TagListInputProps) {
  const [draft, setDraft] = useState('');

  const add = (raw: string) => {
    const value = raw.trim();
    if (!value || values.length >= max) return;
    const exists = values.some((v) => v.toLowerCase() === value.toLowerCase());
    if (exists) {
      setDraft('');
      return;
    }
    onChange([...values, value]);
    setDraft('');
  };

  const remove = (value: string) => onChange(values.filter((v) => v !== value));

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(draft);
    } else if (e.key === 'Backspace' && !draft && values.length) {
      remove(values[values.length - 1]);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    add(draft);
  };

  return (
    <div className="tag-list-field">
      <label className="label">{label}</label>
      {help && <p className="help-text" style={{ marginTop: 0 }}>{help}</p>}
      <div className="tag-list-chips">
        {values.map((v) => (
          <button key={v} type="button" className="tag-chip" onClick={() => remove(v)}>
            {v} <span aria-hidden>×</span>
          </button>
        ))}
      </div>
      <form onSubmit={onSubmit} className="tag-list-add">
        <input
          className="input"
          value={draft}
          maxLength={80}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={values.length >= max}
        />
        <button type="submit" className="btn btn-outline" disabled={!draft.trim() || values.length >= max}>
          Add
        </button>
      </form>
      {suggestions.length > 0 && (
        <div className="tag-suggestions">
          {suggestions
            .filter((s) => !values.some((v) => v.toLowerCase() === s.toLowerCase()))
            .slice(0, 12)
            .map((s) => (
              <button
                key={s}
                type="button"
                className="btn btn-ghost tag-suggestion"
                disabled={values.length >= max}
                onClick={() => add(s)}
              >
                + {s}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

export function ColorTagInput(props: Omit<TagListInputProps, 'suggestions' | 'label'> & { label?: string }) {
  return (
    <TagListInput
      label={props.label ?? 'Colors'}
      suggestions={COLOR_SUGGESTIONS}
      placeholder="Add a color"
      help="Optional. Buyers see these on the product page."
      {...props}
    />
  );
}

export function FeatureTagInput(props: Omit<TagListInputProps, 'suggestions' | 'label'> & { label?: string }) {
  return (
    <TagListInput
      label={props.label ?? 'Features'}
      suggestions={FEATURE_SUGGESTIONS}
      placeholder="Add a feature (e.g. 100% cotton)"
      help="Optional highlights like material, care, or pack size."
      {...props}
    />
  );
}

export { COLOR_SUGGESTIONS, FEATURE_SUGGESTIONS };
