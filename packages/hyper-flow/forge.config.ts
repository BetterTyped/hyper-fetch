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
import dotenv from "dotenv";
import { z } from "zod";

import { appConfig } from "./src/app/config";

dotenv.config();

// Utils
function getEnv() {
  const envSchema = z.object({
    APPLE_ID: z.string(),
    APPLE_PASSWORD: z.string(),
    APPLE_TEAM_ID: z.string(),
    GITHUB_TOKEN: z.string(),
  });

  return envSchema.parse(process.env);
}

// Options
const env = getEnv();

// Forge Configuration
const config: ForgeConfig = {
  packagerConfig: {
    name: appConfig.name,
    executableName: appConfig.id,
    asar: true,
    icon: "./src/app/images/icon",
    osxNotarize: {
      appleId: env.APPLE_ID,
      appleIdPassword: env.APPLE_PASSWORD,
      teamId: env.APPLE_TEAM_ID,
    },
    osxSign: {
      optionsForFile: () => ({
        entitlements: "./src/app/macos/entitlements.mac.plist",
      }),
    },
  },
  rebuildConfig: {},
  makers: [
    // Windows
    new MakerSquirrel({
      name: appConfig.name,
      authors: appConfig.repository.owner,
      setupExe: appConfig.id,
      setupIcon: "./src/app/images/icon.ico",
    }),
    new MakerZIP({}, ["darwin"]),
    // Linux
    new MakerDeb({
      options: {
        name: appConfig.id,
        productName: appConfig.name,
        bin: appConfig.id,
        icon: "./src/app/images/icon.png",
        categories: ["Office", "Utility"],
        genericName: appConfig.name,
        description: appConfig.description,
        productDescription: appConfig.description,
        section: "javascript",
      },
    }),
    new MakerRpm({
      options: {
        name: appConfig.id,
        productName: appConfig.name,
        icon: "./src/app/images/icon.png",
        categories: ["Office", "Utility"],
        genericName: appConfig.name,
        description: appConfig.description,
        productDescription: appConfig.description,
      },
    }),
    // Mac OS
    new MakerDMG({
      name: appConfig.name,
      icon: "./src/app/images/icon.icns",
    }),
  ],
  publishers: [
    new PublisherGithub({
      repository: {
        owner: appConfig.repository.owner,
        name: appConfig.repository.name,
      },
      authToken: env.GITHUB_TOKEN,
      prerelease: false,
      /**
       * Notice that you have configured Forge to publish your release as a draft.
       * This will allow you to see the release with its generated artifacts without actually publishing it to your end users.
       * You can manually publish your releases via GitHub after writing release notes and double-checking that your distributables work.
       */
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
