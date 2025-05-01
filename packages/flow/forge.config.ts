import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { MakerDMG } from "@electron-forge/maker-dmg";
import { PublisherGithub } from "@electron-forge/publisher-github";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { FuseV1Options, FuseVersion } from "@electron/fuses";
import { VitePlugin } from "@electron-forge/plugin-vite";

const config: ForgeConfig = {
  packagerConfig: {
    name: "Hyper Flow",
    asar: true,
    icon: "./src/app/images/icon",
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      authors: "Maciej Pyrc, Kacper Skawina",
      setupExe: "hyper-flow.exe",
      setupIcon: "./src/app/images/icon.ico",
    }),
    new MakerZIP({}, ["darwin"]),
    new MakerRpm({}),
    new MakerDeb({
      options: {
        icon: "./src/app/images/icon.png",
      },
    }),
    new MakerDMG({
      format: "ULFO",
      icon: "./src/app/images/icon.icns",
    }),
  ],
  publishers: [
    new PublisherGithub({
      repository: {
        owner: "prc5",
        name: "@BetterTyped/hyper-fetch",
      },
      draft: true,
    }),
  ],
  plugins: [
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: "./src/app/main.ts",
          config: "./configs/vite.main.config.mts",
          target: "main",
        },
        {
          entry: "./src/app/preload.ts",
          config: "./configs/vite.preload.config.mts",
          target: "preload",
        },
      ],
      renderer: [
        {
          name: "main_window",
          config: "./configs/vite.renderer.config.mts",
        },
      ],
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
