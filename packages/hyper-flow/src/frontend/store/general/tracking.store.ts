import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Settings = {
  serverPort: number;
};

type TrackingStore = {
  firstOpen: boolean;
  setFirstOpen: (firstOpen: boolean) => void;
};

export const useTracking = create<TrackingStore>()(
  persist(
    (set) => ({
      firstOpen: false,
      setFirstOpen: (firstOpen: boolean) =>
        set(() => ({
          firstOpen,
        })),
    }),
    {
      name: "settings",
      storage: createJSONStorage(() => ({
        getItem: (key) => window.electron.store.get(key),
        setItem: (key, value) => window.electron.store.set(key, value),
        removeItem: (key) => window.electron.store.delete(key),
      })),
    },
  ),
);
