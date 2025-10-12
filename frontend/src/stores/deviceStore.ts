import { create } from 'zustand';

interface DeviceState {
  led: boolean;
  servo: number;
  lastRingAt?: string;
}

interface DeviceStore extends DeviceState {
  setState: (state: Partial<DeviceState>) => void;
}

export const useDeviceStore = create<DeviceStore>((set) => ({
  led: false,
  servo: 90,
  lastRingAt: undefined,
  setState: (state) => set((prev) => ({ ...prev, ...state })),
}));
