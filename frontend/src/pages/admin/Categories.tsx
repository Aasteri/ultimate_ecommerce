import { useEffect, useState } from 'react';
import api from '../../api/client';
import BusyButton from '../../components/BusyButton';
import { FormAlert } from '../../components/FormAlert';
import type { Category } from '../../api/types';

type CategoryRow = Category & { parent?: { name: string }; products_count?: number };

export default function AdminCategories() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [form, setForm] = useState({ name: '', parent_id: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = () => api.get('/admin/categories').then((r) => setCategories(r.data));

  useEffect(() => { load(); }, []);

  const parentOptions = categories.filter((c) => !c.parent_id);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name.trim().length < 2 || saving) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await api.post('/admin/categories', {
        name: form.name,
        parent_id: form.parent_id ? parseInt(form.parent_id, 10) : null,
      });
      setForm({ name: '', parent_id: '' });
      setMessage('Category added.');
      await load();
    } catch {
      setError('Could not add category.');
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async (id: number) => {
    if (busyId) return;
    setBusyId(id);
    setError('');
    setMessage('');
    try {
      await api.put(`/admin/categories/${id}`, { name: editName });
      setEditingId(null);
      setMessage('Category updated.');
      await load();
    } catch {
      setError('Could not update category.');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this category? Products will lose this category.') || busyId) return;
    setBusyId(id);
    setError('');
    setMessage('');
    try {
      await api.delete(`/admin/categories/${id}`);
      setMessage('Category deleted.');
      await load();
    } catch {
      setError('Could not delete category.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Categories</h1>
          <p className="admin-muted">{categories.length} categories</p>
        </div>
      </div>

      <FormAlert
        error={error}
        message={message}
        onDismiss={() => { setError(''); setMessage(''); }}
      />

      <form onSubmit={add} className="card admin-form-card admin-form-inline">
        <input className="input" value={form.name} maxLength={80} minLength={2} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Category name" required />
        <select className="input" value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })}>
          <option value="">Top-level category</option>
          {parentOptions.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <BusyButton className="btn btn-primary" type="submit" busy={saving} busyLabel="Adding…">
          Add category
        </BusyButton>
      </form>

      <div className="table-scroll">
        <table className="data-table card">
          <thead>
            <tr><th>Name</th><th>Parent</th><th>Slug</th><th>Products</th><th></th></tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <td>
                  {editingId === c.id ? (
                    <input className="input" value={editName} onChange={(e) => setEditName(e.target.value)} />
                  ) : (
                    <strong style={{ paddingLeft: c.parent_id ? 16 : 0 }}>{c.name}</strong>
                  )}
                </td>
                <td>{c.parent?.name ?? '—'}</td>
                <td>{c.slug}</td>
                <td>{c.products_count ?? c.published_products_count ?? 0}</td>
                <td className="admin-actions-cell">
                  {editingId === c.id ? (
                    <>
                      <BusyButton type="button" className="btn btn-primary" busy={busyId === c.id} busyLabel="Saving…" onClick={() => saveEdit(c.id)}>
                        Save
                      </BusyButton>
                      <button type="button" className="btn btn-ghost" disabled={busyId === c.id} onClick={() => setEditingId(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="btn btn-ghost" disabled={busyId === c.id} onClick={() => { setEditingId(c.id); setEditName(c.name); }}>Edit</button>
                      <BusyButton type="button" className="btn btn-ghost" busy={busyId === c.id} busyLabel="Deleting…" onClick={() => remove(c.id)}>
                        Delete
                      </BusyButton>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
