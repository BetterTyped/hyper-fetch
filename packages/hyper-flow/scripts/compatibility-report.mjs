/**
 * Runs the adapter compatibility matrix and prints it as a Markdown table.
 * Usage: `pnpm test:compatibility` (from packages/hyper-flow). Exits with 1 when any cell fails.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const dir = mkdtempSync(path.join(tmpdir(), "hyperflow-compat-"));
const outputFile = path.join(dir, "results.json");

try {
  execFileSync(
    "pnpm",
    ["exec", "vitest", "run", "__tests__/compatibility", "--reporter=json", `--outputFile=${outputFile}`],
    { stdio: ["ignore", "ignore", "inherit"] },
  );
} catch {
  // Failing cells are reported in the table below
}

const results = JSON.parse(readFileSync(outputFile, "utf8"));
rmSync(dir, { recursive: true, force: true });

const adapters = [];
const capabilities = [];
const cells = new Map();

for (const file of results.testResults) {
  for (const test of file.assertionResults) {
    const adapter = /Compatibility \[ (.+) \]/.exec(test.ancestorTitles.join(" "))?.[1]?.replace(/^'|'$/g, "");
    if (!adapter) {
      continue;
    }
    if (!adapters.includes(adapter)) {
      adapters.push(adapter);
    }
    if (!capabilities.includes(test.title)) {
      capabilities.push(test.title);
    }
    cells.set(`${adapter}|${test.title}`, test.status);
  }
}

const symbol = (status) => (status === "passed" ? "✅" : status === "failed" ? "❌" : "–");
const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

const lines = [
  `| HyperFlow feature | ${adapters.join(" | ")} |`,
  `| --- | ${adapters.map(() => ":---:").join(" | ")} |`,
  ...capabilities.map(
    (capability) =>
      `| ${capitalize(capability)} | ${adapters.map((adapter) => symbol(cells.get(`${adapter}|${capability}`))).join(" | ")} |`,
  ),
];

console.log(lines.join("\n"));

const failed = [...cells.values()].filter((status) => status === "failed").length;
if (failed) {
  console.error(`\n${failed} compatibility check(s) failed`);
  process.exit(1);
}
