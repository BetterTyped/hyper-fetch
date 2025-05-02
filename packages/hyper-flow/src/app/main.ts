import { app, BrowserWindow, shell } from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";
import * as Sentry from "@sentry/electron/main";

import { appLogger } from "../shared/utils/logger";
import { setupWindowControls } from "./src/window-controls";
import { persistentStore } from "./src/persistent-store";
import { copyToClipboard } from "./src/clipboard";
import { closeServer, setupServerControl } from "./src/server-control";
import { createMenu } from "./src/menu";
import { autoUpdater } from "./src/auto-updater";
import { setupWindowVariablesIPC } from "./src/window-variables";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DNS,
  environment: import.meta.env.VITE_ENVIRONMENT,
});

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    title: "Hyper Flow",
    transparent: true,
    frame: false,
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, "/images/icon.png"),
    webPreferences: {
      sandbox: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  if (process.env.NODE_ENV !== "production") {
    mainWindow.webContents.openDevTools({
      mode: "right",
    });
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // config.fileProtocol is my custom file protocol
    if (url.startsWith("file://")) {
      return { action: "allow" };
    }
    // Open URL in default browser and prevent window from opening
    shell.openExternal(url).catch(appLogger.error);
    return { action: "deny" };
  });
};

autoUpdater();

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  appLogger.success("App is ready");
  createWindow();
  createMenu();
  setupServerControl();
  setupWindowVariablesIPC();
});

app.whenReady().then(async () => {
  copyToClipboard();
  persistentStore();
  setupWindowControls();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  closeServer();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
