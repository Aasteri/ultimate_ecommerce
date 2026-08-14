import { useEffect, useState } from 'react';
import api from '../../api/client';
import BusyButton from '../../components/BusyButton';
import { FormAlert } from '../../components/FormAlert';
import { apiErrorMessage, compactErrors, firstError, sanitizeSlug, validateTitle } from '../../lib/validation';

interface PageRow {
  id: number;
  title: string;
  slug: string;
  content: string;
  is_published: boolean;
}

const emptyForm = {
  title: '',
  slug: '',
  content: '',
  is_published: true,
};

export default function AdminPages() {
  const [pages, setPages] = useState<PageRow[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/admin/pages').then((r) => setPages(r.data));

  useEffect(() => { load(); }, []);

  const reset = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const closeForm = () => {
    reset();
    setError('');
    setMessage('');
  };

  const startEdit = (p: PageRow) => {
    setEditingId(p.id);
    setShowForm(true);
    setForm({
      title: p.title,
      slug: p.slug,
      content: p.content ?? '',
      is_published: p.is_published,
    });
  };

  const onTitleChange = (title: string) => {
    setForm((prev) => ({
      ...prev,
      title,
      slug: editingId ? prev.slug : sanitizeSlug(title),
    }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    const errors = compactErrors({
      title: validateTitle(form.title),
      slug: !form.slug.trim() ? 'Slug is required.' : !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug) ? 'Slug can only use lowercase letters, numbers and hyphens.' : null,
    });
    if (firstError(errors)) {
      setError(firstError(errors) || '');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/admin/pages/${editingId}`, form);
        setMessage('Page updated.');
      } else {
        await api.post('/admin/pages', form);
        setMessage('Page created.');
      }
      reset();
      load();
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Failed to save page'));
    }
    setSaving(false);
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this page?')) return;
    await api.delete(`/admin/pages/${id}`);
    if (editingId === id) reset();
    load();
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Pages</h1>
          <p className="admin-muted">Static content (How it works, FAQs, Terms, etc.)</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (showForm) closeForm();
            else {
              setShowForm(true);
              setError('');
              setMessage('');
            }
          }}
        >
          {showForm ? 'Cancel' : 'Add page'}
        </button>
      </div>

      <FormAlert
        error={error}
        message={message}
        onDismiss={() => { setError(''); setMessage(''); }}
      />

      {showForm && (
        <form onSubmit={save} className="card admin-form-card">
          <h3>{editingId ? 'Edit page' : 'New page'}</h3>
          <div className="admin-form-grid">
            <div>
              <label className="label">Title</label>
              <input className="input" value={form.title} onChange={(e) => onTitleChange(e.target.value)} required />
            </div>
            <div>
              <label className="label">Slug</label>
              <input className="input" value={form.slug} maxLength={80} onChange={(e) => setForm({ ...form, slug: sanitizeSlug(e.target.value) })} required />
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <label className="label">Content (HTML allowed)</label>
            <textarea
              className="input"
              rows={12}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="<h2>Heading</h2><p>Your content…</p>"
            />
          </div>
          <div className="admin-checkbox-row">
            <label>
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
              />
              Published
            </label>
          </div>
          <BusyButton className="btn btn-primary" type="submit" style={{ marginTop: 16 }} busy={saving} busyLabel="Saving…">
            {editingId ? 'Update page' : 'Create page'}
          </BusyButton>
        </form>
      )}

      {pages.length === 0 ? (
        <div className="admin-empty card">No pages yet.</div>
      ) : (
        <div className="table-scroll">
<table className="data-table card">
          <thead>
            <tr>
              <th>Title</th>
              <th>Slug</th>
              <th>Status</th>
              <th>URL</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pages.map((p) => (
              <tr key={p.id}>
                <td><strong>{p.title}</strong></td>
                <td>{p.slug}</td>
                <td>
                  <span className={`admin-badge admin-badge--${p.is_published ? 'published' : 'draft'}`}>
                    {p.is_published ? 'published' : 'draft'}
                  </span>
                </td>
                <td><a href={`/page/${p.slug}`} target="_blank" rel="noreferrer">/page/{p.slug}</a></td>
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
