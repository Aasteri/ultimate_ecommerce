import { useEffect, useMemo, useState } from 'react';
import { City, Country, State } from 'country-state-city';
import api from '../api/client';
import { PhoneInput } from './FormFields';
import SearchableSelect from './SearchableSelect';

export interface ShippingAddress {
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  country: string;
  country_code: string;
  state_code: string;
  lagos_area: string;
}

interface Props {
  value: ShippingAddress;
  onChange: (next: ShippingAddress) => void;
}

export default function ShippingAddressFields({ value, onChange }: Props) {
  const [lagosAreas, setLagosAreas] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
    api.get('/shipping/config')
      .then((r) => {
        const areas = (r.data.lagos_areas || []).map((a: { key: string; label: string }) => ({
          value: a.key,
          label: a.label,
        }));
        setLagosAreas(areas);
      })
      .catch(() => setLagosAreas([]));
  }, []);

  const countries = useMemo(
    () => Country.getAllCountries().map((c) => ({ value: c.isoCode, label: c.name })),
    [],
  );

  const states = useMemo(() => {
    if (!value.country_code) return [];
    return State.getStatesOfCountry(value.country_code).map((s) => ({
      value: s.isoCode,
      label: s.name,
    }));
  }, [value.country_code]);

  const cities = useMemo(() => {
    if (!value.country_code || !value.state_code) return [];
    return City.getCitiesOfState(value.country_code, value.state_code).map((c) => ({
      value: c.name,
      label: c.name,
    }));
  }, [value.country_code, value.state_code]);

  const isNigeria = value.country_code === 'NG';
  const isLagos = isNigeria && value.state.toLowerCase() === 'lagos';

  return (
    <div className="shipping-fields">
      <div>
        <label className="label">Full name</label>
        <input className="input" value={value.name} maxLength={80} autoComplete="name" onChange={(e) => onChange({ ...value, name: e.target.value })} required />
      </div>
      <div>
        <label className="label">Phone number</label>
        <PhoneInput value={value.phone} required onChange={(phone) => onChange({ ...value, phone })} />
      </div>
      <div>
        <label className="label">Street address</label>
        <input className="input" value={value.street} maxLength={200} autoComplete="street-address" onChange={(e) => onChange({ ...value, street: e.target.value })} required />
      </div>
      <div>
        <label className="label">Country</label>
        <SearchableSelect
          options={countries}
          value={value.country_code}
          placeholder="Type to search countries"
          onChange={(code, option) => onChange({
            ...value,
            country_code: code,
            country: option?.label ?? '',
            state: '',
            state_code: '',
            city: '',
            lagos_area: '',
          })}
        />
      </div>
      <div>
        <label className="label">State / region</label>
        <SearchableSelect
          options={states}
          value={value.state_code}
          placeholder={value.country_code ? 'Type to search states' : 'Select a country first'}
          disabled={!value.country_code}
          onChange={(code, option) => onChange({
            ...value,
            state_code: code,
            state: option?.label ?? '',
            city: '',
            lagos_area: '',
          })}
        />
      </div>
      {isLagos ? (
        <div>
          <label className="label">Lagos delivery area</label>
          <SearchableSelect
            options={lagosAreas}
            value={value.lagos_area}
            placeholder="Type to search Lagos areas"
            onChange={(area) => onChange({
              ...value,
              lagos_area: area,
              city: lagosAreas.find((a) => a.value === area)?.label ?? value.city,
            })}
          />
        </div>
      ) : (
        <div>
          <label className="label">City</label>
          {cities.length > 0 ? (
            <SearchableSelect
              options={cities}
              value={value.city}
              placeholder="Type to search cities"
              disabled={!value.state_code}
              onChange={(city) => onChange({ ...value, city })}
            />
          ) : (
            <input
              className="input"
              value={value.city}
              disabled={!value.state}
              placeholder={value.state ? 'Enter city' : 'Select a state first'}
              onChange={(e) => onChange({ ...value, city: e.target.value })}
              required
            />
          )}
        </div>
      )}
    </div>
  );
}
