// Type-checks a db of 50 collections that uses every typed feature, and fails when it no longer compiles or when its
// instantiations grow past the budget. Instantiations are deterministic, unlike check time, so the budget holds on CI.
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

/** About 25% above the measured 257,186, so ordinary changes pass and a type that explodes does not */
const BUDGET = 320_000;

const require = createRequire(import.meta.url);
const tsc = require.resolve("typescript/bin/tsc");
const project = fileURLToPath(new URL("../__tests__/type-budget/tsconfig.json", import.meta.url));

let output;
try {
  output = execFileSync(process.execPath, [tsc, "--noEmit", "-p", project, "--extendedDiagnostics"], {
    encoding: "utf8",
  });
} catch (error) {
  console.error(error.stdout || error.message);
  console.error("The type budget fixture does not compile.");
  process.exit(1);
}

const instantiations = Number(/Instantiations:\s+(\d+)/.exec(output)?.[1]);
const checkTime = /Check time:\s+([\d.]+s)/.exec(output)?.[1];
if (!Number.isFinite(instantiations)) {
  console.error(output);
  console.error("Could not read the instantiation count.");
  process.exit(1);
}
const summary = `${instantiations.toLocaleString("en")} instantiations (budget ${BUDGET.toLocaleString("en")}), check time ${checkTime}`;
if (instantiations > BUDGET) {
  console.error(`Type budget exceeded: ${summary}`);
  process.exit(1);
}
process.stdout.write(`Type budget: ${summary}\n`);
