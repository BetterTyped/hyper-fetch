import fs from "node:fs";
import path from "node:path";

const IGNORED_TOP_LEVEL_DIRS = new Set(["__tests__", "__mocks__", "node_modules"]);

/**
 * Builds `compilerOptions.paths` for vite-plugin-dts so bare imports that match `baseUrl` (e.g. `from "request"`)
 * are rewritten to relative paths in emitted `.d.ts`. Otherwise consumers resolve them as npm packages.
 *
 * Discovers every immediate subdirectory of `srcDir` (except ignored names). If `srcDir/constants` exists,
 * adds `constants/*` like a normal TS paths entry.
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
  });

  try {
    const constantsDir = path.join(abs, "constants");
    if (fs.statSync(constantsDir).isDirectory()) {
      paths["constants/*"] = ["constants/*"];
    }
  } catch {
    // no constants/
  }

  return paths;
}

export function getDtsCompilerOptionsForPackage(
  packageDir: string,
  srcRelative = "src",
): { baseUrl: string; paths: Record<string, string[]> } {
  const srcPath = path.resolve(packageDir, srcRelative);
  return {
    baseUrl: srcPath,
    paths: getDtsPathMappingsForSrcDir(srcPath),
  };
}
