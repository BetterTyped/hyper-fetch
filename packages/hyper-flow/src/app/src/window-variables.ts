/* eslint-disable no-param-reassign */
import { app, ipcMain } from "electron";

export const GET_APP_VERSION_CHANNEL = "get-app-version";

export function setupWindowVariablesIPC() {
  ipcMain.on(GET_APP_VERSION_CHANNEL, (event) => {
    event.returnValue = app.getVersion();
  });
}
