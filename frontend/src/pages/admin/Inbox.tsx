import { useEffect, useState } from 'react';
import api from '../../api/client';
import BusyButton from '../../components/BusyButton';
import { FormAlert } from '../../components/FormAlert';
import { useAuth } from '../../context/AuthContext';

interface Msg {
  id: number;
  body: string;
  created_at: string;
  read_at?: string | null;
  sender?: { id: number; name: string; email: string };
  recipient?: { id: number; name: string; email: string } | null;
}

export default function AdminInbox() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [admins, setAdmins] = useState<Array<{ id: number; name: string; email: string }>>([]);
  const [body, setBody] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const load = () => api.get('/admin/inbox').then((r) => {
    setMessages(r.data.messages?.data || []);
    setAdmins(r.data.admins || []);
  });

  useEffect(() => { load().catch(() => setError('Failed to load inbox')); }, []);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSending(true);
    try {
      await api.post('/admin/inbox', { body, recipient_id: recipientId || null });
      setBody('');
      setMessage('Message sent.');
      load();
    } catch {
      setError('Could not send');
    }
    setSending(false);
  };

  return (
    <div className="admin-page">
      <h1>Admin inbox</h1>
      <p className="admin-muted" style={{ marginBottom: 24 }}>Message other admins in the app. They also get an email copy.</p>
      <FormAlert
        error={error}
        message={message}
        onDismiss={() => { setError(''); setMessage(''); }}
      />
      <form onSubmit={send} className="card admin-form-card" style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 12 }}>
          <label className="label">To</label>
          <select className="input" value={recipientId} onChange={(e) => setRecipientId(e.target.value)}>
            <option value="">All admins</option>
            {admins.map((a) => (
              <option key={a.id} value={a.id}>{a.name} ({a.email})</option>
            ))}
          </select>
        </div>
        <textarea className="input" rows={4} minLength={2} maxLength={5000} value={body} onChange={(e) => setBody(e.target.value)} required placeholder="Write a message…" />
        <BusyButton className="btn btn-primary" type="submit" style={{ marginTop: 12 }} busy={sending} busyLabel="Sending…">
          Send
        </BusyButton>
      </form>
      {messages.map((m) => (
        <div key={m.id} className="card" style={{ padding: 16, marginBottom: 12 }}>
          <div className="split-row">
            <strong>{m.sender?.id === user?.id ? 'You' : m.sender?.name}</strong>
            <span className="help-text">{new Date(m.created_at).toLocaleString()}</span>
          </div>
          <p className="help-text">To: {m.recipient ? m.recipient.name : 'All admins'}</p>
          <p style={{ marginTop: 8 }}>{m.body}</p>
        </div>
      ))}
    </div>
  );
}
