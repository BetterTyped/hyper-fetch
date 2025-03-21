import { app, BrowserWindow, clipboard, Data, ipcMain, nativeImage } from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";
import Store from "electron-store";

import { startServer } from "../server";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const store = new Store();
const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    transparent: true,
    frame: false,
    width: 1200,
    height: 800,
    webPreferences: {
      sandbox: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}/src/app/index.html`);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  if (process.env.NODE_ENV !== "production") {
    mainWindow.webContents.openDevTools();
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

app.whenReady().then(() => {
  ipcMain.on("electron-store-get", async (event, val) => {
    // eslint-disable-next-line no-param-reassign
    event.returnValue = store.get(val);
  });
  ipcMain.on("electron-store-set", async (_, key, val) => {
    store.set(key, val);
  });

  ipcMain.on("electron-store-delete", async (_, key) => {
    try {
      store.delete(key);
    } catch (error) {
      console.error("🚀 ~ ipcMain.on ~ error:", error);
    }
  });

  ipcMain.on("clipboard", async (_, val: Data & { img?: string }) => {
    if (val.img) {
      clipboard.writeImage(nativeImage.createFromBuffer(Buffer.from(val.img, "base64")));
    } else {
      clipboard.write(val);
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
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

// **********
// SERVER
// **********

startServer();
