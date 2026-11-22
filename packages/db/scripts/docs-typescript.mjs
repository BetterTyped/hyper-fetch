/**
 * The API docs parse `src` with the TypeScript the documentation pins, which is older than the repo's. Code that
 * only newer compilers accept, such as the built-in `NoInfer`, makes the docs build fail on main after merge.
 * Compile `src` with that version here, so the failure shows in this package's typecheck instead.
 */
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";

const root = path.dirname(import.meta.dirname);
const require = createRequire(path.join(root, "../../documentation/package.json"));
const tsc = require.resolve("typescript/bin/tsc");
const { version } = require("typescript/package.json");

try {
  execFileSync(process.execPath, [tsc, "--noEmit", "--emitDeclarationOnly", "false", "-p", "tsconfig.json"], {
    cwd: root,
    stdio: "inherit",
  });
} catch {
  console.error(`\nsrc does not compile with TypeScript ${version}, the version the API docs use.\n`);
  process.exit(1);
}
process.stdout.write(`src compiles with TypeScript ${version}, the version the API docs use.\n`);
