import { useEffect, useMemo, useState } from 'react';
import api, { imageUrl } from '../../api/client';
import BusyButton from '../../components/BusyButton';
import { FormAlert } from '../../components/FormAlert';
import { useSite } from '../../context/SiteProvider';

type Swatch = { hex: string; label: string; family: string; luminance: number; tone: string };
type RoleMeta = { label: string; group: string; hint: string; kind: string };
type Template = { label: string; tokens: Record<string, string> };
type LayoutMeta = {
  id?: string;
  label: string;
  group: string;
  description: string;
  needs_background: boolean;
  overlay_default: number;
  max_backgrounds?: number;
  bg_mode?: string;
  structure?: string;
  card_style?: string;
  category_style?: string;
  demo_images?: string[];
};

export default function AdminTheme() {
  const { refreshSite } = useSite();
  const [roles, setRoles] = useState<Record<string, RoleMeta>>({});
  const [templates, setTemplates] = useState<Record<string, Template>>({});
  const [swatches, setSwatches] = useState<Record<string, Swatch>>({});
  const [layoutGroups, setLayoutGroups] = useState<Record<string, LayoutMeta[]>>({});
  const [layoutId, setLayoutId] = useState('classic');
  const [layoutBgImages, setLayoutBgImages] = useState<string[]>([]);
  const [bgUrlDraft, setBgUrlDraft] = useState('');
  const [layoutBgOverlay, setLayoutBgOverlay] = useState(0);
  const [template, setTemplate] = useState('');
  const [tokens, setTokens] = useState<Record<string, string>>({});
  const [options, setOptions] = useState<Record<string, string[]>>({});
  const [previewVars, setPreviewVars] = useState<Record<string, string>>({});
  const [heroBadge, setHeroBadge] = useState('');
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [heroCardLabel, setHeroCardLabel] = useState('');
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const selectedLayout = useMemo(() => {
    for (const items of Object.values(layoutGroups)) {
      const found = items.find((l) => (l.id || '') === layoutId);
      if (found) return found;
    }
    return null;
  }, [layoutGroups, layoutId]);

  const maxBackgrounds = selectedLayout?.max_backgrounds || 0;

  const load = async () => {
    const { data } = await api.get('/admin/theme');
    setRoles(data.roles || {});
    setTemplates(data.templates || {});
    setSwatches(data.swatches || {});
    setTokens(data.tokens || {});
    setOptions(data.options || {});
    setPreviewVars(data.vars || {});
    setLayoutGroups(data.layout_groups || {});
    setLayoutId(data.branding?.layout_id || data.layout?.id || 'classic');
    const images = Array.isArray(data.branding?.layout_bg_images)
      ? data.branding.layout_bg_images.filter((x: unknown): x is string => typeof x === 'string' && x.trim() !== '')
      : (data.branding?.layout_bg_image ? [data.branding.layout_bg_image] : []);
    setLayoutBgImages(images);
    setLayoutBgOverlay(Number(data.branding?.layout_bg_overlay ?? data.layout?.overlay_default ?? 0));
    setHeroBadge(data.branding?.hero_badge || '');
    setHeroTitle(data.branding?.hero_title || '');
    setHeroSubtitle(data.branding?.hero_subtitle || '');
    setHeroCardLabel(data.branding?.hero_card_label || '');
    setLogoPath(data.branding?.site_logo || null);
  };

  useEffect(() => {
    load().catch(() => setError('Failed to load theme settings'));
  }, []);

  const refreshFromTokens = async (next: Record<string, string>) => {
    const { data } = await api.post('/admin/theme/options', { tokens: next });
    setTokens(data.tokens || next);
    setOptions(data.options || {});
    setPreviewVars(data.vars || {});
  };

  const onTokenChange = async (role: string, value: string) => {
    setTemplate('');
    const next = { ...tokens, [role]: value };
    const roleOrder = Object.keys(roles);
    const idx = roleOrder.indexOf(role);
    if (idx >= 0) {
      roleOrder.slice(idx + 1).forEach((r) => { delete next[r]; });
    }
    setTokens(next);
    await refreshFromTokens(next);
  };

  const applyTemplate = async (id: string) => {
    setTemplate(id);
    const tpl = templates[id];
    if (!tpl) return;
    setTokens(tpl.tokens);
    await refreshFromTokens(tpl.tokens);
  };

  const selectLayout = (id: string, meta: LayoutMeta) => {
    setLayoutId(id);
    setLayoutBgOverlay(meta.overlay_default ?? 0);
    if (meta.needs_background && layoutBgImages.length === 0 && meta.demo_images?.length) {
      setLayoutBgImages(meta.demo_images);
    }
  };

  const loadDemoImages = () => {
    const demos = selectedLayout?.demo_images;
    if (!demos?.length) {
      setError('No demo images for this layout.');
      return;
    }
    setLayoutBgImages(demos);
    setMessage('Loaded temporary demo stock photos. Save to apply on the live storefront.');
  };

  const addBgUrl = () => {
    const url = bgUrlDraft.trim();
    if (!url) return;
    const max = maxBackgrounds || 12;
    if (layoutBgImages.length >= max) {
      setError(`This layout allows up to ${max} background images.`);
      return;
    }
    if (layoutBgImages.includes(url)) {
      setError('That image is already in the gallery.');
      return;
    }
    setLayoutBgImages((prev) => [...prev, url]);
    setBgUrlDraft('');
  };

  const removeBg = (index: number) => {
    setLayoutBgImages((prev) => prev.filter((_, i) => i !== index));
  };

  const moveBg = (index: number, dir: -1 | 1) => {
    setLayoutBgImages((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      const tmp = next[index];
      next[index] = next[target];
      next[target] = tmp;
      return next;
    });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const { data } = await api.put('/admin/theme', {
        template: template || null,
        tokens,
        hero_badge: heroBadge,
        hero_title: heroTitle,
        hero_subtitle: heroSubtitle,
        hero_card_label: heroCardLabel,
        layout_id: layoutId,
        layout_bg_images: layoutBgImages,
        layout_bg_image: layoutBgImages[0] || null,
        layout_bg_overlay: layoutBgOverlay,
      });
      setTokens(data.tokens || tokens);
      setOptions(data.options || options);
      setPreviewVars(data.vars || {});
      if (data.branding?.layout_id) setLayoutId(data.branding.layout_id);
      if (Array.isArray(data.branding?.layout_bg_images)) setLayoutBgImages(data.branding.layout_bg_images);
      if (data.branding?.layout_bg_overlay !== undefined) setLayoutBgOverlay(Number(data.branding.layout_bg_overlay));
      setMessage(data.message || 'Theme & layout saved.');
      await refreshSite();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Save failed');
    }
    setSaving(false);
  };

  const uploadLogo = async (file: File) => {
    setUploading(true);
    setError('');
    try {
      const body = new FormData();
      body.append('logo', file);
      const { data } = await api.post('/admin/theme/logo', body);
      setLogoPath(data.site_logo);
      setMessage('Logo updated.');
      await refreshSite();
    } catch {
      setError('Logo upload failed');
    }
    setUploading(false);
  };

  const uploadBackground = async (file: File) => {
    setUploadingBg(true);
    setError('');
    try {
      const body = new FormData();
      body.append('background', file);
      body.append('append', '1');
      const { data } = await api.post('/admin/theme/background', body);
      if (Array.isArray(data.layout_bg_images)) setLayoutBgImages(data.layout_bg_images);
      else if (data.layout_bg_image) setLayoutBgImages((prev) => [...prev, data.layout_bg_image]);
      setMessage('Background image added. Save to lock in with the selected layout.');
      await refreshSite();
    } catch {
      setError('Background upload failed');
    }
    setUploadingBg(false);
  };

  const groups = useMemo(() => {
    const map: Record<string, string[]> = {};
    Object.entries(roles).forEach(([key, meta]) => {
      if (!map[meta.group]) map[meta.group] = [];
      map[meta.group].push(key);
    });
    return map;
  }, [roles]);

  const optionLabel = (key: string) => swatches[key]?.label || key;
  const swatchStyle = (key: string) => ({ background: swatches[key]?.hex || '#ccc' });

  const previewBox = useMemo(() => ({
    background: previewVars['--bg'] || '#faf9f7',
    color: previewVars['--text'] || '#1a1a1a',
    borderColor: previewVars['--border'] || '#e8e6e3',
  }), [previewVars]);

  const bgModeLabel = selectedLayout?.bg_mode || 'none';

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Theme & layouts</h1>
          <p className="admin-muted">
            Each template picks a real homepage structure (where sections sit, card types, category layouts) plus a visual skin. Image layouts also place photos in specific sections.
          </p>
        </div>
      </div>

      <FormAlert error={error} message={message} onDismiss={() => { setError(''); setMessage(''); }} />

      <form onSubmit={save} className="card admin-form-card" style={{ marginBottom: 24 }}>
        <h3>Website layout</h3>
        <p className="help-text" style={{ marginTop: 0 }}>
          Pick a layout for structure and atmosphere. Colors stay separate below.
        </p>

        {Object.entries(layoutGroups).map(([group, items]) => (
          <div key={group} className="theme-group">
            <h4 className="theme-group-title">{group}</h4>
            <div className="layout-picker-grid">
              {items.map((item) => {
                const id = item.id || '';
                const active = layoutId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    className={`layout-picker-card${active ? ' is-active' : ''}`}
                    onClick={() => selectLayout(id, item)}
                  >
                    <strong>{item.label}</strong>
                    <span>{item.description}</span>
                    {item.needs_background ? (
                      <em>
                        Structure · {(item as { structure?: string }).structure || 'marketplace'} · Multi-image · {item.bg_mode || 'gallery'}
                      </em>
                    ) : (
                      <em>Structure · {(item as { structure?: string }).structure || 'marketplace'}</em>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {selectedLayout?.needs_background ? (
          <div className="layout-bg-fields" style={{ marginTop: 16 }}>
            <h4 className="theme-group-title">Layout background gallery</h4>
            <p className="help-text" style={{ marginTop: 0 }}>
              Mode: <strong>{bgModeLabel}</strong>. Gallery images are assigned across sections — hero treatment, Popular wash, newsletter/CTA frames, and (for Gallery wall) a mid-page lookbook.
              {' '}({layoutBgImages.length}/{maxBackgrounds || 12})
            </p>
            <div style={{ marginBottom: 10 }}>
              <button type="button" className="btn btn-outline" onClick={loadDemoImages}>
                Load temporary demo photos
              </button>
            </div>

            <div className="layout-bg-gallery">
              {layoutBgImages.map((src, index) => (
                <div key={`${src}-${index}`} className="layout-bg-thumb">
                  <div className="layout-bg-thumb-media" style={{ backgroundImage: `url(${imageUrl(src)})` }} />
                  <div className="layout-bg-thumb-actions">
                    <button type="button" className="btn btn-ghost" onClick={() => moveBg(index, -1)} disabled={index === 0}>↑</button>
                    <button type="button" className="btn btn-ghost" onClick={() => moveBg(index, 1)} disabled={index === layoutBgImages.length - 1}>↓</button>
                    <button type="button" className="btn btn-ghost" onClick={() => removeBg(index)}>Remove</button>
                  </div>
                  <p className="help-text" style={{ margin: '4px 0 0', wordBreak: 'break-all' }}>{src}</p>
                </div>
              ))}
            </div>

            <div className="admin-form-grid" style={{ marginTop: 12 }}>
              <div>
                <label className="label">Add image URL</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="input"
                    value={bgUrlDraft}
                    onChange={(e) => setBgUrlDraft(e.target.value)}
                    placeholder="https://… or branding/backgrounds/…"
                  />
                  <button type="button" className="btn btn-outline" onClick={addBgUrl}>Add</button>
                </div>
              </div>
              <div>
                <label className="label">Overlay strength ({layoutBgOverlay}%)</label>
                <input
                  className="input"
                  type="range"
                  min={0}
                  max={90}
                  value={layoutBgOverlay}
                  onChange={(e) => setLayoutBgOverlay(Number(e.target.value))}
                />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <label className="label">Or upload image(s)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={uploadingBg || (maxBackgrounds > 0 && layoutBgImages.length >= maxBackgrounds)}
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  files.forEach((f) => { void uploadBackground(f); });
                  e.target.value = '';
                }}
              />
            </div>
          </div>
        ) : null}

        <h3 style={{ marginTop: 28 }}>Logo & hero write-up</h3>
        <div style={{ marginBottom: 16 }}>
          <img src={logoPath ? imageUrl(logoPath) : '/logo.png'} alt="Logo" className="admin-preview-thumb" style={{ marginBottom: 8 }} />
          <label className="label">Logo</label>
          <input type="file" accept="image/*" disabled={uploading} onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void uploadLogo(f);
            e.target.value = '';
          }} />
        </div>
        <div className="admin-form-grid">
          <div>
            <label className="label">Hero badge</label>
            <input className="input" maxLength={80} value={heroBadge} onChange={(e) => setHeroBadge(e.target.value)} />
          </div>
          <div>
            <label className="label">Hero card label</label>
            <input className="input" maxLength={80} value={heroCardLabel} onChange={(e) => setHeroCardLabel(e.target.value)} />
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <label className="label">Hero title</label>
          <input className="input" maxLength={120} value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} />
        </div>
        <div style={{ marginTop: 12 }}>
          <label className="label">Hero subtitle</label>
          <textarea className="input" rows={3} maxLength={500} value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} />
        </div>

        <h3 style={{ marginTop: 28 }}>Color system</h3>
        <div style={{ marginBottom: 16 }}>
          <label className="label">Ready-made color template</label>
          <p className="muted" style={{ marginTop: 0, marginBottom: 8, fontSize: 13 }}>
            Season and holiday packs are tuned to match those website layouts (e.g. Spring bloom + Spring layout).
          </p>
          <select className="input" value={template} onChange={(e) => {
            const id = e.target.value;
            if (!id) { setTemplate(''); return; }
            void applyTemplate(id);
          }}>
            <option value="">Custom (edit dropdowns below)</option>
            <optgroup label="Light templates">
              {Object.entries(templates).filter(([, t]) => t.label.startsWith('Light')).map(([id, t]) => (
                <option key={id} value={id}>{t.label.replace(/^Light ·\s*/, '')}</option>
              ))}
            </optgroup>
            <optgroup label="Dark templates">
              {Object.entries(templates).filter(([, t]) => t.label.startsWith('Dark')).map(([id, t]) => (
                <option key={id} value={id}>{t.label.replace(/^Dark ·\s*/, '')}</option>
              ))}
            </optgroup>
            <optgroup label="Season templates">
              {Object.entries(templates).filter(([, t]) => t.label.startsWith('Season')).map(([id, t]) => (
                <option key={id} value={id}>{t.label.replace(/^Season ·\s*/, '')}</option>
              ))}
            </optgroup>
            <optgroup label="Holiday templates">
              {Object.entries(templates).filter(([, t]) => t.label.startsWith('Holiday')).map(([id, t]) => (
                <option key={id} value={id}>{t.label.replace(/^Holiday ·\s*/, '')}</option>
              ))}
            </optgroup>
          </select>
        </div>

        {Object.entries(groups).map(([group, roleKeys]) => (
          <div key={group} className="theme-group">
            <h4 className="theme-group-title">{group}</h4>
            <div className="admin-form-grid">
              {roleKeys.map((role) => (
                <div key={role}>
                  <label className="label">{roles[role]?.label || role}</label>
                  <p className="help-text" style={{ marginTop: 0 }}>{roles[role]?.hint}</p>
                  <div className="theme-swatch-row">
                    <span className="theme-swatch" style={swatchStyle(tokens[role])} />
                    <select
                      className="input"
                      value={tokens[role] || ''}
                      onChange={(e) => void onTokenChange(role, e.target.value)}
                    >
                      {(options[role] || Object.keys(swatches)).map((key) => (
                        <option key={key} value={key}>{optionLabel(key)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="theme-preview card" style={{ ...previewBox, marginTop: 20, padding: 16 }}>
          <p style={{ margin: '0 0 10px', fontWeight: 700 }}>
            Color preview · {(previewVars['--theme-mode'] || 'light') === 'dark' ? 'Dark mode' : 'Light mode'}
            {selectedLayout ? ` · Layout: ${selectedLayout.label}` : ''}
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <button type="button" className="btn" style={{ background: previewVars['--primary'], color: previewVars['--on-primary'] || '#fff', border: 0 }}>Primary</button>
            <button type="button" className="btn" style={{ background: previewVars['--primary-hover'], color: previewVars['--on-primary'] || '#fff', border: 0 }}>Hover</button>
            <button type="button" className="btn" style={{ background: 'transparent', color: previewVars['--primary'], border: `1px solid ${previewVars['--border']}` }}>Outline</button>
          </div>
        </div>

        <BusyButton className="btn btn-primary" type="submit" style={{ marginTop: 16 }} busy={saving} busyLabel="Saving…">
          Save theme & layout
        </BusyButton>
      </form>
    </div>
  );
}
