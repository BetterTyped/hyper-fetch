import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import { builtinModules, createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

import pkg from "../../package.json";

/**
 * Unit tests run the sources, users run the bundle. This suite builds the package the same way
 * the release does and executes the result with plain `node`, so a bundle that cannot even start
 * (issue #142, Node builtins replaced with a browser stub) fails here instead of on npm.
 */
describe("cli bundle", () => {
  const root = path.resolve(__dirname, "../..");
  // Has to live inside of the package, externals are resolved from the output location
  const outDir = path.join(root, "node_modules/.cache/build-spec");
  const cliFile = path.join(outDir, path.basename(pkg.bin["hyper-fetch"]));
  const indexFile = path.join(outDir, path.basename(pkg.main));

  const run = (args: string[]) => {
    // No stdin and a hard timeout - a prompt waiting for input must fail the test, not hang it
    return spawnSync(process.execPath, [cliFile, ...args], {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 20_000,
      env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0" },
    });
  };

  const getChunks = () => {
    return fs
      .readdirSync(outDir)
      .filter((file) => file.endsWith(".js"))
      .map((file) => ({ file, content: fs.readFileSync(path.join(outDir, file), "utf-8") }));
  };

  beforeAll(() => {
    fs.rmSync(outDir, { recursive: true, force: true });
    const vite = path.join(path.dirname(createRequire(__filename).resolve("vite/package.json")), "bin/vite.js");
    execFileSync(process.execPath, [vite, "build", "--outDir", outDir, "--logLevel", "error"], {
      cwd: root,
      stdio: "pipe",
    });
  }, 180_000);

  afterAll(() => {
    fs.rmSync(outDir, { recursive: true, force: true });
  });

  describe("when package gets built", () => {
    it("should emit the files package.json points to", () => {
      expect(pkg.bin["hyper-fetch"]).toStartWith("dist/");
      expect(pkg.main).toStartWith("dist/");
      expect(fs.existsSync(cliFile)).toBeTrue();
      expect(fs.existsSync(indexFile)).toBeTrue();
    });
    it("should point the bin to the executable entry", () => {
      const content = fs.readFileSync(cliFile, "utf-8");

      expect(pkg.bin["hyper-fetch"]).not.toBe(pkg.main);
      expect(content.startsWith("#!/usr/bin/env node")).toBeTrue();
    });
    it("should not replace node builtins with the browser stub", () => {
      const stubbed = getChunks()
        .filter(({ content }) => /__vite[-_]browser[-_]external/.test(content))
        .map(({ file }) => file);

      expect(stubbed).toStrictEqual([]);
    });
    it("should only leave requires that resolve after npm install", () => {
      const builtins = new Set([...builtinModules, ...builtinModules.map((name) => `node:${name}`)]);
      const installed = Object.keys({
        ...pkg.dependencies,
        ...(pkg as { peerDependencies?: object }).peerDependencies,
      });
      const isInstalled = (id: string) => installed.some((name) => id === name || id.startsWith(`${name}/`));

      const unresolved = getChunks().flatMap(({ file, content }) => {
        // Bundler emits its externals as top level statements
        const ids = [...content.matchAll(/^(?:const|let|var) [\w$]+ = require\("([^"]+)"\);?$/gm)].map((m) => m[1]!);
        return ids
          .filter((id) => !id.startsWith(".") && !builtins.has(id) && !isInstalled(id))
          .map((id) => `${file}: ${id}`);
      });

      expect(unresolved).toStrictEqual([]);
    });
  });

  describe("when running built cli with node", () => {
    it("should print the version", () => {
      const { status, stdout, stderr } = run(["--version"]);

      expect(stderr).not.toInclude("TypeError");
      expect(status).toBe(0);
      expect(stdout.trim()).toBe(pkg.version);
    });
    it("should print help with available commands", () => {
      const { status, stdout } = run(["--help"]);

      expect(status).toBe(0);
      expect(stdout).toInclude("Init");
      expect(stdout).toInclude("Generate");
    });
    it.each(["init", "generate"])("should print help for %s command", (command) => {
      const { status, stdout, stderr } = run([command, "--help"]);

      expect(stderr).not.toInclude("Error");
      expect(status).toBe(0);
      expect(stdout).toInclude("--cwd");
    });
    it("should initialize a project with the init command", () => {
      const project = fs.mkdtempSync(path.join(os.tmpdir(), "hyper-fetch-cli-"));
      fs.mkdirSync(path.join(project, "src"));
      fs.writeFileSync(path.join(project, "package.json"), JSON.stringify({ name: "project" }));
      fs.writeFileSync(
        path.join(project, "tsconfig.json"),
        JSON.stringify({ compilerOptions: { baseUrl: ".", paths: { "@/*": ["./src/*"] } } }),
      );

      const { status, stderr } = run(["init", "--yes", "--cwd", project]);
      const hasConfig = fs.existsSync(path.join(project, "api.json"));
      fs.rmSync(project, { recursive: true, force: true });

      expect(stderr).not.toInclude("TypeError");
      expect(status).toBe(0);
      expect(hasConfig).toBeTrue();
    });
    it("should fail with a message instead of a crash on unknown option", () => {
      const { status, stderr } = run(["--not-existing-option"]);

      expect(status).not.toBe(0);
      expect(stderr).toInclude("unknown option");
      expect(stderr).not.toInclude("TypeError");
    });
  });

  describe("when requiring built package", () => {
    it("should expose the public api", () => {
      const output = execFileSync(
        process.execPath,
        ["-e", `process.stdout.write(typeof require(${JSON.stringify(indexFile)}).OpenapiRequestGenerator)`],
        { encoding: "utf-8" },
      );

      expect(output).toBe("function");
    });
  });
});
