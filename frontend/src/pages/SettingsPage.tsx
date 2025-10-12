import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../providers/AuthProvider';

const SettingsPage = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<'Online' | 'Offline' | 'Unknown'>('Unknown');
  const [lastRingAt, setLastRingAt] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await api.get<{ status: string; lastRingAt?: string }>('/api/health');
        setStatus(response.data.status === 'ok' ? 'Online' : 'Offline');
        setLastRingAt(response.data.lastRingAt ?? null);
      } catch (error) {
        setStatus('Offline');
      }
    };
    fetchHealth();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">Settings</h1>
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-700">Device</h2>
        <p className="text-sm text-slate-600">Hostname: doorbell.local</p>
        <p className="text-sm text-slate-600">Status: {status}</p>
        {lastRingAt && <p className="text-sm text-slate-600">Last ring: {new Date(lastRingAt).toLocaleString()}</p>}
      </section>
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-700">Profile</h2>
        <p className="text-sm text-slate-600">Email: {user?.email}</p>
        <button className="mt-2 rounded bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700" disabled>
          Change password (coming soon)
        </button>
      </section>
    </div>
  );
};

export default SettingsPage;
