/**
 * Keeps every published entry point loadable with only what npm installs for it.
 *
 * npm installs `dependencies` and required peers, never optional peers. A value import of an optional peer in an entry
 * point fails with "Cannot find module" for everyone who skipped that peer, as soon as they import anything from the
 * entry, and tree-shaking cannot help because resolution fails first. Such code belongs in its own subpath export,
 * which may load the optional peer because importing the subpath opts in. `import type` is fine anywhere because the
 * build erases it.
 *
 * Reads the built `dist`, so run `pnpm build` first. Each entry is followed through the chunks it imports statically.
 */
import assert from "node:assert/strict";
import { builtinModules } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packagesDir = path.join(root, "packages");

/** Packages that npm never sees: the internal test helpers and the desktop app */
const unpublished = new Set(["testing", "hyper-flow"]);

/**
 * Optional peers an entry may still load, each with the reason. Keep this list empty unless the peer is the whole
 * point of the package, so nobody installs the package without it.
 */
const allowed = {
  "@hyper-fetch/firebase": {
    firebase: "The adapter wraps the Firebase browser SDK. It does nothing without firebase.",
  },
  "@hyper-fetch/firebase-admin": {
    "firebase-admin": "The adapter wraps the Firebase Admin SDK. It does nothing without firebase-admin.",
  },
};

const builtins = new Set([...builtinModules, ...builtinModules.map((name) => `node:${name}`)]);

/** `@scope/name/sub/path` → `@scope/name`, `name/sub` → `name` */
const packageName = (specifier) => {
  const parts = specifier.split("/");
  return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
};

/**
 * Specifiers of the static imports and re-exports a built file runs on load. The bundler prints each one at the start
 * of a line, so comments and bundled string literals never match. The build has already erased `import type`, and a
 * dynamic `import()` is left out on purpose: it is how code loads an optional peer only when it is used.
 */
const importsOf = (code) => {
  const pattern = /^(?:import|export)\s+(?:[^;"']*?\s+from\s+)?["']([^"']+)["']/gm;
  return [...code.matchAll(pattern)].map((match) => match[1]);
};

/** Every runtime file an `exports` map or `main` points at, with the subpath it is published under */
const entriesOf = (pkg) => {
  const files = new Map();
  const add = (file, subpath) => {
    const normalized = path.normalize(file);
    if (!files.has(normalized) || subpath === ".") files.set(normalized, subpath);
  };
  const walk = (value, subpath) => {
    if (typeof value === "string") {
      if (/\.(m|c)?js$/.test(value)) add(value, subpath);
      return;
    }
    for (const [key, nested] of Object.entries(value ?? {})) {
      if (key !== "types") walk(nested, subpath);
    }
  };
  const exportsMap = typeof pkg.exports === "string" ? { ".": pkg.exports } : (pkg.exports ?? {});
  for (const [subpath, target] of Object.entries(exportsMap)) {
    if (subpath.startsWith(".")) walk(target, subpath);
  }
  if (pkg.main) add(pkg.main, ".");
  if (pkg.module) add(pkg.module, ".");
  return [...files].map(([file, subpath]) => ({ file, subpath }));
};

/** The package names a built entry loads, following its relative chunks */
const runtimeImports = (dir, entry) => {
  const names = new Map();
  const seen = new Set();
  const visit = (file) => {
    if (seen.has(file) || !fs.existsSync(file)) return;
    seen.add(file);
    for (const specifier of importsOf(fs.readFileSync(file, "utf8"))) {
      if (specifier.startsWith(".")) {
        visit(path.resolve(path.dirname(file), specifier));
      } else if (!builtins.has(specifier)) {
        names.set(packageName(specifier), path.relative(dir, file));
      }
    }
  };
  visit(path.join(dir, entry));
  return names;
};

const packages = fs
  .readdirSync(packagesDir)
  .filter((name) => !unpublished.has(name))
  .map((name) => path.join(packagesDir, name))
  .filter((dir) => fs.existsSync(path.join(dir, "package.json")))
  .map((dir) => ({ dir, pkg: JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8")) }))
  .filter(({ pkg }) => !pkg.private);

describe("published entry points", () => {
  for (const { dir, pkg } of packages) {
    const entries = entriesOf(pkg);
    if (!entries.length) continue;

    test(`${pkg.name} loads only what npm installs for it`, () => {
      const optional = new Set(
        Object.entries(pkg.peerDependenciesMeta ?? {})
          .filter(([, meta]) => meta.optional)
          .map(([name]) => name),
      );
      const installed = new Set([
        ...Object.keys(pkg.dependencies ?? {}),
        ...Object.keys(pkg.peerDependencies ?? {}).filter((name) => !optional.has(name)),
      ]);
      const declared = new Set([...installed, ...optional]);
      const problems = [];

      for (const { file: entry, subpath } of entries) {
        assert.ok(fs.existsSync(path.join(dir, entry)), `${pkg.name}: ${entry} is missing. Run pnpm build first.`);
        for (const [name, file] of runtimeImports(dir, entry)) {
          if (name === pkg.name || installed.has(name) || allowed[pkg.name]?.[name]) continue;
          // A subpath such as `@hyper-fetch/firebase/db` exists for its optional peer: importing it opts in
          if (optional.has(name) && subpath !== ".") continue;
          problems.push(
            declared.has(name)
              ? `${entry} loads the optional peer ${name} (in ${file}). Move that code to a subpath export.`
              : `${entry} loads ${name} (in ${file}), which package.json does not declare.`,
          );
        }
      }

      assert.deepEqual(problems, []);
    });
  }
});
