import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { imageUrl } from '../api/client';
import type { Download } from '../api/types';
import BusyButton from '../components/BusyButton';
import { useAuth } from '../context/AuthContext';

export default function DownloadsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    api.get('/downloads').then((r) => setDownloads(r.data));
  }, [user, navigate]);

  const downloadFile = async (id: number) => {
    setError('');
    setBusyId(id);
    try {
      const { data } = await api.post(`/downloads/${id}/link`);
      window.open(data.url, '_blank');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(msg || 'Could not start the download. Please contact support.');
    }
    setBusyId(null);
  };

  return (
    <div className="container page-pad">
      <h1 className="section-title">Your downloads</h1>
      {error && <p className="error-msg" style={{ marginBottom: 16 }}>{error}</p>}
      {downloads.length === 0 ? (
        <p className="admin-muted">No downloads yet. Purchase a digital product to get started.</p>
      ) : (
        <div className="grid-products">
          {downloads.map((d) => (
            <div key={d.id} className="card" style={{ padding: 16 }}>
              <img
                src={imageUrl(d.product?.preview_image)}
                alt=""
                style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8, marginBottom: 12 }}
              />
              <h3 style={{ fontSize: 15, marginBottom: 8 }}>{d.product?.title}</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                Downloaded {d.download_count} times
                {d.file_ready === false ? ' · File not uploaded yet' : ''}
              </p>
              <BusyButton
                className="btn btn-primary"
                onClick={() => downloadFile(d.id)}
                busy={busyId === d.id}
                disabled={d.file_ready === false}
                busyLabel="Preparing…"
              >
                {d.file_ready === false ? 'File unavailable' : 'Download'}
              </BusyButton>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
