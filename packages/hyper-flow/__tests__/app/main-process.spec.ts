// @vitest-environment node
import { createServer } from "node:net";

const { electron, FakeStore, createFakeWindow, FakeBrowserWindow } = await vi.hoisted(
  async () => import("./electron.mock"),
);

vi.mock("electron", () => electron);
vi.mock("electron-store", () => ({ default: FakeStore }));
vi.mock("@sentry/electron/main", () => ({ init: vi.fn() }));
vi.mock("electron-squirrel-startup", () => ({ default: false }));
vi.mock("update-electron-app", () => ({
  updateElectronApp: vi.fn(),
  UpdateSourceType: { ElectronPublicUpdateService: 1 },
}));

const getRandomPort = () => 20_000 + Math.floor(Math.random() * 40_000);

const isListening = (port: number) =>
  new Promise<boolean>((resolve) => {
    const probe = createServer();
    probe.once("error", () => resolve(true));
    probe.once("listening", () => probe.close(() => resolve(false)));
    probe.listen(port);
  });

describe("Electron main process", () => {
  beforeEach(() => {
    electron.reset();
    FakeStore.data.clear();
    vi.clearAllMocks();
  });

  describe("given the app entry", () => {
    let port: number;

    beforeEach(async () => {
      port = getRandomPort();
      FakeStore.data.set("settings", JSON.stringify({ state: { settings: { serverPort: port } } }));
      vi.stubGlobal("MAIN_WINDOW_VITE_DEV_SERVER_URL", "http://localhost:5173");
      vi.stubGlobal("MAIN_WINDOW_VITE_NAME", "main_window");
      vi.resetModules();
      await import("@app/main");
    });

    afterEach(async () => {
      const { closeServer } = await import("@app/src/server-control");
      await closeServer();
      vi.unstubAllGlobals();
    });

    it("should open the window and start the server once ready", async () => {
      await electron.app.emit("ready");

      expect(FakeBrowserWindow.created).toHaveLength(1);
      expect(FakeBrowserWindow.created[0].loadURL).toHaveBeenCalledWith("http://localhost:5173");
      await vi.waitFor(async () => expect(await isListening(port)).toBeTrue());
      expect(electron.Menu.setApplicationMenu).toHaveBeenCalled();
      expect(await electron.send("get-app-version")).toBe("1.2.3");
    });

    it("should open external links in the browser instead of the app", async () => {
      await electron.app.emit("ready");
      const [window] = FakeBrowserWindow.created;

      expect(window.openHandler?.({ url: "https://github.com" })).toStrictEqual({ action: "deny" });
      expect(electron.shell.openExternal).toHaveBeenCalledWith("https://github.com");
      expect(window.openHandler?.({ url: "file:///index.html" })).toStrictEqual({ action: "allow" });
    });

    it("should keep the server running when the last window closes on macOS and it is reopened", async () => {
      const platform = vi.spyOn(process, "platform", "get").mockReturnValue("darwin");
      await electron.app.emit("ready");
      await vi.waitFor(async () => expect(await isListening(port)).toBeTrue());

      // Closing the window keeps the app alive in the dock, the user reopens it from there
      FakeBrowserWindow.created.splice(0);
      await electron.app.emit("window-all-closed");
      await electron.app.emit("activate");

      expect(FakeBrowserWindow.created).toHaveLength(1);
      expect(electron.app.quit).not.toHaveBeenCalled();
      expect(await isListening(port)).toBeTrue();
      expect(await electron.invoke("application-server-status")).toBeTrue();
      platform.mockRestore();
    });

    it("should quit and stop the server when the last window closes elsewhere", async () => {
      const platform = vi.spyOn(process, "platform", "get").mockReturnValue("win32");
      await electron.app.emit("ready");
      await vi.waitFor(async () => expect(await isListening(port)).toBeTrue());

      await electron.app.emit("window-all-closed");
      await electron.app.emit("will-quit");

      expect(electron.app.quit).toHaveBeenCalled();
      await vi.waitFor(async () => expect(await isListening(port)).toBeFalse());
      platform.mockRestore();
    });

    it("should load the built renderer without a dev server", async () => {
      vi.stubGlobal("MAIN_WINDOW_VITE_DEV_SERVER_URL", undefined);
      await electron.app.emit("ready");

      expect(FakeBrowserWindow.created[0].loadFile).toHaveBeenCalledWith(
        expect.stringContaining("renderer/main_window/index.html"),
      );
    });
  });

  describe("given the persistent store", () => {
    it("should get, set and delete values for the renderer", async () => {
      const { persistentStore } = await import("@app/src/persistent-store");
      persistentStore();

      await electron.send("electron-store-set", "settings", "{}");
      expect(await electron.send("electron-store-get", "settings")).toBe("{}");

      // The renderer deletes with sendSync, which waits for a return value
      expect(await electron.send("electron-store-delete", "settings")).toBeTrue();
      expect(await electron.send("electron-store-get", "settings")).toBeUndefined();
    });

    it("should not throw into the renderer when deleting fails", async () => {
      const logged = vi.spyOn(console, "error").mockImplementation(() => {});
      const { persistentStore } = await import("@app/src/persistent-store");
      persistentStore();

      await expect(electron.send("electron-store-delete", "locked")).resolves.toBeFalse();
      expect(logged).toHaveBeenCalled();
    });
  });

  describe("given the window controls", () => {
    it("should minimize, maximize, restore and close the window that asked", async () => {
      const { setupWindowControls } = await import("@app/src/window-controls");
      const window = createFakeWindow();
      electron.setWindows([window]);
      setupWindowControls();

      await electron.send("window-minimize");
      await electron.send("window-maximize");
      window.isMaximized.mockReturnValue(true);
      await electron.send("window-maximize");
      await electron.send("window-close");

      expect(window.minimize).toHaveBeenCalledOnce();
      expect(window.maximize).toHaveBeenCalledOnce();
      expect(window.unmaximize).toHaveBeenCalledOnce();
      expect(window.close).toHaveBeenCalledOnce();
    });

    it("should ignore requests from windows that are gone", async () => {
      const { setupWindowControls } = await import("@app/src/window-controls");
      setupWindowControls();

      await expect(electron.send("window-minimize")).resolves.toBeUndefined();
      await expect(electron.send("window-maximize")).resolves.toBeUndefined();
      await expect(electron.send("window-close")).resolves.toBeUndefined();
    });
  });

  describe("given the clipboard", () => {
    it("should copy text and images", async () => {
      const { copyToClipboard } = await import("@app/src/clipboard");
      copyToClipboard();

      await electron.send("clipboard", { text: "copied" });
      await electron.send("clipboard", { img: Buffer.from("png").toString("base64") });

      expect(electron.clipboard.write).toHaveBeenCalledWith({ text: "copied" });
      expect(electron.nativeImage.createFromBuffer).toHaveBeenCalledWith(Buffer.from("png"));
      expect(electron.clipboard.writeImage).toHaveBeenCalledOnce();
    });
  });

  describe("given the menu", () => {
    type MenuItem = { label?: string; submenu?: MenuItem[]; click?: (...args: unknown[]) => unknown };

    const getMenu = async () => {
      const { createMenu } = await import("@app/src/menu");
      createMenu();
      const [[template]] = electron.Menu.buildFromTemplate.mock.calls as [[MenuItem[]]];
      const find = (top: string, label: string) =>
        template.find((item) => item.label === top)?.submenu?.find((item) => item.label === label);
      return { template, find };
    };

    it("should install the application menu", async () => {
      const { template } = await getMenu();

      expect(template.map((item) => item.label)).toStrictEqual(["HyperFlow", "Edit", "View", "Window", "Help"]);
      expect(electron.Menu.setApplicationMenu).toHaveBeenCalledWith({ template });
    });

    it("should quit, reload, open dev tools and take screenshots", async () => {
      const { find } = await getMenu();
      const window = createFakeWindow();

      find("HyperFlow", "Quit")?.click?.();
      find("View", "Reload")?.click?.({}, window);
      find("View", "Toggle Developer Tools")?.click?.({}, window);
      await find("View", "Take screenshot")?.click?.({}, window);
      await vi.waitFor(() => expect(electron.clipboard.writeImage).toHaveBeenCalledWith({ image: 1 }));

      // Without a focused window there is nothing to act on
      find("View", "Reload")?.click?.({}, undefined);
      find("View", "Toggle Developer Tools")?.click?.({}, undefined);
      find("View", "Take screenshot")?.click?.({}, undefined);

      expect(electron.app.quit).toHaveBeenCalledOnce();
      expect(window.reload).toHaveBeenCalledOnce();
      expect(window.webContents.openDevTools).toHaveBeenCalledOnce();
    });

    it("should open the website and the HyperFlow documentation", async () => {
      const { find } = await getMenu();

      find("Help", "Hyper Fetch")?.click?.();
      find("Help", "Documentation")?.click?.();

      expect(electron.shell.openExternal).toHaveBeenCalledWith("https://hyperfetch.bettertyped.com/");
      expect(electron.shell.openExternal).toHaveBeenCalledWith("https://hyperfetch.bettertyped.com/docs/hyper-flow");
    });
  });

  describe("given the auto updater", () => {
    it("should check the GitHub releases of HyperFlow", async () => {
      const { updateElectronApp } = await import("update-electron-app");
      const { autoUpdater } = await import("@app/src/auto-updater");

      autoUpdater();

      expect(updateElectronApp).toHaveBeenCalledWith(
        expect.objectContaining({ updateSource: expect.objectContaining({ repo: "BetterTyped/hyper-fetch" }) }),
      );
    });
  });
});
