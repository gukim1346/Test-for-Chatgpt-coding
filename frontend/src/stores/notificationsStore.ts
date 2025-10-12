import { create } from 'zustand';
import { api } from '../utils/api';

interface NotificationItem {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  read: boolean;
}

interface NotificationsState {
  items: NotificationItem[];
  nextPageToken: string | null;
  unreadCount: number;
  fetchNotifications: (pageToken?: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  items: [],
  nextPageToken: null,
  unreadCount: 0,
  fetchNotifications: async (pageToken) => {
    const response = await api.get<{ items: NotificationItem[]; nextPageToken: string | null }>(
      `/api/notifications?page=${pageToken ?? '1'}`
    );
    const items = pageToken ? [...get().items, ...response.data.items] : response.data.items;
    set({ items, nextPageToken: response.data.nextPageToken, unreadCount: items.filter((item) => !item.read).length });
  },
  markAsRead: async (id) => {
    await api.post(`/api/notifications/${id}/read`);
    set((state) => {
      const items = state.items.map((item) => (item.id === id ? { ...item, read: true } : item));
      return { items, unreadCount: items.filter((item) => !item.read).length };
    });
  },
}));
