import { BrowserWindow, ipcMain } from "electron";

export function setupWindowControls() {
  ipcMain.on("window-minimize", (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window) window.minimize();
  });

  ipcMain.on("window-maximize", (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return;

    if (window.isMaximized()) {
      window.unmaximize();
    } else {
      window.maximize();
    }
  });

  ipcMain.on("window-close", (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window) window.close();
  });
}
