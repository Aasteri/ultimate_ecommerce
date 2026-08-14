import { useEffect, useState } from 'react';
import api, { formatPrice, imageUrl } from '../../api/client';
import type { Category, Product, ProductImage } from '../../api/types';
import { FieldError, IntegerInput, MoneyInput, DecimalInput } from '../../components/FormFields';
import BusyButton from '../../components/BusyButton';
import { FormAlert } from '../../components/FormAlert';
import ProductOfferPicker from '../../components/ProductOfferPicker';
import { ColorTagInput, FeatureTagInput } from '../../components/TagListInput';
import { flagsFromOffer, offerFromFlags, type ProductOffer } from '../../lib/productOffer';
import { apiErrorMessage, firstError, parseAmount, parseInteger, validateProductFields } from '../../lib/validation';

const FORMATS = ['DST', 'PES', 'JEF', 'EXP', 'VP3', 'HUS', 'XXX', 'TBF', 'EMB', 'PDF', 'ZIP'];
const MAX_IMAGES = 8;

const emptyForm = {
  title: '',
  description: '',
  category_id: '',
  offer: '' as ProductOffer | '',
  digital_price: '',
  physical_price: '',
  is_digital_available: false,
  is_physical_available: false,
  physical_stock: '0',
  width_mm: '',
  height_mm: '',
  status: 'draft',
  is_new_arrival: true,
  formats: [] as string[],
  colors: [] as string[],
  features: [] as string[],
};

type ProductDetail = Product & {
  files?: Array<{ id: number; version: number; is_current: boolean; formats_included?: string[] }>;
};

function flattenCategories(cats: Category[]): Category[] {
  return cats.flatMap((c) => [c, ...(c.children ?? [])]);
}

export default function VendorProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [gallery, setGallery] = useState<ProductImage[]>([]);
  const [files, setFiles] = useState<ProductDetail['files']>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const load = async () => {
    const [productsRes, categoriesRes] = await Promise.all([
      api.get('/vendor/products'),
      api.get('/categories'),
    ]);
    setProducts(productsRes.data.data || productsRes.data);
    setCategories(flattenCategories(categoriesRes.data));
    setLoading(false);
  };

  useEffect(() => { load().catch(() => setError('Failed to load products')); }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setGallery([]);
    setFiles([]);
    setPendingImages([]);
    setPendingFile(null);
    setFieldErrors({});
  };

  const closeForm = () => {
    resetForm();
    setError('');
    setMessage('');
  };

  const startEdit = async (p: Product) => {
    setEditingId(p.id);
    setShowForm(true);
    setError('');
    setMessage('');
    setFieldErrors({});
    setForm({
      title: p.title,
      description: p.description ?? '',
      category_id: p.category?.id ? String(p.category.id) : '',
      offer: offerFromFlags(p.is_digital_available, p.is_physical_available),
      digital_price: p.digital_price != null ? String(p.digital_price) : '',
      physical_price: p.physical_price != null ? String(p.physical_price) : '',
      is_digital_available: p.is_digital_available,
      is_physical_available: p.is_physical_available,
      physical_stock: String(p.physical_stock ?? 0),
      width_mm: p.width_mm != null ? String(p.width_mm) : '',
      height_mm: p.height_mm != null ? String(p.height_mm) : '',
      status: p.status,
      is_new_arrival: p.is_new_arrival,
      formats: p.formats?.map((f) => f.format) ?? [],
      colors: p.colors ?? [],
      features: p.features ?? [],
    });
    setGallery(p.images ?? []);
    try {
      const { data } = await api.get(`/vendor/products/${p.id}`);
      setFiles(data.files ?? []);
      setGallery(data.images ?? []);
      setForm((prev) => ({
        ...prev,
        formats: data.formats?.map((f: { format: string }) => f.format) ?? prev.formats,
        colors: data.colors ?? [],
        features: data.features ?? [],
      }));
    } catch {
      setFiles([]);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    const flags = form.offer ? flagsFromOffer(form.offer) : { is_digital_available: false, is_physical_available: false };
    const errors = validateProductFields({ ...form, offer: form.offer || '', ...flags });
    setFieldErrors(errors);
    const summary = firstError(errors);
    if (summary) {
      setError(summary);
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      ...flags,
      category_id: form.category_id ? parseInt(form.category_id, 10) : null,
      digital_price: flags.is_digital_available ? parseAmount(form.digital_price) : null,
      physical_price: flags.is_physical_available ? parseAmount(form.physical_price) : null,
      physical_stock: flags.is_physical_available ? (parseInteger(form.physical_stock) ?? 0) : 0,
      width_mm: flags.is_physical_available ? parseAmount(form.width_mm) : null,
      height_mm: flags.is_physical_available ? parseAmount(form.height_mm) : null,
      formats: flags.is_digital_available ? form.formats : [],
      colors: form.colors,
      features: form.features,
    };
    try {
      if (editingId) {
        await api.put(`/vendor/products/${editingId}`, payload);
        resetForm();
        setMessage('Product updated.');
        load();
      } else {
        const hadImages = pendingImages.length > 0;
        const hadFile = !!pendingFile;
        const { data } = await api.post('/vendor/products', payload);
        for (const file of pendingImages) {
          await uploadPreview(file, data.id, true);
        }
        if (pendingFile) await uploadFile(pendingFile, data.id, true);
        resetForm();
        if (hadImages || hadFile) {
          setMessage(flags.is_digital_available && !hadFile
            ? 'Product created and images uploaded. Edit the product to add the digital file.'
            : 'Product created and media uploaded.');
        } else {
          setMessage(flags.is_digital_available
            ? 'Product created. Click Edit to upload images and the digital file.'
            : 'Product created. Click Edit to upload product images.');
        }
        load();
      }
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Failed to save product'));
    }
    setSaving(false);
  };

  const uploadError = (err: unknown, fallback: string) => {
    const data = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response?.data;
    return data?.errors?.file?.[0] || data?.errors?.image?.[0] || data?.message || fallback;
  };

  const uploadPreview = async (file: File, productId?: number, quiet = false) => {
    const id = productId ?? editingId;
    if (!id) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.append('image', file);
      const { data } = await api.post(`/vendor/products/${id}/preview`, body);
      setGallery(data.images ?? []);
      if (!quiet) setMessage('Image uploaded.');
      load();
    } catch (err: unknown) {
      setError(uploadError(err, 'Failed to upload image'));
    }
    setUploading(false);
  };

  const deleteImage = async (imageId: number) => {
    if (!editingId || !confirm('Remove this image?')) return;
    setUploading(true);
    try {
      const { data } = await api.delete(`/vendor/products/${editingId}/images/${imageId}`);
      setGallery(data.images ?? []);
      setMessage('Image removed.');
      load();
    } catch (err: unknown) {
      setError(uploadError(err, 'Failed to remove image'));
    }
    setUploading(false);
  };

  const setPrimaryImage = async (imageId: number) => {
    if (!editingId) return;
    setUploading(true);
    try {
      const { data } = await api.post(`/vendor/products/${editingId}/images/${imageId}/primary`);
      setGallery(data.images ?? []);
      setMessage('Cover image updated.');
    } catch (err: unknown) {
      setError(uploadError(err, 'Failed to set cover image'));
    }
    setUploading(false);
  };

  const uploadFile = async (file: File, productId?: number, quiet = false) => {
    const id = productId ?? editingId;
    if (!id) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      form.formats.forEach((f) => body.append('formats_included[]', f));
      const { data } = await api.post(`/vendor/products/${id}/file`, body);
      setFiles((prev) => [{ ...data, is_current: true }, ...(prev ?? []).map((f) => ({ ...f, is_current: false }))]);
      if (!quiet) setMessage(`Digital file uploaded (version ${data.version}).`);
      load();
    } catch (err: unknown) {
      setError(uploadError(err, 'Failed to upload digital file (ZIP or pattern file, up to 100MB).'));
    }
    setUploading(false);
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this product?')) return;
    await api.delete(`/vendor/products/${id}`);
    if (editingId === id) resetForm();
    load();
  };

  const toggleFormat = (f: string) => {
    setForm((prev) => ({
      ...prev,
      formats: prev.formats.includes(f) ? prev.formats.filter((x) => x !== f) : [...prev.formats, f],
    }));
  };

  if (loading) return <p className="admin-muted">Loading products…</p>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Products</h1>
          <p className="admin-muted">{products.length} products in your shop</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (showForm) {
              closeForm();
            } else {
              setShowForm(true);
              setError('');
              setMessage('');
            }
          }}
        >
          {showForm ? 'Cancel' : 'Add product'}
        </button>
      </div>

      <FormAlert
        error={error}
        message={message}
        onDismiss={() => { setError(''); setMessage(''); }}
      />

      {showForm && (
        <form onSubmit={save} className="card admin-form-card">
          <h3>{editingId ? 'Edit product' : 'New product'}</h3>
          <ProductOfferPicker
            value={form.offer}
            onChange={(offer) => setForm({ ...form, offer, ...flagsFromOffer(offer) })}
          />
          {!form.offer ? (
            <p className="help-text">Select Digital, Physical, or Both to continue. The fields below change with your choice.</p>
          ) : (
          <>
          <div className="admin-form-grid">
            <div>
              <label className="label">Title</label>
              <input
                className={`input${fieldErrors.title ? ' is-invalid' : ''}`}
                value={form.title}
                maxLength={120}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
              <FieldError message={fieldErrors.title} />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            {form.is_digital_available && (
              <div>
                <label className="label">Digital price (₦)</label>
                <MoneyInput required value={form.digital_price} error={fieldErrors.digital_price} onChange={(digital_price) => setForm({ ...form, digital_price })} />
              </div>
            )}
            {form.is_physical_available && (
              <>
                <div>
                  <label className="label">Physical price (₦)</label>
                  <MoneyInput required value={form.physical_price} error={fieldErrors.physical_price} onChange={(physical_price) => setForm({ ...form, physical_price })} />
                </div>
                <div>
                  <label className="label">Stock</label>
                  <IntegerInput value={form.physical_stock} error={fieldErrors.physical_stock} onChange={(physical_stock) => setForm({ ...form, physical_stock })} />
                </div>
                <div>
                  <label className="label">Width (inches, optional)</label>
                  <DecimalInput value={form.width_mm} error={fieldErrors.width_mm} placeholder="e.g. 12" onChange={(width_mm) => setForm({ ...form, width_mm })} />
                </div>
                <div>
                  <label className="label">Height (inches, optional)</label>
                  <DecimalInput value={form.height_mm} error={fieldErrors.height_mm} placeholder="e.g. 24" onChange={(height_mm) => setForm({ ...form, height_mm })} />
                </div>
              </>
            )}
          </div>
          <div style={{ marginTop: 16 }}>
            <label className="label">Description</label>
            <textarea className="input" rows={3} maxLength={5000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="admin-form-grid" style={{ marginTop: 16 }}>
            <ColorTagInput values={form.colors} onChange={(colors) => setForm({ ...form, colors })} />
            <FeatureTagInput values={form.features} onChange={(features) => setForm({ ...form, features })} />
          </div>
          {form.is_digital_available && (
            <div style={{ marginTop: 16 }}>
              <label className="label">File formats (optional)</label>
              <div className="admin-format-chips">
                {FORMATS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={`btn ${form.formats.includes(f) ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => toggleFormat(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="admin-checkbox-row">
            <label><input type="checkbox" checked={form.is_new_arrival} onChange={(e) => setForm({ ...form, is_new_arrival: e.target.checked })} /> New arrival</label>
          </div>

          <div className="admin-upload-section">
              <h4>{form.is_digital_available ? 'Photos & digital file' : 'Product photos'}</h4>
              <p className="help-text" style={{ marginTop: 0, marginBottom: 16 }}>
                Up to {MAX_IMAGES} photos. The cover image is shown in listings.
              </p>
              <div className="product-gallery-editor">
                {gallery.map((img) => (
                  <div key={img.id} className={`gallery-thumb${img.is_primary ? ' is-primary' : ''}`}>
                    <img src={imageUrl(img.path)} alt="" />
                    <div className="gallery-thumb-actions">
                      {!img.is_primary && (
                        <button type="button" className="btn btn-ghost" disabled={uploading} onClick={() => setPrimaryImage(img.id)}>
                          Cover
                        </button>
                      )}
                      {img.is_primary && <span className="gallery-cover-label">Cover</span>}
                      <button type="button" className="btn btn-ghost" disabled={uploading} onClick={() => deleteImage(img.id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                {pendingImages.map((file, i) => (
                  <div key={`${file.name}-${i}`} className="gallery-thumb is-pending">
                    <div className="gallery-pending-label">{file.name}</div>
                    <button type="button" className="btn btn-ghost" onClick={() => setPendingImages((prev) => prev.filter((_, idx) => idx !== i))}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <div className="admin-upload-grid" style={{ marginTop: 12 }}>
                <div>
                  <label className="label">Add photos</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={uploading || (editingId ? gallery.length >= MAX_IMAGES : pendingImages.length >= MAX_IMAGES)}
                    onChange={(e) => {
                      const picked = Array.from(e.target.files ?? []);
                      if (!picked.length) return;
                      if (editingId) {
                        const room = MAX_IMAGES - gallery.length;
                        picked.slice(0, room).forEach((file) => { void uploadPreview(file); });
                      } else {
                        setPendingImages((prev) => [...prev, ...picked].slice(0, MAX_IMAGES));
                      }
                      e.target.value = '';
                    }}
                  />
                  {!editingId && pendingImages.length > 0 && (
                    <p className="help-text">{pendingImages.length} photo(s) ready to upload after save.</p>
                  )}
                </div>
                {form.is_digital_available && (
                <div>
                  <label className="label">Digital file (ZIP/PDF/pattern, up to 100MB)</label>
                  <input
                    type="file"
                    accept=".zip,.pdf,.dst,.pes,.jef,.exp,.vp3,.hus,.xxx,.tbf,.emb,application/zip,application/pdf"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (editingId) uploadFile(file);
                      else setPendingFile(file);
                      e.target.value = '';
                    }}
                  />
                  {pendingFile && !editingId && (
                    <p className="help-text">Ready to upload: {pendingFile.name}</p>
                  )}
                  {files && files.length > 0 && (
                    <ul className="admin-file-list">
                      {files.map((f) => (
                        <li key={f.id}>
                          Version {f.version}{f.is_current ? ' (current)' : ''}
                          {f.formats_included?.length ? ` · ${f.formats_included.join(', ')}` : ''}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                )}
              </div>
              {uploading && <p className="admin-muted" style={{ marginTop: 8 }}>Uploading…</p>}
            </div>
          <BusyButton
            className="btn btn-primary"
            type="submit"
            style={{ marginTop: 16 }}
            busy={saving || uploading}
            busyLabel={uploading ? 'Uploading…' : 'Saving…'}
          >
            {editingId ? 'Update product' : 'Save product'}
          </BusyButton>
          </>
          )}
        </form>
      )}

      {products.length === 0 ? (
        <div className="admin-empty card">No products yet. Add your first item.</div>
      ) : (
        <div className="table-scroll">
<table className="data-table card">
          <thead>
            <tr>
              <th>Preview</th><th>Title</th><th>Digital</th><th>Physical</th><th>Status</th><th>File</th><th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td><img src={imageUrl(p.preview_image)} alt="" className="admin-table-thumb" /></td>
                <td><strong>{p.title}</strong></td>
                <td>{formatPrice(p.digital_price ?? 0)}</td>
                <td>{formatPrice(p.physical_price ?? 0)}</td>
                <td><span className={`admin-badge admin-badge--${p.status}`}>{p.status}</span></td>
                <td>
                  {p.is_digital_available ? (
                    <span className={`admin-badge ${p.has_digital_file ? 'admin-badge--published' : 'admin-badge--draft'}`}>
                      {p.has_digital_file ? 'Uploaded' : 'Missing'}
                    </span>
                  ) : '—'}
                </td>
                <td className="admin-actions-cell">
                  <button type="button" className="btn btn-ghost" onClick={() => startEdit(p)}>Edit</button>
                  <button type="button" className="btn btn-ghost" onClick={() => remove(p.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
</div>
      )}
    </div>
  );
}
