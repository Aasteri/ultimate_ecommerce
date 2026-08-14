import { useEffect, useState } from 'react';
import api from '../../api/client';
import BusyButton from '../../components/BusyButton';
import { FormAlert } from '../../components/FormAlert';
import { PhoneInput } from '../../components/FormFields';
import PasswordInput from '../../components/PasswordInput';
import type { Shop } from '../../api/types';
import { apiErrorMessage, compactErrors, firstError, validateEmail, validatePassword, validatePersonName, validatePhone } from '../../lib/validation';

interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  referral_code?: string;
  marketing_opt_in?: boolean;
  wallet_balance?: number | string;
  created_at: string;
  shop?: Pick<Shop, 'id' | 'name' | 'slug' | 'status'> | null;
}

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  role: 'customer',
  marketing_opt_in: true,
  password: '',
};

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState({ total: 0, customers: 0, admins: 0 });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await api.get('/admin/users', {
      params: {
        search: search || undefined,
        role: roleFilter || undefined,
        per_page: 50,
      },
    });
    setUsers(data.users?.data || data.data || []);
    setStats(data.stats || { total: 0, customers: 0, admins: 0 });
    setLoading(false);
  };

  useEffect(() => {
    load().catch(() => {
      setError('Failed to load users');
      setLoading(false);
    });
  }, [roleFilter]);

  const startEdit = (u: AdminUser) => {
    setEditing(u);
    setForm({
      name: u.name,
      email: u.email,
      phone: u.phone || '',
      role: u.role,
      marketing_opt_in: u.marketing_opt_in !== false,
      password: '',
    });
    setError('');
    setMessage('');
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const errors = compactErrors({
      name: validatePersonName(form.name),
      email: validateEmail(form.email),
      phone: validatePhone(form.phone),
      password: form.password ? validatePassword(form.password) : null,
    });
    if (firstError(errors)) {
      setError(firstError(errors) || '');
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        role: form.role,
        marketing_opt_in: form.marketing_opt_in,
      };
      if (form.password) payload.password = form.password;
      await api.put(`/admin/users/${editing.id}`, payload);
      setEditing(null);
      setForm(emptyForm);
      setMessage('User updated.');
      load();
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Update failed'));
    }
    setSaving(false);
  };

  if (loading) return <p className="admin-muted">Loading users…</p>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Users</h1>
          <p className="admin-muted">{stats.total} accounts · {stats.customers} customers · {stats.admins} admins</p>
        </div>
      </div>

      <FormAlert
        error={error}
        message={message}
        onDismiss={() => { setError(''); setMessage(''); }}
      />

      {editing && (
        <form onSubmit={save} className="card admin-form-card" style={{ marginBottom: 24 }}>
          <div className="split-row" style={{ marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Edit user #{editing.id}</h3>
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Close</button>
          </div>
          <div className="admin-form-grid">
            <div>
              <label className="label">Name</label>
              <input className="input" value={form.name} maxLength={80} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="label">Phone</label>
              <PhoneInput value={form.phone} onChange={(phone) => setForm({ ...form, phone })} />
            </div>
            <div>
              <label className="label">Role</label>
              <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="label">New password (optional)</label>
              <PasswordInput value={form.password} onChange={(password) => setForm({ ...form, password })} minLength={8} autoComplete="new-password" />
              <p className="help-text">Leave blank to keep their current password. Setting a new one signs them out everywhere.</p>
            </div>
          </div>
          <label style={{ display: 'flex', gap: 8, marginTop: 16, marginBottom: 16 }}>
            <input
              type="checkbox"
              checked={form.marketing_opt_in}
              onChange={(e) => setForm({ ...form, marketing_opt_in: e.target.checked })}
            />
            Marketing emails opted in
          </label>
          {editing.shop && (
            <p className="help-text" style={{ marginBottom: 16 }}>
              Shop: {editing.shop.name} ({editing.shop.status}) — manage shops under Shops.
            </p>
          )}
          <BusyButton className="btn btn-primary" type="submit" busy={saving} busyLabel="Saving…">
            Save user
          </BusyButton>
        </form>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          load().catch(() => setError('Search failed'));
        }}
        className="form-toolbar"
      >
        <input className="input" placeholder="Search name, email, phone" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          <option value="customer">Customers</option>
          <option value="admin">Admins</option>
        </select>
        <button className="btn btn-outline" type="submit">Search</button>
      </form>

      {users.length === 0 ? (
        <div className="admin-empty card">No users found.</div>
      ) : (
        <div className="table-scroll">
          <table className="data-table card">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Shop</th>
              <th>Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <strong>{u.name}</strong>
                  {u.phone && <p className="help-text">{u.phone}</p>}
                </td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.shop ? `${u.shop.name} (${u.shop.status})` : '—'}</td>
                <td>{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="admin-actions-cell">
                  <button type="button" className="btn btn-ghost" onClick={() => startEdit(u)}>Edit</button>
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
