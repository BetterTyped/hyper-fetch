/* eslint-disable no-param-reassign */
import { ipcMain } from "electron";
import Store from "electron-store";

export const store = new Store();

export const persistentStore = () => {
  ipcMain.on("electron-store-get", async (event, val) => {
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
};
