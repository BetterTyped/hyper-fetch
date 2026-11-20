import { parseResponse } from "@hyper-fetch/core";
import { ipcMain, BrowserWindow } from "electron";

import type { StartServer } from "../../server";
import { startServer } from "../../server";
import { appLogger } from "../../shared/utils/logger";
import { store } from "./persistent-store";
import type { Settings } from "@/store/general/settings.store";

// Store server instance for control
let serverInstance: StartServer | null = null;
/** The port the running server listens on */
let serverPort: number | null = null;
const defaultPort = 2137;

const getPort = (options?: { port?: number }) => {
  const storeData = store.get("settings");
  const parsed = parseResponse(storeData) as { state?: { settings: Settings } } | undefined;
  const port = options?.port || parsed?.state?.settings?.serverPort || defaultPort;
  appLogger.info(`Setting Application Server port: ${port}`, {
    details: {
      passedPort: options?.port,
      settingsPort: parsed?.state?.settings?.serverPort,
      defaultPort,
    },
  });

  return port;
};

/**
 * Notify all renderer processes of server status change
 */
const notifyStatusChange = (isRunning: boolean) => {
  appLogger.info("Notifying renderer processes of server status change", { details: { running: isRunning } });
  const windows = BrowserWindow.getAllWindows();
  windows.forEach((window) => {
    window.webContents.send("application-server-status-change", isRunning);
  });
};

/** Stops the running server and resolves once its port is free again */
export const closeServer = async () => {
  const instance = serverInstance;
  serverInstance = null;
  serverPort = null;
  if (!instance?.server) {
    return;
  }
  appLogger.info("Closing server instance");
  const { server, wss } = instance;
  await new Promise<void>((resolve) => {
    appLogger.info("Closing WebSocket server");
    // Open connections would keep the port busy
    wss.clients.forEach((client) => client.terminate());
    wss.close(() => resolve());
  });
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
};

const onServerCrash = async () => {
  appLogger.error("Server crashed unexpectedly");
  // Free the port, so restarting on it works
  await closeServer();
  notifyStatusChange(false);
};

const start = async (port: number) => {
  serverInstance = await startServer({ port, onServerCrash });
  serverPort = serverInstance.server ? port : null;
};

/**
 * Initialize the server and set up IPC handlers for controlling it
 */
export async function setupServerControl() {
  // A hot-reloaded main process starts again while the previous server still runs
  await closeServer();
  appLogger.info("Initializing server control");
  await start(getPort());

  const initialStatus = !!serverInstance?.server;
  appLogger.info("Initial server status", { details: { running: initialStatus } });
  notifyStatusChange(initialStatus);

  // Server control IPC handlers
  ipcMain.handle("application-server-status", () => !!serverInstance?.server);

  ipcMain.on("application-server-status", (event) => {
    // eslint-disable-next-line no-param-reassign
    event.returnValue = !!serverInstance?.server;
  });

  ipcMain.handle("application-server-restart", async (_, options: { port?: number }) => {
    appLogger.info("Server restart requested", { details: options });
    const port = getPort(options);

    // Its own server holds the current port, so it has to stop first. On another port the running server stays
    // until the new one listens, so a taken or invalid port leaves the app connected.
    if (port === serverPort) {
      await closeServer();
    }
    const next = await startServer({ port, onServerCrash });

    if (!next.server) {
      appLogger.warning("Cannot restart server", { details: { port, reason: next.errorMessage } });
      notifyStatusChange(!!serverInstance?.server);
      return { port, running: false, success: false, message: next.errorMessage };
    }

    await closeServer();
    serverInstance = next;
    serverPort = port;
    notifyStatusChange(true);

    return { running: true, port, success: true, message: `Server restarted on port ${port}` };
  });
}
