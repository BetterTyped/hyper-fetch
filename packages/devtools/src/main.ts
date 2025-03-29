import { ipcMain, BrowserWindow } from "electron";

// ... existing code ...

ipcMain.on("minimize", (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (window) window.minimize();
});
