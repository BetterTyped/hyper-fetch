import fs from "fs";
import path from "path";

type PackageJson = {
  peerDependencies?: Record<string, string>;
};

/**
 * Build `build.rollupOptions.external` from the nearest `package.json` peers.
 * When `react` is a peer, also externalize JSX runtimes (not usually listed as peers)
 * so Rolldown does not inline CJS shims that call `require("react")` in the browser.
 * When `firebase` / `firebase-admin` are peers, add common subpath imports Rollup matches exactly.
 */
export function getRollupExternalsFromPackageJson(packageRootDir: string): string[] {
  const pkgPath = path.join(packageRootDir, "package.json");
  const raw = fs.readFileSync(pkgPath, "utf-8");
  const pkg = JSON.parse(raw) as PackageJson;
  const external = new Set<string>(Object.keys(pkg.peerDependencies ?? {}));

  if (external.has("react")) {
    external.add("react/jsx-runtime");
    external.add("react/jsx-dev-runtime");
  }

  if (external.has("firebase")) {
    external.add("firebase/app");
    external.add("firebase/database");
    external.add("firebase/firestore");
  }

  if (external.has("firebase-admin")) {
    external.add("firebase-admin/app");
    external.add("firebase-admin/database");
    external.add("firebase-admin/firestore");
  }

  return [...external];
}
