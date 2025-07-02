/// <reference types="vite/client" />

import { ElectronAPI } from "@electron-toolkit/preload";

import type { ExtendedElectronAPI } from "app/preload";

declare global {
  interface Window {
    electron: ElectronAPI & ExtendedElectronAPI;
    api: unknown;
  }
}

interface ImportMetaEnv {
  readonly VITE_PUBLIC_POSTHOG_HOST: string;
  readonly VITE_PUBLIC_POSTHOG_KEY: string;
  readonly VITE_ENVIRONMENT: string;
  readonly VITE_SENTRY_DNS: string;
  readonly SENTRY_AUTH_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/newline-after-import */
/* eslint-disable import/no-default-export */
declare module "*.svg?react" {
  import React = require("react");
  export default React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
}

declare module "*.png" {
  const content: string;
  export default content;
}

declare global {
  namespace React {
    interface ReactPortal {
      children?: React.ReactNode;
    }
  }
}
