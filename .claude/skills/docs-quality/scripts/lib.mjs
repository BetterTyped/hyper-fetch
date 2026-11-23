// Shared helpers for the docs-quality scripts. Run them from the repository root.
import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, posix } from "node:path";

export const DOCS = "documentation/docs";

/** Hand-written pages of the current version: everything tracked under docs/ except the generated API pages */
export const listPages = (filter = "") =>
  execSync(`git ls-files ${DOCS}`, { encoding: "utf8" })
    .split("\n")
    .filter((f) => /\.mdx?$/.test(f) && !/docs\/api\/[a-z-]+\/[A-Z]/.test(f))
    .map((f) => f.slice(DOCS.length + 1))
    .filter((f) => f.includes(filter));

/** The URL Docusaurus serves a page at: number prefixes dropped, index folded, slug honored */
export const pageUrl = (base, page) => {
  const src = readFileSync(join(DOCS, page), "utf8");
  const slug = src.match(/^slug:\s*["']?([^"'\n]+)/m);
  let path = page.replace(/\.mdx?$/, "").replace(/(^|\/)\d+-/g, "$1").replace(/(^|\/)index$/, "");
  if (slug) path = slug[1].startsWith("/") ? slug[1].slice(1) : posix.join(posix.dirname(path), slug[1]);
  return `${base}/docs/${path}`;
};

/** puppeteer-core from the pnpm store (it is a transitive dependency, not a root one) */
export const loadPuppeteer = () => {
  const store = "node_modules/.pnpm";
  const dir = readdirSync(store).find((d) => d.startsWith("puppeteer-core@"));
  if (!dir) throw new Error("puppeteer-core is not installed: run pnpm install");
  const require = createRequire(join(process.cwd(), store, dir, "node_modules", "puppeteer-core", "package.json"));
  return require("puppeteer-core");
};

export const launch = async () => {
  const executablePath = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  if (!existsSync(executablePath)) throw new Error(`Chrome not found at ${executablePath}: set CHROME_PATH`);
  const puppeteer = loadPuppeteer();
  // Its own profile per run, so parallel runs do not lock each other out
  return puppeteer.launch({
    executablePath,
    headless: true,
    protocolTimeout: 300000,
    args: [`--user-data-dir=/tmp/hf-docs-quality-${process.pid}`, "--no-first-run", "--allow-file-access-from-files"],
  });
};

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** `--name value` and `--flag` arguments */
export const args = () => {
  const out = { _: [] };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith("--")) out._.push(argv[i]);
    else if (argv[i + 1] && !argv[i + 1].startsWith("--")) out[argv[i].slice(2)] = argv[++i];
    else out[argv[i].slice(2)] = true;
  }
  return out;
};
