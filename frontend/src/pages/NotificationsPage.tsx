import { useEffect } from 'react';
import { useNotificationsStore } from '../stores/notificationsStore';

const NotificationsPage = () => {
  const items = useNotificationsStore((state) => state.items);
  const fetchNotifications = useNotificationsStore((state) => state.fetchNotifications);
  const markAsRead = useNotificationsStore((state) => state.markAsRead);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-800">Notifications</h1>
      <ul className="space-y-2">
        {items.length === 0 ? (
          <li className="rounded border border-slate-200 bg-white p-4 text-sm text-slate-500">No notifications yet.</li>
        ) : (
          items.map((notification) => (
            <li
              key={notification.id}
              className="flex items-center justify-between rounded border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div>
                <p className="text-sm font-medium text-slate-700">{notification.message}</p>
                <time className="text-xs text-slate-400">{new Date(notification.createdAt).toLocaleString()}</time>
              </div>
              {!notification.read && (
                <button
                  onClick={() => markAsRead(notification.id)}
                  className="rounded bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring focus-visible:ring-indigo-500"
                >
                  Mark as read
                </button>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default NotificationsPage;
