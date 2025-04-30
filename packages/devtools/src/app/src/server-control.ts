import { ipcMain, BrowserWindow } from "electron";
import { parseResponse } from "@hyper-fetch/core";
import * as net from "net";

import { startServer, StartServer } from "../../server";
import { store } from "./persistent-store";
import type { Settings } from "frontend/store/app/settings.store";
import { appLogger } from "../../utils/logger";

// Store server instance for control
let serverInstance: StartServer | null = null;
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
 * Check if a port is already in use
 */
const isPortInUse = (port: number): Promise<boolean> => {
  appLogger.debug(`Checking if port ${port} is in use`);
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        appLogger.warning(`Port ${port} is already in use`);
        resolve(true);
      } else {
        appLogger.error(`Error checking port ${port}:`, { error: err });
        resolve(false);
      }
    });

    server.once("listening", () => {
      server.close();
      appLogger.debug(`Port ${port} is available`);
      resolve(false);
    });

    server.listen(port);
  });
};

/**
 * Notify all renderer processes of server status change
 */
const notifyStatusChange = (isRunning: boolean) => {
  appLogger.info(`Notifying renderer processes of server status change: ${isRunning ? "running" : "stopped"}`);
  const windows = BrowserWindow.getAllWindows();
  windows.forEach((window) => {
    window.webContents.send("application-server-status-change", isRunning);
  });
};

const onServerCrash = () => {
  appLogger.error("Server crashed unexpectedly");
  serverInstance = null;
  notifyStatusChange(false);
};

export const closeServer = () => {
  if (serverInstance && serverInstance.server) {
    appLogger.info("Closing server instance");
    serverInstance.server.close();
    if (serverInstance.wss) {
      appLogger.info("Closing WebSocket server");
      serverInstance.wss.close();
    }
  }
};

/**
 * Initialize the server and set up IPC handlers for controlling it
 */
export async function setupServerControl() {
  try {
    appLogger.info("Initializing server control");
    // Start the server immediately
    serverInstance = await startServer({ port: getPort(), onServerCrash });
    appLogger.info("Server started successfully");
  } catch (error) {
    appLogger.error("Failed to start server", { error });
  }

  // Notify about initial server status
  const initialStatus = !!serverInstance?.server;
  appLogger.info(`Initial server status: ${initialStatus ? "running" : "stopped"}`);
  notifyStatusChange(initialStatus);

  // Server control IPC handlers
  ipcMain.handle("application-server-status", () => {
    const status = !!serverInstance?.server;
    appLogger.debug(`Server status requested: ${status ? "running" : "stopped"}`);
    return status;
  });

  ipcMain.on("application-server-status", (event) => {
    const status = !!serverInstance?.server;
    appLogger.debug(`Server status requested (sync): ${status ? "running" : "stopped"}`);
    // eslint-disable-next-line no-param-reassign
    event.returnValue = status;
  });

  ipcMain.handle("application-server-restart", async (_, options: { port?: number }) => {
    appLogger.info("Server restart requested", { details: options });
    const port = getPort(options);

    // Check if port is already in use
    const used = await isPortInUse(port);

    if (used) {
      appLogger.warning(`Cannot restart server - port ${port} is already in use`);
      return {
        port,
        running: false,
        success: false,
        message: `Port ${port} is already in use`,
      };
    }

    // If server is running, stop it first
    closeServer();

    // Start server with new options
    try {
      appLogger.info(`Starting server on port ${port}`);
      serverInstance = await startServer({ port, onServerCrash });
      appLogger.info("Server started successfully");
    } catch (error) {
      appLogger.error("Server failed to start", { error });
      return {
        port,
        running: false,
        success: false,
        message: `Server crashed when trying to start on port ${port}`,
        reason: error,
      };
    }

    // Notify about status change
    const isRunning = !!serverInstance?.server;
    appLogger.info(`Server status after restart: ${isRunning ? "running" : "stopped"}`);
    notifyStatusChange(isRunning);

    return {
      running: isRunning,
      port,
      success: true,
      message: `Server restarted on port ${port}`,
      reason: null,
    };
  });
}
