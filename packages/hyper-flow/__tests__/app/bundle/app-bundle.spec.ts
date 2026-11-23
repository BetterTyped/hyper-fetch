// @vitest-environment node
import type ViteConfigGenerator from "@electron-forge/plugin-vite/dist/ViteConfig";
import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

import { forgeViteConfig } from "../../../configs/forge.vite.config";

/** A Vite config as Forge generates it, typed by the Vite that Forge builds with */
type ForgeBuildConfig = Awaited<ReturnType<ViteConfigGenerator["getBuildConfigs"]>>[number];

type BundleResult = { appEvents: string[]; exposedApis: string[]; error: string | null };

const packageRoot = path.resolve(__dirname, "../../..");
const runner = path.join(__dirname, "run-bundle.mjs");

// Forge builds with the Vite it resolves itself, which is not the one this package depends on
const forgeRequire = createRequire(
  createRequire(import.meta.url).resolve("@electron-forge/plugin-vite/package.json", { paths: [packageRoot] }),
);
const { default: Generator } = forgeRequire("@electron-forge/plugin-vite/dist/ViteConfig") as {
  default: typeof ViteConfigGenerator;
};
const vite = forgeRequire("vite") as {
  build: (config: ForgeBuildConfig & { configFile: false }) => Promise<unknown>;
};

/** Builds the main and preload bundles like `electron-forge package` does, into `outDir` */
const buildAppBundles = async (outDir: string) => {
  const configs = await new Generator(forgeViteConfig, packageRoot, true).getBuildConfigs();

  for (const config of configs) {
    // eslint-disable-next-line no-await-in-loop
    await vite.build({ configFile: false, logLevel: "silent", ...config, build: { ...config.build, outDir } });
  }
};

/** Loads a bundle in a new Node process with a fake `electron`, like Electron loads it on launch */
const runBundle = (bundle: string, processType: "main" | "preload") =>
  new Promise<BundleResult>((resolve, reject) => {
    execFile(process.execPath, [runner, bundle, processType], (error, stdout, stderr) => {
      const line = stdout.split("\n").find((output) => output.startsWith("BUNDLE_RESULT:"));
      if (!line) {
        reject(new Error(`The bundle runner reported nothing\n${error?.message ?? ""}\n${stderr}`));
        return;
      }
      resolve(JSON.parse(line.slice("BUNDLE_RESULT:".length)) as BundleResult);
    });
  });

describe("Packaged app bundles", () => {
  let outDir: string;
  const release = process.env.SENTRY_RELEASE;

  beforeAll(async () => {
    outDir = await mkdtemp(path.join(os.tmpdir(), "hyper-flow-bundle-"));
    // The release build names a Sentry release, so the Sentry plugin injects it into every bundle
    process.env.SENTRY_RELEASE = "hyper-flow-bundle-spec";
    await buildAppBundles(outDir);
    // Building the bundles with the production config takes longer than the default hook timeout
  }, 120_000);

  afterAll(async () => {
    if (release === undefined) {
      delete process.env.SENTRY_RELEASE;
    } else {
      process.env.SENTRY_RELEASE = release;
    }
    await rm(outDir, { recursive: true, force: true });
  });

  it("should start the main process", async () => {
    const result = await runBundle(path.join(outDir, "main.js"), "main");

    expect(result.error).toBeNull();
    expect(result.appEvents).toIncludeAllMembers(["ready", "window-all-closed", "will-quit", "activate"]);
  });

  it("should expose the app api to the renderer from the preload script", async () => {
    const result = await runBundle(path.join(outDir, "preload.js"), "preload");

    expect(result.error).toBeNull();
    expect(result.exposedApis).toStrictEqual(["electron"]);
  });
});
