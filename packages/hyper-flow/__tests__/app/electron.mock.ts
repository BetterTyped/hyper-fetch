/**
 * A stand-in for the Electron main process API. Electron can't run inside Vitest, so the main-process modules talk to
 * this instead: IPC handlers can be invoked like the renderer would, and windows, clipboard and menu record calls.
 */
import type { Mock } from "vitest";

type Handler = (event: IpcEvent, ...args: unknown[]) => unknown;

export type IpcEvent = { returnValue?: unknown; sender: { id: number } };

export type FakeWindow = {
  id: number;
  webContents: { id: number; send: Mock; openDevTools: Mock };
  minimize: Mock;
  maximize: Mock;
  unmaximize: Mock;
  isMaximized: Mock<() => boolean>;
  close: Mock;
  reload: Mock;
  capturePage: Mock;
};

export const createFakeWindow = (id = 1): FakeWindow => ({
  id,
  webContents: { id, send: vi.fn(), openDevTools: vi.fn() },
  minimize: vi.fn(),
  maximize: vi.fn(),
  unmaximize: vi.fn(),
  isMaximized: vi.fn(() => false),
  close: vi.fn(),
  reload: vi.fn(),
  capturePage: vi.fn(async () => ({ image: id })),
});

/** Windows the app created with `new BrowserWindow()` */
export class FakeBrowserWindow {
  static created: FakeBrowserWindow[] = [];

  static getAllWindows: Mock = vi.fn((): unknown[] => []);

  static fromWebContents: Mock = vi.fn((): unknown => null);

  loadURL: Mock = vi.fn();

  loadFile: Mock = vi.fn();

  openHandler: ((details: { url: string }) => { action: string }) | null = null;

  webContents: { send: Mock; setWindowOpenHandler: Mock } = {
    send: vi.fn(),
    setWindowOpenHandler: vi.fn((handler: (details: { url: string }) => { action: string }) => {
      this.openHandler = handler;
    }),
  };

  constructor(public options: Record<string, unknown>) {
    FakeBrowserWindow.created.push(this);
  }
}

type AppHandler = (...args: unknown[]) => unknown;

type FakeElectron = {
  ipcMain: { on: Mock; handle: Mock };
  app: {
    isPackaged: boolean;
    quit: Mock;
    getVersion: Mock;
    on: Mock;
    whenReady: Mock;
    /** Runs the handlers the app registered for an event */
    emit: (event: string, ...args: unknown[]) => Promise<void>;
  };
  BrowserWindow: typeof FakeBrowserWindow;
  clipboard: { write: Mock; writeImage: Mock };
  nativeImage: { createFromBuffer: Mock };
  Menu: { buildFromTemplate: Mock; setApplicationMenu: Mock };
  shell: { openExternal: Mock };
  send: (channel: string, ...args: unknown[]) => Promise<unknown>;
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
  setWindows: (next: FakeWindow[]) => void;
  reset: () => void;
};

export const electron: FakeElectron = (() => {
  const listeners = new Map<string, Handler>();
  const invokers = new Map<string, Handler>();
  let windows: FakeWindow[] = [];
  const appHandlers = new Map<string, AppHandler[]>();

  FakeBrowserWindow.getAllWindows.mockImplementation(() => [...windows, ...FakeBrowserWindow.created]);
  FakeBrowserWindow.fromWebContents.mockImplementation(
    (sender: { id: number }) => windows.find((window) => window.id === sender.id) ?? null,
  );

  const ipcMain = {
    on: vi.fn((channel: string, handler: Handler) => {
      listeners.set(channel, handler);
    }),
    handle: vi.fn((channel: string, handler: Handler) => {
      invokers.set(channel, handler);
    }),
  };

  return {
    ipcMain,
    app: {
      isPackaged: false,
      quit: vi.fn(),
      getVersion: vi.fn(() => "1.2.3"),
      on: vi.fn((event: string, handler: AppHandler) => {
        appHandlers.set(event, [...(appHandlers.get(event) ?? []), handler]);
      }),
      whenReady: vi.fn(() => Promise.resolve()),
      emit: async (event: string, ...args: unknown[]) => {
        for (const handler of appHandlers.get(event) ?? []) {
          // eslint-disable-next-line no-await-in-loop
          await handler(...args);
        }
      },
    },
    BrowserWindow: FakeBrowserWindow,
    clipboard: { write: vi.fn(), writeImage: vi.fn() },
    nativeImage: { createFromBuffer: vi.fn((buffer: Buffer) => ({ buffer })) },
    Menu: { buildFromTemplate: vi.fn((template: unknown[]) => ({ template })), setApplicationMenu: vi.fn() },
    shell: { openExternal: vi.fn(() => Promise.resolve()) },
    /** What `ipcRenderer.sendSync` / `send` would do, returns `event.returnValue` */
    send: async (channel: string, ...args: unknown[]) => {
      const handler = listeners.get(channel);
      if (!handler) {
        throw new Error(`No listener for ${channel}`);
      }
      const event: IpcEvent = { sender: { id: windows[0]?.id ?? 1 } };
      await handler(event, ...args);
      return event.returnValue;
    },
    /** What `ipcRenderer.invoke` would do */
    invoke: async (channel: string, ...args: unknown[]) => {
      const handler = invokers.get(channel);
      if (!handler) {
        throw new Error(`No handler for ${channel}`);
      }
      return handler({ sender: { id: windows[0]?.id ?? 1 } }, ...args);
    },
    setWindows: (next: FakeWindow[]) => {
      windows = next;
    },
    reset: () => {
      listeners.clear();
      invokers.clear();
      appHandlers.clear();
      windows = [];
      FakeBrowserWindow.created = [];
    },
  };
})();

/** In-memory electron-store */
export class FakeStore {
  static data = new Map<string, unknown>();

  get = (key: string) => FakeStore.data.get(key);

  set = (key: string, value: unknown) => {
    FakeStore.data.set(key, value);
  };

  delete = (key: string) => {
    if (key === "locked") {
      throw new Error("Store is locked");
    }
    FakeStore.data.delete(key);
  };
}
