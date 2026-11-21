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

/** The listener the server registered for crashes, called like Node would on an unhandled rejection */
const crashListener = (before: NodeJS.UnhandledRejectionListener[]) => {
  const listener = process.listeners("unhandledRejection").find((candidate) => !before.includes(candidate));
  expect(listener).toBeDefined();
  return listener!;
};

describe("Server control [ Recovery ]", () => {
  let window: ReturnType<typeof createFakeWindow>;
  let port: number;

  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    electron.reset();
    FakeStore.data.clear();
    window = createFakeWindow();
    electron.setWindows([window]);
    port = getRandomPort();
    storeSettingsPort(port);
  });

  afterEach(async () => {
    await closeServer();
    vi.restoreAllMocks();
  });

  it("should free the port after a crash, so restarting on it works", async () => {
    const before = process.listeners("unhandledRejection");
    await setupServerControl();
    const onCrash = crashListener(before);
    window.webContents.send.mockClear();

    await onCrash(new Error("boom"), Promise.resolve());

    expect(window.webContents.send).toHaveBeenCalledWith("application-server-status-change", false);
    expect(await electron.invoke("application-server-status")).toBeFalse();
    expect(await canConnect(port)).toBeFalse();
    // The crash dialog restarts without a port, which means the one from the settings
    const result = (await electron.invoke("application-server-restart")) as RestartResult;
    expect(result).toMatchObject({ success: true, running: true, port });
    expect(await canConnect(port)).toBeTrue();
  });

  it("should stop reacting to rejections once the server closed", async () => {
    const before = process.listenerCount("unhandledRejection");
    await setupServerControl();
    expect(process.listenerCount("unhandledRejection")).toBe(before + 1);

    await closeServer();

    expect(process.listenerCount("unhandledRejection")).toBe(before);
  });

  it("should keep the running server when asked for a port out of range", async () => {
    await setupServerControl();

    const result = (await electron.invoke("application-server-restart", { port: 70_000 })) as RestartResult;

    expect(result).toMatchObject({ success: false, running: false, port: 70_000 });
    expect(result.message).toContain("70000");
    expect(await canConnect(port)).toBeTrue();
    expect(await electron.invoke("application-server-status")).toBeTrue();
  });

  it("should report a stored port out of range as not running", async () => {
    storeSettingsPort(70_000);

    await setupServerControl();

    expect(await electron.invoke("application-server-status")).toBeFalse();
    expect(await electron.send("application-server-status")).toBeFalse();
    expect(window.webContents.send).toHaveBeenCalledWith("application-server-status-change", false);
  });

  it("should start once the port is free again", async () => {
    const release = await occupy(port);
    await setupServerControl();
    expect(await electron.invoke("application-server-status")).toBeFalse();
    await release();
    window.webContents.send.mockClear();

    const result = (await electron.invoke("application-server-restart")) as RestartResult;

    expect(result).toMatchObject({ success: true, running: true, port });
    expect(window.webContents.send).toHaveBeenCalledWith("application-server-status-change", true);
    expect(await canConnect(port)).toBeTrue();
  });
});
