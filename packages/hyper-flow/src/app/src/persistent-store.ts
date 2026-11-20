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

  // The renderer deletes with a synchronous message, which waits for a return value
  ipcMain.on("electron-store-delete", (event, key) => {
    try {
      store.delete(key);
      event.returnValue = true;
    } catch (error) {
      console.error("Failed to delete from the persistent store", error);
      event.returnValue = false;
    }
  });
};
