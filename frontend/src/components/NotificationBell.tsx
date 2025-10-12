import { useEffect } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { useNotificationsStore } from '../stores/notificationsStore';
import { useToast } from '../providers/ToastProvider';
import { useSocket } from '../providers/SocketProvider';
import { useNavigate } from 'react-router-dom';

export const NotificationBell = () => {
  const unreadCount = useNotificationsStore((state) => state.unreadCount);
  const fetchNotifications = useNotificationsStore((state) => state.fetchNotifications);
  const { showToast } = useToast();
  const socket = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!socket) return;
    const handleRing = () => {
      showToast({ message: 'Doorbell rang', tone: 'info' });
      fetchNotifications();
    };
    const handleMotion = () => {
      showToast({ message: 'Motion detected', tone: 'info' });
      fetchNotifications();
    };
    const handleUpload = () => {
      showToast({ message: 'New recording uploaded', tone: 'success' });
      fetchNotifications();
    };
    socket.on('ring', handleRing);
    socket.on('motion', handleMotion);
    socket.on('uploadComplete', handleUpload);
    return () => {
      socket.off('ring', handleRing);
      socket.off('motion', handleMotion);
      socket.off('uploadComplete', handleUpload);
    };
  }, [socket, showToast, fetchNotifications]);

  return (
    <button
      onClick={() => navigate('/notifications')}
      className="relative rounded-full p-2 text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring focus-visible:ring-indigo-500"
      aria-label="Notifications"
    >
      <BellIcon className="h-6 w-6" aria-hidden="true" />
      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
          {unreadCount}
        </span>
      )}
    </button>
  );
};
