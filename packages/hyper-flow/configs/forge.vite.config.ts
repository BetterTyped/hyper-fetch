import type { VitePluginConfig } from "@electron-forge/plugin-vite/dist/Config";

/**
 * The targets Electron Forge builds with Vite. `forge.config.ts` packages them and the app bundle specs build them the
 * same way, so a bundle that crashes on launch fails in CI before it ships.
 */
export const forgeViteConfig: VitePluginConfig = {
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
};
