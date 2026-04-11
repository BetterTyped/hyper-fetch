import fs from "node:fs";
import path from "node:path";

const IGNORED_TOP_LEVEL_DIRS = new Set(["__tests__", "__mocks__", "node_modules"]);

/**
 * Builds `compilerOptions.paths` for vite-plugin-dts so bare imports that match `baseUrl` (e.g. `from "request"`)
 * are rewritten to relative paths in emitted `.d.ts`. Otherwise consumers resolve them as npm packages.
 *
 * Discovers every immediate subdirectory of `srcDir` (except ignored names) and adds both exact and wildcard
 * entries. The wildcard handles sub-path imports like `from "adapter/adapter"`.
 *
 * Also reads the package's tsconfig.json (if present) and merges any explicit `compilerOptions.paths` entries
 * that resolve within the src directory.
 */
export function getDtsPathMappingsForSrcDir(srcDir: string): Record<string, string[]> {
  const abs = path.resolve(srcDir);
  const paths: Record<string, string[]> = {};

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(abs, { withFileTypes: true });
  } catch {
    return paths;
  }

  entries.forEach((ent) => {
    if (!ent.isDirectory()) return;
    if (IGNORED_TOP_LEVEL_DIRS.has(ent.name)) return;
    if (ent.name.startsWith(".")) return;
    paths[ent.name] = [ent.name];
    paths[`${ent.name}/*`] = [`${ent.name}/*`];
  });

  return paths;
}

function readTsconfigPaths(packageDir: string): Record<string, string[]> | null {
  try {
    const raw = fs.readFileSync(path.resolve(packageDir, "tsconfig.json"), "utf-8");
    const tsconfig = JSON.parse(raw);
    return tsconfig?.compilerOptions?.paths ?? null;
  } catch {
    return null;
  }
}

export function getDtsCompilerOptionsForPackage(
  packageDir: string,
  srcRelative = "src",
): { baseUrl: string; paths: Record<string, string[]> } {
  const srcPath = path.resolve(packageDir, srcRelative);
  const scanned = getDtsPathMappingsForSrcDir(srcPath);

  const tsconfigPaths = readTsconfigPaths(packageDir);
  if (tsconfigPaths) {
    // eslint-disable-next-line no-restricted-syntax
    for (const [key, value] of Object.entries(tsconfigPaths)) {
      if (key.startsWith("@")) continue;
      if (!(key in scanned)) {
        scanned[key] = value;
      }
    }
  }

  return {
    baseUrl: srcPath,
    paths: scanned,
  };
}
