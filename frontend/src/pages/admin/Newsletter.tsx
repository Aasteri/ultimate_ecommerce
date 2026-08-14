import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import BusyButton from '../../components/BusyButton';
import { FormAlert } from '../../components/FormAlert';
import { apiErrorMessage, validateEmail } from '../../lib/validation';

interface Subscriber {
  id: number;
  email: string;
  is_active: boolean;
  created_at: string;
}

export default function AdminNewsletter() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [stats, setStats] = useState({ active: 0, inactive: 0, total: 0 });
  const [filter, setFilter] = useState('active');
  const [search, setSearch] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [adding, setAdding] = useState(false);

  const load = async () => {
    const { data } = await api.get('/admin/newsletter', {
      params: {
        status: filter === 'all' ? undefined : filter,
        search: search || undefined,
        per_page: 100,
      },
    });
    setSubscribers(data.subscribers?.data || data.data || []);
    setStats(data.stats || { active: 0, inactive: 0, total: 0 });
    setLoading(false);
  };

  useEffect(() => {
    load().catch(() => {
      setError('Failed to load subscribers');
      setLoading(false);
    });
  }, [filter]);

  const addSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    setAdding(true);
    try {
      await api.post('/admin/newsletter', { email });
      setEmail('');
      setMessage('Subscriber added.');
      load();
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Could not add subscriber'));
    }
    setAdding(false);
  };

  const setActive = async (id: number, is_active: boolean) => {
    await api.put(`/admin/newsletter/${id}`, { is_active });
    load();
  };

  const remove = async (id: number) => {
    if (!confirm('Remove this subscriber?')) return;
    await api.delete(`/admin/newsletter/${id}`);
    load();
  };

  const copyEmails = async () => {
    const emails = subscribers.filter((s) => s.is_active).map((s) => s.email).join(', ');
    await navigator.clipboard.writeText(emails);
    setMessage('Active emails copied to clipboard.');
  };

  const sendNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSending(true);
    try {
      const { data } = await api.post('/admin/marketing/send', {
        subject,
        body,
        audience: 'newsletter',
      });
      setMessage(data.message);
      setSubject('');
      setBody('');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Send failed');
    }
    setSending(false);
  };

  if (loading) return <p className="admin-muted">Loading subscribers…</p>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Newsletter</h1>
          <p className="admin-muted">
            {stats.active} active · {stats.inactive} inactive · Manage the list and send from here.{' '}
            <Link to="/admin/marketing">Full marketing tools →</Link>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select className="input" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ maxWidth: 140 }}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="all">All</option>
          </select>
          {subscribers.length > 0 && (
            <button type="button" className="btn btn-outline" onClick={copyEmails}>Copy emails</button>
          )}
        </div>
      </div>

      <FormAlert
        error={error}
        message={message}
        onDismiss={() => { setError(''); setMessage(''); }}
      />

      <form onSubmit={sendNewsletter} className="card admin-form-card" style={{ marginBottom: 24 }}>
        <h3>Send newsletter</h3>
        <p className="help-text" style={{ marginTop: 0 }}>Sends to all active newsletter subscribers via SMTP.</p>
        <div style={{ marginBottom: 12 }}>
          <label className="label">Subject</label>
          <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} required minLength={3} maxLength={180} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label className="label">Message</label>
          <textarea className="input" rows={8} minLength={10} maxLength={20000} value={body} onChange={(e) => setBody(e.target.value)} required />
        </div>
        <BusyButton className="btn btn-primary" type="submit" busy={sending} disabled={stats.active === 0} busyLabel="Sending…">
          {`Send to ${stats.active} subscribers`}
        </BusyButton>
      </form>

      <form onSubmit={addSubscriber} className="card admin-form-card" style={{ marginBottom: 24 }}>
        <h3>Add subscriber</h3>
        <div className="form-toolbar" style={{ marginBottom: 0 }}>
          <input
            className="input"
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <BusyButton className="btn btn-outline" type="submit" busy={adding} busyLabel="Adding…">
            Add
          </BusyButton>
        </div>
      </form>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          load().catch(() => setError('Search failed'));
        }}
        className="form-toolbar"
      >
        <input className="input" placeholder="Search email" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn btn-outline" type="submit">Search</button>
      </form>

      {subscribers.length === 0 ? (
        <div className="admin-empty card">No subscribers in this view yet. People can join from the homepage or footer.</div>
      ) : (
        <div className="table-scroll">
<table className="data-table card">
          <thead>
            <tr>
              <th>Email</th>
              <th>Status</th>
              <th>Subscribed</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map((s) => (
              <tr key={s.id}>
                <td>{s.email}</td>
                <td>
                  <span className={`admin-badge admin-badge--${s.is_active ? 'published' : 'draft'}`}>
                    {s.is_active ? 'active' : 'inactive'}
                  </span>
                </td>
                <td>{new Date(s.created_at).toLocaleDateString()}</td>
                <td className="admin-actions-cell">
                  {s.is_active ? (
                    <button type="button" className="btn btn-ghost" onClick={() => setActive(s.id, false)}>Deactivate</button>
                  ) : (
                    <button type="button" className="btn btn-ghost" onClick={() => setActive(s.id, true)}>Reactivate</button>
                  )}
                  <button type="button" className="btn btn-ghost" onClick={() => remove(s.id)}>Delete</button>
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
