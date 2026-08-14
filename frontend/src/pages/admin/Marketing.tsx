import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import BusyButton from '../../components/BusyButton';
import { FormAlert } from '../../components/FormAlert';

interface UserRow {
  id: number;
  name: string;
  email: string;
  role: string;
  referral_code?: string;
  marketing_opt_in?: boolean;
  created_at: string;
}

interface Campaign {
  id: number;
  subject: string;
  audience: string;
  recipients_count: number;
  status: string;
  error_message?: string | null;
  sent_at?: string | null;
  created_at: string;
  user?: { id: number; name: string; email: string };
}

const TEMPLATES = [
  {
    label: 'New arrivals',
    subject: 'New supplies just landed',
    body: 'Hello,\n\nFresh tailoring materials are now live on The Tailors Market.\n\nBrowse the latest arrivals for your next project.\n\nVisit https://thetailorsmarket.com/browse\n\nThe Tailors Market',
  },
  {
    label: 'Promo offer',
    subject: 'Special offer on The Tailors Market',
    body: 'Hello,\n\nFor a limited time, enjoy special prices on selected tailoring supplies.\n\nShop now at https://thetailorsmarket.com\n\nThank you for being part of The Tailors Market.',
  },
  {
    label: 'Vendor invite',
    subject: 'Sell to tailors with us',
    body: 'Hello,\n\nDid you know you can open a shop on The Tailors Market and keep 90% of every sale?\n\nApply to sell: https://thetailorsmarket.com/sell\n\nWe would love to have your products on the marketplace.',
  },
];

const audienceLabel: Record<string, string> = {
  all_users: 'All users',
  opted_in: 'Opted-in users',
  newsletter: 'Newsletter list',
};

export default function AdminMarketing() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState({ total_users: 0, customers: 0, opted_in: 0, newsletter: 0, campaigns: 0 });
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState('opted_in');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const load = async () => {
    const [usersRes, campaignsRes] = await Promise.all([
      api.get('/admin/marketing/users', { params: search ? { search } : {} }),
      api.get('/admin/marketing/campaigns'),
    ]);
    setUsers(usersRes.data.users?.data || []);
    setStats(usersRes.data.stats);
    setCampaigns(campaignsRes.data.data || campaignsRes.data);
  };

  useEffect(() => {
    load().catch(() => setError('Failed to load marketing data'));
  }, []);

  const applyTemplate = (t: typeof TEMPLATES[number]) => {
    setSubject(t.subject);
    setBody(t.body);
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSending(true);
    try {
      const { data } = await api.post('/admin/marketing/send', { subject, body, audience });
      setMessage(data.message);
      setSubject('');
      setBody('');
      load();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Send failed');
    }
    setSending(false);
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Marketing</h1>
          <p className="admin-muted">
            Compose and send emails from the platform via SMTP. Manage the newsletter list separately in{' '}
            <Link to="/admin/newsletter">Newsletter</Link>.
          </p>
        </div>
      </div>

      <FormAlert
        error={error}
        message={message}
        onDismiss={() => { setError(''); setMessage(''); }}
      />

      <div className="admin-stat-grid" style={{ marginBottom: 24 }}>
        <div className="admin-stat-card card"><p className="admin-stat-label">Signed-up users</p><p className="admin-stat-value">{stats.total_users}</p></div>
        <div className="admin-stat-card card"><p className="admin-stat-label">Email opted-in</p><p className="admin-stat-value">{stats.opted_in}</p></div>
        <div className="admin-stat-card card"><p className="admin-stat-label">Newsletter</p><p className="admin-stat-value">{stats.newsletter}</p></div>
        <div className="admin-stat-card card"><p className="admin-stat-label">Campaigns sent</p><p className="admin-stat-value">{stats.campaigns}</p></div>
      </div>

      <form onSubmit={send} className="card admin-form-card" style={{ marginBottom: 32 }}>
        <h3>Compose campaign</h3>
        <div className="admin-format-chips" style={{ marginBottom: 16 }}>
          {TEMPLATES.map((t) => (
            <button key={t.label} type="button" className="btn btn-outline" onClick={() => applyTemplate(t)}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ marginBottom: 12 }}>
          <label className="label">Audience</label>
          <select className="input" value={audience} onChange={(e) => setAudience(e.target.value)}>
            <option value="opted_in">Users who opted in to marketing ({stats.opted_in})</option>
            <option value="newsletter">Newsletter subscribers ({stats.newsletter})</option>
            <option value="all_users">All signed-up users ({stats.total_users})</option>
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label className="label">Subject</label>
          <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} required minLength={3} maxLength={180} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label className="label">Message</label>
          <textarea className="input" rows={10} minLength={10} maxLength={20000} value={body} onChange={(e) => setBody(e.target.value)} required placeholder="Write your email. Separate paragraphs with a blank line." />
          <p className="help-text">Sent from info@thetailorsmarket.com. An unsubscribe link is added automatically.</p>
        </div>
        <BusyButton className="btn btn-primary" type="submit" busy={sending} busyLabel="Sending…">
          Send campaign
        </BusyButton>
      </form>

      <section className="admin-section" style={{ marginBottom: 32 }}>
        <div className="admin-section-header">
          <h2>Campaign history</h2>
        </div>
        {campaigns.length === 0 ? (
          <div className="admin-empty card">No campaigns sent yet.</div>
        ) : (
          <div className="table-scroll">
<table className="data-table card">
            <thead>
              <tr><th>Subject</th><th>Audience</th><th>Recipients</th><th>Status</th><th>Sent</th></tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.subject}</strong></td>
                  <td>{audienceLabel[c.audience] || c.audience}</td>
                  <td>{c.recipients_count}</td>
                  <td>
                    <span className={`admin-badge admin-badge--${c.status === 'sent' ? 'published' : 'draft'}`}>
                      {c.status}
                    </span>
                    {c.error_message && <p className="help-text">{c.error_message}</p>}
                  </td>
                  <td>{c.sent_at ? new Date(c.sent_at).toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
</div>
        )}
      </section>

      <div className="admin-page-header" style={{ marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Signed-up users</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load().catch(() => setError('Search failed'));
          }}
          className="form-toolbar"
        >
          <input className="input" placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="btn btn-outline" type="submit">Search</button>
        </form>
      </div>
      <div className="table-scroll">
<table className="data-table card">
        <thead>
          <tr><th>Name</th><th>Email</th><th>Invite code</th><th>Marketing</th><th>Joined</th></tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.referral_code}</td>
              <td>{u.marketing_opt_in === false ? 'opted out' : 'yes'}</td>
              <td>{new Date(u.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
</div>
    </div>
  );
}
