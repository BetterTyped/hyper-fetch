import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type Settings = {
  ports: number[];
};

type SettingsStore = {
  settings: Settings;
  setSettings: (settings: Partial<Settings>) => void;
};

export const useSettings = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: {
        ports: [],
      },
      setSettings: (newSettings: Partial<Settings>) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      setPorts: (ports: number[]) =>
        set((state) => ({
          settings: { ...state.settings, ports },
        })),
      addPort: (port: number) =>
        set((state) => ({
          settings: { ...state.settings, ports: [...state.settings.ports, port] },
        })),
      removePort: (port: number) =>
        set((state) => ({
          settings: {
            ...state.settings,
            ports: state.settings.ports.filter((p) => p !== port),
          },
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
