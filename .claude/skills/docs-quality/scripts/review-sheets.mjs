#!/usr/bin/env node
// Turn full-page desktop screenshots (from render-check --shots) into one review sheet per page: the content column
// cut into side-by-side segments, so a whole page fits in one readable image.
// Usage: node .claude/skills/docs-quality/scripts/review-sheets.mjs <shotsDir> <outDir>
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { args, launch } from "./lib.mjs";

const { _: [shotsArg, outArg] } = args();
if (!shotsArg || !outArg) throw new Error("Usage: review-sheets.mjs <shotsDir> <outDir>");
const shots = resolve(shotsArg);
const out = resolve(outArg);
mkdirSync(out, { recursive: true });

// The content column of a 1440px docs page, below the navbar
const X = 330;
const W = 790;
const H = 2400;
const TOP = 80;
const GAP = 14;

const browser = await launch();
const page = await browser.newPage();
for (const name of readdirSync(shots).filter((n) => n.endsWith(".png") && !n.endsWith(".m.png"))) {
  const file = join(shots, name);
  await page.goto(`file://${file}`);
  const height = await page.evaluate(() => document.querySelector("img").naturalHeight);
  const n = Math.max(1, Math.ceil((height - TOP) / H));
  const segments = Array.from(
    { length: n },
    (_, i) =>
      `<div style="width:${W}px;height:${H}px;flex:none;background:#1b1b1d url('file://${file}') no-repeat -${X}px -${TOP + i * H}px"></div>`,
  ).join("");
  const html = join(out, "sheet.html");
  writeFileSync(html, `<html><body style="margin:0;background:#000;display:flex;gap:${GAP}px">${segments}</body></html>`);
  const width = n * W + (n - 1) * GAP;
  await page.setViewport({ width, height: H, deviceScaleFactor: Math.min(0.62, 2200 / width) });
  await page.goto(`file://${html}`, { waitUntil: "load" });
  await page.screenshot({ path: join(out, name.replace(/\.png$/, ".jpg")), type: "jpeg", quality: 72 });
}
await browser.close();
console.log(`sheets written to ${out}`);
