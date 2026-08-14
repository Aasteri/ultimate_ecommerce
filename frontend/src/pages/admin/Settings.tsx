import { useEffect, useState } from 'react';
import api from '../../api/client';
import { FieldError, PercentInput } from '../../components/FormFields';
import BusyButton from '../../components/BusyButton';
import { useFeedback } from '../../context/FeedbackContext';
import { compactErrors, firstError, validateEmail, validatePercent, validateTitle } from '../../lib/validation';

export default function AdminSettings() {
  const { success, error: toastError } = useFeedback();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    api.get('/admin/settings')
      .then((r) => setSettings(r.data))
      .catch(() => toastError('Failed to load settings'))
      .finally(() => setLoading(false));
  }, [toastError]);

  const mode = settings.flutterwave_mode === 'live' ? 'live' : 'test';
  const liveEnabled = mode === 'live';

  const setField = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = compactErrors({
      site_name: validateTitle(settings.site_name || '', 'Site name'),
      contact_email: settings.contact_email ? validateEmail(settings.contact_email, 'Contact email') : null,
      platform_commission_percent: validatePercent(settings.platform_commission_percent || '10', 'Platform commission'),
      referral_percent: validatePercent(settings.referral_percent || '10', 'Referral reward'),
      currency: !settings.currency?.trim()
        ? 'Currency is required.'
        : !/^[A-Za-z]{3}$/.test(settings.currency.trim())
          ? 'Currency must be a 3-letter code, e.g. NGN.'
          : null,
    });
    setFieldErrors(errors);
    const summary = firstError(errors);
    if (summary) {
      toastError(summary);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...settings,
        flutterwave_live_public_key: settings.flutterwave_live_public_key ?? '',
        flutterwave_live_secret_key: settings.flutterwave_live_secret_key ?? '',
        flutterwave_live_encryption_key: settings.flutterwave_live_encryption_key ?? '',
        flutterwave_mode: mode,
      };
      const { data } = await api.put('/admin/settings', { settings: payload });
      if (data.settings) setSettings(data.settings);
      success(data.message || 'Settings saved.');
    } catch (err: unknown) {
      toastError((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to save settings');
    }
    setSaving(false);
  };

  if (loading) return <p className="admin-muted">Loading settings…</p>;

  return (
    <div className="admin-page">
      <h1>Settings</h1>
      <p className="admin-muted" style={{ marginBottom: 24 }}>Store and payment configuration</p>

      <form onSubmit={save} className="card admin-form-card" style={{ maxWidth: 560 }}>
        <h3 style={{ marginBottom: 16 }}>Store</h3>
        {[
          { key: 'site_name', label: 'Site name' },
          { key: 'site_description', label: 'Site description' },
          { key: 'contact_email', label: 'Contact email', type: 'email' },
          { key: 'social_tiktok', label: 'TikTok URL' },
          { key: 'social_youtube', label: 'YouTube URL' },
        ].map(({ key, label, type }) => (
          <div key={key} style={{ marginBottom: 16 }}>
            <label className="label">{label}</label>
            <input
              className={`input${fieldErrors[key] ? ' is-invalid' : ''}`}
              type={type || 'text'}
              value={settings[key] || ''}
              onChange={(e) => setField(key, e.target.value)}
            />
            <FieldError message={fieldErrors[key]} />
          </div>
        ))}
        <div style={{ marginBottom: 16 }}>
          <label className="label">Currency</label>
          <input
            className={`input${fieldErrors.currency ? ' is-invalid' : ''}`}
            value={settings.currency || ''}
            maxLength={3}
            onChange={(e) => setField('currency', e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3))}
          />
          <FieldError message={fieldErrors.currency} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label className="label">Platform commission % (vendor sales)</label>
          <PercentInput
            value={settings.platform_commission_percent || ''}
            error={fieldErrors.platform_commission_percent}
            onChange={(value) => setField('platform_commission_percent', value)}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label className="label">Referral reward % (first purchase)</label>
          <PercentInput
            value={settings.referral_percent || ''}
            error={fieldErrors.referral_percent}
            onChange={(value) => setField('referral_percent', value)}
          />
        </div>

        <h3 style={{ margin: '28px 0 8px' }}>Flutterwave payments</h3>
        <p className="help-text" style={{ marginBottom: 16 }}>
          Test mode uses Flutterwave Inline <strong>v3</strong> (FLWPUBK_TEST / FLWSECK_TEST). Live mode uses Flutterwave <strong>v4</strong> OAuth (Client ID / Client Secret) and redirects to Flutterwave Checkout — we adapt our code to your keys; you do not need v3 live FLWPUBK/FLWSECK.
        </p>

        <div className="payment-mode-switch" style={{ marginBottom: 20 }}>
          <button
            type="button"
            className={`btn ${mode === 'test' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setField('flutterwave_mode', 'test')}
          >
            Test mode (v3)
          </button>
          <button
            type="button"
            className={`btn ${mode === 'live' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setField('flutterwave_mode', 'live')}
          >
            Live mode (v4)
          </button>
        </div>

        {mode === 'test' ? (
          <div className="notice-card notice-ok" style={{ marginBottom: 16 }}>
            Checkout uses the v3 test modal and test cards. No real money is charged.
          </div>
        ) : (
          <div className="notice-card notice-warn" style={{ marginBottom: 16 }}>
            Live mode is on. Customers are redirected to Flutterwave v4 Checkout. Real money is charged.
          </div>
        )}

        <h4 style={{ marginBottom: 12 }}>Test API keys (v3 Inline)</h4>
        {[
          { key: 'flutterwave_public_key', label: 'Test public key (FLWPUBK_TEST-…)', placeholder: 'FLWPUBK_TEST-…' },
          { key: 'flutterwave_secret_key', label: 'Test secret key (FLWSECK_TEST-…)', placeholder: 'FLWSECK_TEST-…' },
          { key: 'flutterwave_encryption_key', label: 'Test encryption key', placeholder: '' },
        ].map(({ key, label, placeholder }) => (
          <div key={key} style={{ marginBottom: 16 }}>
            <label className="label">{label}</label>
            <input
              className="input"
              value={settings[key] || ''}
              onChange={(e) => setField(key, e.target.value)}
              disabled={liveEnabled}
              placeholder={placeholder}
              style={liveEnabled ? { opacity: 0.55, background: '#f3f4f6' } : undefined}
            />
          </div>
        ))}

        <h4 style={{ margin: '20px 0 8px' }}>Live API credentials (v4)</h4>
        <p className="help-text" style={{ marginBottom: 12 }}>
          From Flutterwave → Settings → API Keys, switch to <strong>v4 live</strong> and paste Client ID, Client Secret, and Encryption key. You can save these while still in test mode, then switch to live.
        </p>
        {[
          { key: 'flutterwave_live_public_key', label: 'Client ID', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
          { key: 'flutterwave_live_secret_key', label: 'Client Secret', placeholder: 'Your v4 client secret' },
          { key: 'flutterwave_live_encryption_key', label: 'Encryption key', placeholder: 'Base64 encryption key' },
        ].map(({ key, label, placeholder }) => (
          <div key={key} style={{ marginBottom: 16 }}>
            <label className="label">{label}</label>
            <input
              className="input"
              value={settings[key] || ''}
              onChange={(e) => setField(key, e.target.value)}
              autoComplete="off"
              spellCheck={false}
              placeholder={placeholder}
            />
          </div>
        ))}

        <BusyButton className="btn btn-primary" type="submit" busy={saving} busyLabel="Saving…">
          Save settings
        </BusyButton>
      </form>
    </div>
  );
}

export function AdminMessages() {
  const { success, error: toastError } = useFeedback();
  const [messages, setMessages] = useState<Array<{
    id: number; name: string; email: string; subject?: string; message: string;
    is_read: boolean; created_at: string; reply_body?: string | null; replied_at?: string | null;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [replies, setReplies] = useState<Record<number, string>>({});
  const [sendingId, setSendingId] = useState<number | null>(null);

  const load = () => api.get('/admin/messages').then((r) => {
    setMessages(r.data.data || r.data);
    setLoading(false);
  });

  useEffect(() => { load().catch(() => setLoading(false)); }, []);

  const markRead = async (id: number) => {
    await api.put(`/admin/messages/${id}/read`);
    success('Marked as read');
    load();
  };

  const reply = async (id: number) => {
    setSendingId(id);
    try {
      await api.post(`/admin/messages/${id}/reply`, { body: replies[id] });
      setReplies((prev) => ({ ...prev, [id]: '' }));
      success('Reply emailed to the customer');
      load();
    } catch (err: unknown) {
      toastError((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Reply failed');
    }
    setSendingId(null);
  };

  if (loading) return <p className="admin-muted">Loading messages…</p>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Contact messages</h1>
          <p className="admin-muted">{messages.filter((m) => !m.is_read).length} unread · replies are emailed to the sender</p>
        </div>
      </div>
      {messages.length === 0 ? (
        <div className="admin-empty card">No contact messages yet.</div>
      ) : (
        messages.map((m) => (
          <div key={m.id} className="card" style={{ padding: 16, marginBottom: 12, opacity: m.is_read ? 0.85 : 1 }}>
            <div className="split-row">
              <strong>{m.name}</strong>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(m.created_at).toLocaleDateString()}</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{m.email}</p>
            {m.subject && <p style={{ fontWeight: 500 }}>{m.subject}</p>}
            <p style={{ marginTop: 8 }}>{m.message}</p>
            {m.reply_body && (
              <div className="notice-card notice-ok" style={{ marginTop: 12 }}>
                <p className="help-text">Replied {m.replied_at ? new Date(m.replied_at).toLocaleString() : ''}</p>
                <p>{m.reply_body}</p>
              </div>
            )}
            {!m.reply_body && (
              <div style={{ marginTop: 12 }}>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Reply by email…"
                  value={replies[m.id] || ''}
                  onChange={(e) => setReplies((prev) => ({ ...prev, [m.id]: e.target.value }))}
                />
                <BusyButton type="button" className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => reply(m.id)} busy={sendingId === m.id} disabled={!replies[m.id]} busyLabel="Sending…">
                  Send reply
                </BusyButton>
              </div>
            )}
            {!m.is_read && (
              <button type="button" className="btn btn-outline" style={{ marginTop: 8 }} onClick={() => markRead(m.id)}>
                Mark read
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}
