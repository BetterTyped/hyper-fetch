import { ipcMain, BrowserWindow } from "electron";
import * as net from "net";

import { startServer, StartServer } from "../../server";
import { store } from "./persistent-store";
import type { Settings } from "frontend/store/app/settings.store";

// Store server instance for control
let serverInstance: StartServer | null = null;

const getPort = (options?: { port?: number }) => {
  const settings = store.get("settings") as Settings;
  return options?.port || settings?.serverPort || 2137;
};

/**
 * Check if a port is already in use
 */
const isPortInUse = (port: number): Promise<boolean> => {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        resolve(true);
      } else {
        resolve(false);
      }
    });

    server.once("listening", () => {
      server.close();
      resolve(false);
    });

    server.listen(port);
  });
};

/**
 * Notify all renderer processes of server status change
 */
const notifyStatusChange = (isRunning: boolean) => {
  const windows = BrowserWindow.getAllWindows();
  windows.forEach((window) => {
    window.webContents.send("electron-server-status-change", isRunning);
  });
};

const onServerCrash = () => {
  serverInstance = null;
  notifyStatusChange(false);
};

/**
 * Initialize the server and set up IPC handlers for controlling it
 */
export async function setupServerControl() {
  // Start the server immediately
  try {
    serverInstance = await startServer({ port: getPort(), onServerCrash });
  } catch (error) {
    console.error("🚀 ~ setupServerControl ~ error:", error);
  }

  // Notify about initial server status
  notifyStatusChange(!!serverInstance?.server);

  // Server control IPC handlers
  ipcMain.handle("electron-server-status", () => {
    return !!serverInstance?.server;
  });

  ipcMain.on("electron-server-status", (event) => {
    // eslint-disable-next-line no-param-reassign
    event.returnValue = !!serverInstance?.server;
  });

  ipcMain.handle("electron-server-restart", async (_, options: { port?: number }) => {
    const port = getPort(options);

    // Check if port is already in use
    const used = await isPortInUse(port);

    if (used) {
      return {
        port,
        running: false,
        success: false,
        message: `Port ${port} is already in use`,
      };
    }

    // If server is running, stop it first
    if (serverInstance && serverInstance.server) {
      serverInstance.server.close();
      if (serverInstance.wss) {
        serverInstance.wss.close();
      }
    }

    // Start server with new options
    try {
      serverInstance = await startServer({ port, onServerCrash });
    } catch (error) {
      console.error("🚀 ~ setupServerControl ~ error:", error);
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
