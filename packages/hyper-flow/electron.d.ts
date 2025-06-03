import { ElectronAPI } from "@electron-toolkit/preload";

import type { ExtendedElectronAPI } from "app/preload";

declare global {
  interface Window {
    electron: ElectronAPI & ExtendedElectronAPI;
    api: unknown;
  }
}
