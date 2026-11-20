import { MessageOrigin } from "@hyper-fetch/plugin-devtools";
// @vitest-environment node
import { createServer } from "node:net";
import { WebSocket } from "ws";

const getRandomPort = () => 20_000 + Math.floor(Math.random() * 40_000);

const { electron, FakeStore, createFakeWindow } = await vi.hoisted(async () => import("./electron.mock"));

vi.mock("electron", () => electron);
vi.mock("electron-store", () => ({ default: FakeStore }));

const { closeServer, setupServerControl } = await import("@app/src/server-control");

type RestartResult = { running: boolean; port: number; success: boolean; message: string };

/** Resolves when something accepts websocket connections on the port */
const canConnect = (port: number) =>
  new Promise<boolean>((resolve) => {
    const ws = new WebSocket(`ws://localhost:${port}?connectionName=probe&origin=${MessageOrigin.PLUGIN}`);
    ws.once("open", () => {
      ws.terminate();
      resolve(true);
    });
    ws.once("error", () => resolve(false));
  });

const occupy = async (port: number) => {
  const blocker = createServer();
  await new Promise<void>((resolve) => {
    blocker.listen(port, resolve);
  });
  return () =>
    new Promise<void>((resolve) => {
      blocker.close(() => resolve());
    });
};

const storeSettingsPort = (port: number) => {
  FakeStore.data.set("settings", JSON.stringify({ state: { settings: { serverPort: port } }, version: 0 }));
};

describe("Server control [ Electron main ]", () => {
  let window: ReturnType<typeof createFakeWindow>;
  let port: number;

  beforeEach(() => {
    electron.reset();
    FakeStore.data.clear();
    window = createFakeWindow();
    electron.setWindows([window]);
    port = getRandomPort();
    storeSettingsPort(port);
  });

  afterEach(async () => {
    await closeServer();
  });

  it("should start the server on the port from the settings and tell the windows", async () => {
    await setupServerControl();

    expect(await canConnect(port)).toBeTrue();
    expect(window.webContents.send).toHaveBeenCalledWith("application-server-status-change", true);
    expect(await electron.invoke("application-server-status")).toBeTrue();
    expect(await electron.send("application-server-status")).toBeTrue();
  });

  it("should fall back to the default port without settings", async () => {
    FakeStore.data.clear();
    const release = await occupy(2137).catch(() => null);

    await setupServerControl();

    // Either it runs on 2137, or 2137 was taken and it reports not running - never another port
    const status = await electron.invoke("application-server-status");
    expect(status).toBe(!release);
    await release?.();
  });

  it("should report not running when the port is taken at startup", async () => {
    const release = await occupy(port);

    await setupServerControl();

    expect(await electron.invoke("application-server-status")).toBeFalse();
    expect(window.webContents.send).toHaveBeenCalledWith("application-server-status-change", false);
    await release();
  });

  it("should move the server to a new port", async () => {
    await setupServerControl();
    const nextPort = getRandomPort();

    const result = (await electron.invoke("application-server-restart", { port: nextPort })) as RestartResult;

    expect(result).toMatchObject({ success: true, running: true, port: nextPort });
    expect(await canConnect(nextPort)).toBeTrue();
    expect(await canConnect(port)).toBeFalse();
  });

  it("should restart on the port it already runs on", async () => {
    await setupServerControl();

    const result = (await electron.invoke("application-server-restart", {})) as RestartResult;

    expect(result).toMatchObject({ success: true, running: true, port });
    expect(await canConnect(port)).toBeTrue();
  });

  it("should keep the running server when the new port is taken", async () => {
    await setupServerControl();
    const takenPort = getRandomPort();
    const release = await occupy(takenPort);

    const result = (await electron.invoke("application-server-restart", { port: takenPort })) as RestartResult;

    expect(result).toMatchObject({ success: false, running: false, message: `Port ${takenPort} is already in use` });
    expect(await canConnect(port)).toBeTrue();
    expect(await electron.invoke("application-server-status")).toBeTrue();
    await release();
  });

  it("should tell every window about the restart", async () => {
    const second = createFakeWindow(2);
    electron.setWindows([window, second]);
    await setupServerControl();
    second.webContents.send.mockClear();

    await electron.invoke("application-server-restart", { port: getRandomPort() });

    expect(second.webContents.send).toHaveBeenCalledWith("application-server-status-change", true);
  });

  it("should close a previous server first while developing", async () => {
    await setupServerControl();
    electron.reset();
    electron.setWindows([window]);

    // Hot reload of the main process starts the control again on the same port
    await setupServerControl();

    expect(await electron.invoke("application-server-status")).toBeTrue();
    expect(await canConnect(port)).toBeTrue();
  });
});
