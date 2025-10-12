import { create } from 'zustand';
import { api } from '../utils/api';

export interface RecordingItem {
  id: string;
  createdAt: string;
  durationSec: number;
  thumbUrl?: string | null;
  sizeMB: number;
}

interface RecordingsState {
  items: RecordingItem[];
  nextPageToken: string | null;
  loading: boolean;
  search: string;
  fetchRecordings: (params?: { q?: string; from?: string; to?: string; page?: string }) => Promise<void>;
  deleteRecording: (id: string) => Promise<void>;
}

export const useRecordingsStore = create<RecordingsState>((set) => ({
  items: [],
  nextPageToken: null,
  loading: false,
  search: '',
  fetchRecordings: async (params) => {
    set({ loading: true });
    try {
      const searchParams = new URLSearchParams();
      if (params?.q) searchParams.append('q', params.q);
      if (params?.from) searchParams.append('from', params.from);
      if (params?.to) searchParams.append('to', params.to);
      searchParams.append('page', params?.page ?? '1');
      const response = await api.get<{ items: RecordingItem[]; nextPageToken: string | null }>(
        `/api/recordings?${searchParams.toString()}`
      );
      set({ items: response.data.items, nextPageToken: response.data.nextPageToken });
    } finally {
      set({ loading: false });
    }
  },
  deleteRecording: async (id) => {
    await api.delete(`/api/recordings/${id}`);
    set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
  },
}));
