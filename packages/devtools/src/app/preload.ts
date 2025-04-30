// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";
import * as Sentry from "@sentry/electron/renderer";
import { init } from "@sentry/react";

Sentry.init(
  {
    dsn: import.meta.env.VITE_SENTRY_DNS,
    environment: import.meta.env.VITE_ENVIRONMENT,
    integrations: [Sentry.browserTracingIntegration()],
  },
  init as any,
);

type StoreAPI = {
  get(key: string): Promise<any>;
  set(property: string, val: unknown): void;
  delete(key: string): unknown;
};

type ServerAPI = {
  status(): boolean;
  restart(options?: { port?: number }): Promise<{ running: boolean; port: number; success: boolean; message: string }>;
  onStatusChange(callback: (isRunning: boolean) => void): () => void;
};

export interface ExtendedElectronAPI {
  store: StoreAPI;
  server: ServerAPI;
}

// Custom APIs for renderer
// const api = {};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", {
      ...electronAPI,
      store: {
        get(key: string) {
          return ipcRenderer.sendSync("electron-store-get", key);
        },
        set(property: string, val: unknown) {
          ipcRenderer.send("electron-store-set", property, val);
        },
        delete(key: string) {
          return ipcRenderer.sendSync("electron-store-delete", key);
        },
        // Other method you want to add like has(), reset(), etc.
      },
      server: {
        status() {
          return ipcRenderer.sendSync("application-server-status");
        },
        restart(options) {
          return ipcRenderer.invoke("application-server-restart", options);
        },
        onStatusChange(callback) {
          const subscription = (_: any, isRunning: boolean) => callback(isRunning);
          ipcRenderer.on("application-server-status-change", subscription);

          // Return a function to remove the listener
          return () => {
            ipcRenderer.removeListener("application-server-status-change", subscription);
          };
        },
      },
    } as typeof electronAPI & ExtendedElectronAPI);
    // contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore (define in dts)
  window.electron = {
    ...electronAPI,
    store: {
      get(key: string) {
        return ipcRenderer.sendSync("electron-store-get", key);
      },
      set(property: string, val: unknown) {
        ipcRenderer.send("electron-store-set", property, val);
      },
      delete(key: string) {
        return ipcRenderer.sendSync("electron-store-delete", key);
      },
      // Other method you want to add like has(), reset(), etc.
    },
    server: {
      status() {
        return ipcRenderer.sendSync("application-server-status");
      },
      restart(options) {
        return ipcRenderer.invoke("application-server-restart", options);
      },
      onStatusChange(callback) {
        const subscription = (_: any, isRunning: boolean) => callback(isRunning);
        ipcRenderer.on("application-server-status-change", subscription);

        // Return a function to remove the listener
        return () => {
          ipcRenderer.removeListener("application-server-status-change", subscription);
        };
      },
    },
  } as typeof electronAPI & ExtendedElectronAPI;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore (define in dts)
  window.api = api;
}
