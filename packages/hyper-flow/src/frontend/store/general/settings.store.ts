import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Settings = {
  serverPort: number;
};

type SettingsStore = {
  // User open app for the first time
  firstOpen: boolean;
  serverStatus: "running" | "crashed";
  settings: Settings;
  setSettings: (settings: Partial<Settings>) => void;
  setServerPort: (port: number) => void;
  setServerStatus: (status: "running" | "crashed") => void;
};

export const useSettings = create<SettingsStore>()(
  persist(
    (set) => ({
      firstOpen: false,
      settings: {
        serverPort: 2137,
      },
      serverStatus: "running",
      setSettings: (newSettings: Partial<Settings>) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      setServerPort: (port: number) =>
        set((state) => ({
          settings: { ...state.settings, serverPort: port },
        })),
      setServerStatus: (status: "running" | "crashed") =>
        set(() => ({
          serverStatus: status,
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
