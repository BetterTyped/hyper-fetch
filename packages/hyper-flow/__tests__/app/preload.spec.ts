// @vitest-environment node
import type { Mock } from "vitest";

const ipcRenderer: { sendSync: Mock; send: Mock; invoke: Mock; on: Mock; removeListener: Mock } = vi.hoisted(() => ({
  sendSync: vi.fn((channel: string) => `sync:${channel}`),
  send: vi.fn(),
  invoke: vi.fn(async () => ({ success: true })),
  on: vi.fn(),
  removeListener: vi.fn(),
}));
const contextBridge: { exposeInMainWorld: Mock } = vi.hoisted(() => ({ exposeInMainWorld: vi.fn() }));

vi.mock("electron", () => ({ ipcRenderer, contextBridge }));
vi.mock("@electron-toolkit/preload", () => ({ electronAPI: { process: { platform: "darwin" } } }));
vi.mock("@sentry/electron/renderer", () => ({ init: vi.fn(), browserTracingIntegration: vi.fn() }));
vi.mock("@sentry/react", () => ({ init: vi.fn() }));

type ExposedApi = {
  getAppVersion: () => unknown;
  store: {
    get: (key: string) => unknown;
    set: (key: string, value: unknown) => void;
    delete: (key: string) => unknown;
  };
  server: {
    status: () => unknown;
    restart: (options: { port?: number }) => Promise<unknown>;
    onStatusChange: (callback: (running: boolean) => void) => () => void;
  };
};

describe("Preload bridge", () => {
  const load = async (contextIsolated: boolean) => {
    vi.resetModules();
    vi.clearAllMocks();
    Object.defineProperty(process, "contextIsolated", { value: contextIsolated, configurable: true });
    await import("@app/preload");
  };

  const getExposed = () => contextBridge.exposeInMainWorld.mock.calls[0]?.[1] as ExposedApi;

  it("should expose the API to the isolated renderer", async () => {
    await load(true);

    expect(contextBridge.exposeInMainWorld).toHaveBeenCalledWith("electron", expect.any(Object));
    expect(getExposed()).toMatchObject({ process: { platform: "darwin" } });
  });

  it("should talk to the main process over the expected channels", async () => {
    await load(true);
    const api = getExposed();

    expect(api.getAppVersion()).toBe("sync:get-app-version");
    expect(api.store.get("settings")).toBe("sync:electron-store-get");
    api.store.set("settings", "{}");
    api.store.delete("settings");
    expect(api.server.status()).toBe("sync:application-server-status");
    await expect(api.server.restart({ port: 3000 })).resolves.toStrictEqual({ success: true });

    expect(ipcRenderer.send).toHaveBeenCalledWith("electron-store-set", "settings", "{}");
    expect(ipcRenderer.sendSync).toHaveBeenCalledWith("electron-store-delete", "settings");
    expect(ipcRenderer.invoke).toHaveBeenCalledWith("application-server-restart", { port: 3000 });
  });

  it("should subscribe to server status changes and unsubscribe", async () => {
    await load(true);
    const callback = vi.fn();

    const unsubscribe = getExposed().server.onStatusChange(callback);
    const [[channel, listener]] = ipcRenderer.on.mock.calls as [[string, (event: unknown, running: boolean) => void]];
    listener({}, false);
    unsubscribe();

    expect(channel).toBe("application-server-status-change");
    expect(callback).toHaveBeenCalledWith(false);
    expect(ipcRenderer.removeListener).toHaveBeenCalledWith("application-server-status-change", listener);
  });

  it("should not crash the preload when exposing fails", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    contextBridge.exposeInMainWorld.mockImplementationOnce(() => {
      throw new Error("Context isolation is off");
    });
    vi.resetModules();
    Object.defineProperty(process, "contextIsolated", { value: true, configurable: true });

    await expect(import("@app/preload")).resolves.toBeDefined();
    expect(logged).toHaveBeenCalled();
  });

  it("should put the API on the window without context isolation", async () => {
    vi.stubGlobal("window", {});
    await load(false);

    expect((globalThis.window as unknown as { electron: ExposedApi }).electron.store).toBeDefined();
    expect(contextBridge.exposeInMainWorld).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
