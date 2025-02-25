// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

// import { contextBridge, ipcRenderer } from "electron";
// import { electronAPI } from "@electron-toolkit/preload";

// Custom APIs for renderer
// const api = {};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
// if (process.contextIsolated) {
//   try {
//     contextBridge.exposeInMainWorld("electron", {
//       ...electronAPI,
//       store: {
//         get(key: string) {
//           return ipcRenderer.sendSync("electron-store-get", key);
//         },
//         set(property: string, val: unknown) {
//           ipcRenderer.send("electron-store-set", property, val);
//         },
//         delete(key: string) {
//           return ipcRenderer.sendSync("electron-store-delete", key);
//         },
//         // Other method you want to add like has(), reset(), etc.
//       },
//     });
//     contextBridge.exposeInMainWorld("api", api);
//   } catch (error) {
//     console.error(error);
//   }
// } else {
//   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//   // @ts-ignore (define in dts)
//   window.electron = {
//     ...electronAPI,
//     store: {
//       get(key: string) {
//         return ipcRenderer.sendSync("electron-store-get", key);
//       },
//       set(property: string, val: unknown) {
//         ipcRenderer.send("electron-store-set", property, val);
//       },
//       delete(key: string) {
//         return ipcRenderer.sendSync("electron-store-delete", key);
//       },
//       // Other method you want to add like has(), reset(), etc.
//     },
//   };
//   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//   // @ts-ignore (define in dts)
//   window.api = api;
// }
