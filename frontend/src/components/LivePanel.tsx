import { useEffect, useRef, useState } from 'react';
import { api } from '../utils/api';
import { useSocket } from '../providers/SocketProvider';
import { useToast } from '../providers/ToastProvider';
import { useDeviceStore } from '../stores/deviceStore';
import clsx from 'clsx';

const SNAPSHOT_INTERVAL = 750;
const SERVO_THROTTLE_MS = 160;

export const LivePanel = () => {
  const socket = useSocket();
  const { showToast } = useToast();
  const { led, servo, setState } = useDeviceStore();
  const [unlocking, setUnlocking] = useState(false);
  const [snapshotUrl, setSnapshotUrl] = useState<string>('');
  const lastServoEmit = useRef(0);

  useEffect(() => {
    if (!socket) return;
    const onStatus = (payload: { led: boolean; servo: number }) => {
      setState(payload);
    };
    socket.on('status', onStatus);
    return () => {
      socket.off('status', onStatus);
    };
  }, [socket, setState]);

  useEffect(() => {
    let timer: number;
    const fetchSnapshot = async () => {
      try {
        const response = await api.get('/api/snapshot', { responseType: 'blob' });
        const blobUrl = URL.createObjectURL(response.data);
        setSnapshotUrl(blobUrl);
      } catch (error) {
        // ignore fetch errors, snapshot may be unavailable until camera uploads
      } finally {
        timer = window.setTimeout(fetchSnapshot, SNAPSHOT_INTERVAL);
      }
    };
    fetchSnapshot();
    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const handleUnlock = () => {
    if (!socket || unlocking) return;
    setUnlocking(true);
    socket.emit('unlock', { ms: 2000 }, () => {
      showToast({ message: 'Door unlocked', tone: 'success' });
    });
    setTimeout(() => setUnlocking(false), 3000);
  };

  const handleToggleLed = () => {
    if (!socket) return;
    const next = !led;
    setState({ led: next });
    socket.emit('led', { on: next }, (response: { ok: boolean }) => {
      if (!response?.ok) {
        setState({ led: !next });
        showToast({ message: 'Failed to toggle LED', tone: 'error' });
      }
    });
  };

  const handleServoChange = (angle: number) => {
    if (!socket) return;
    const now = Date.now();
    if (now - lastServoEmit.current < SERVO_THROTTLE_MS) {
      setState({ servo: angle });
      return;
    }
    lastServoEmit.current = now;
    setState({ servo: angle });
    socket.emit('servo', { angle }, (response: { ok: boolean }) => {
      if (!response?.ok) {
        showToast({ message: 'Failed to move servo', tone: 'error' });
      }
    });
  };

  return (
    <section className="grid gap-6 md:grid-cols-2">
      <div className="flex flex-col rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">Live Snapshot</div>
        <div className="flex min-h-[280px] items-center justify-center bg-slate-100">
          {snapshotUrl ? (
            <img src={snapshotUrl} alt="Latest snapshot" className="h-full w-full object-contain" />
          ) : (
            <span className="text-sm text-slate-500">Waiting for snapshot...</span>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-700">Controls</h2>
        <button
          onClick={handleUnlock}
          disabled={unlocking}
          className={clsx(
            'rounded-md px-4 py-2 text-sm font-semibold text-white focus:outline-none focus-visible:ring focus-visible:ring-indigo-500',
            unlocking ? 'bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700'
          )}
        >
          {unlocking ? 'Unlocking…' : 'Unlock Door'}
        </button>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">LED</span>
          <button
            onClick={handleToggleLed}
            className={clsx(
              'relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none focus-visible:ring focus-visible:ring-indigo-500',
              led ? 'bg-emerald-500' : 'bg-slate-300'
            )}
          >
            <span
              className={clsx(
                'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                led ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Servo Angle: {servo}°
          <input
            type="range"
            min="0"
            max="180"
            value={servo}
            onChange={(event) => handleServoChange(Number(event.target.value))}
          />
        </label>
      </div>
    </section>
  );
};
