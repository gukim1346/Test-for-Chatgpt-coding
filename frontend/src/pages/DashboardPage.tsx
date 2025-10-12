import { useEffect } from 'react';
import { LivePanel } from '../components/LivePanel';
import { useNotificationsStore } from '../stores/notificationsStore';

const DashboardPage = () => {
  const fetchNotifications = useNotificationsStore((state) => state.fetchNotifications);
  const items = useNotificationsStore((state) => state.items);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const recent = items.slice(0, 5);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>
      <LivePanel />
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-700">Recent Notifications</h2>
        <ul className="mt-3 space-y-2">
          {recent.length === 0 ? (
            <li className="text-sm text-slate-500">No notifications yet.</li>
          ) : (
            recent.map((notification) => (
              <li key={notification.id} className="flex items-center justify-between text-sm text-slate-600">
                <span>{notification.message}</span>
                <time className="text-xs text-slate-400">{new Date(notification.createdAt).toLocaleString()}</time>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
};

export default DashboardPage;
