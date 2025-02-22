import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
// import { MakerZIP } from "@electron-forge/maker-zip";
import { MakerDeb } from "@electron-forge/maker-deb";
// import { MakerRpm } from "@electron-forge/maker-rpm";
import { MakerDMG } from "@electron-forge/maker-dmg";
import { PublisherGithub } from "@electron-forge/publisher-github";
import { AutoUnpackNativesPlugin } from "@electron-forge/plugin-auto-unpack-natives";
import { WebpackPlugin } from "@electron-forge/plugin-webpack";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { FuseV1Options, FuseVersion } from "@electron/fuses";

import { mainConfig } from "./webpack/webpack.main.config";
import { rendererConfig } from "./webpack/webpack.renderer.config";

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    icon: "./src/app/assets/logo.svg",
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      description: "Hyper Fetch Devtools",
      name: "hyper-fetch-devtools",
      authors: "Maciej Pyrc",
      setupExe: "hyper-fetch-devtools.exe",
    }),
    // new MakerZIP({}, ["darwin"]),
    // new MakerRpm({}),
    new MakerDeb({
      options: {
        name: "Hyper Fetch Devtools",
        icon: "./src/app/assets/logo.svg",
        productName: "Hyper Fetch Devtools",
      },
    }),
    new MakerDMG({
      format: "ULFO",
      name: "hyper-fetch",
    }),
  ],
  publishers: [
    new PublisherGithub({
      repository: {
        owner: "prc5",
        name: "hyper-fetch",
      },
      draft: true,
    }),
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new WebpackPlugin({
      mainConfig,
      // TODO: check security policy
      devContentSecurityPolicy: "connect-src 'self' * 'unsafe-eval'",
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: "./src/app/index.html",
            js: "./src/app/renderer.ts",
            name: "main_window",
            preload: {
              js: "./src/app/preload.ts",
            },
          },
        ],
      },
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

// eslint-disable-next-line import/no-default-export
export default config;
