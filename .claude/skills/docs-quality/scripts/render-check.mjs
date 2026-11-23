#!/usr/bin/env node
// Load every page in headless Chrome and report what renders wrong. Run against a production build served with
// `docusaurus serve` (a dev server falls over under a whole-site run).
// Usage: node .claude/skills/docs-quality/scripts/render-check.mjs --base http://localhost:3360 [--mobile] [--filter core/]
//        [--shots <dir>]
// Checks: page wider than the viewport, hand-written or live code that scrolls sideways, hand-written tables wider
// than the column, raw MDX (:::, (@import), 404, a missing or duplicated h1, Mermaid that did not render, images that
// do not load (the page is scrolled first, so lazy images load), and page errors.
import { mkdirSync } from "node:fs";
import { join } from "node:path";

import { args, launch, listPages, pageUrl, sleep } from "./lib.mjs";

const opts = args();
const base = opts.base || "http://localhost:3360";
const mobile = Boolean(opts.mobile);
const pages = listPages(opts.filter || "");
if (opts.shots) mkdirSync(opts.shots, { recursive: true });

const browser = await launch();
const page = await browser.newPage();
await page.setViewport(mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 });

let failing = 0;
for (const file of pages) {
  const errors = [];
  const onError = (e) => errors.push(String(e.message || e).slice(0, 160));
  page.on("pageerror", onError);
  try {
    await page.goto(pageUrl(base, file), { waitUntil: "load", timeout: 120000 });
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 700) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 50));
      }
      window.scrollTo(0, 0);
    });
    await sleep(1200);
  } catch (e) {
    errors.push(`goto: ${e.message}`);
  }
  const issues = await page
    .evaluate(() => {
      const out = [];
      const md = document.querySelector(".theme-doc-markdown");
      if (!md) return ["no markdown container (build error or 404)"];
      const text = md.innerText;
      if (/Page Not Found/.test(document.title)) out.push("404");
      if (document.documentElement.scrollWidth > window.innerWidth + 2) {
        out.push(`page wider than viewport ${document.documentElement.scrollWidth}>${window.innerWidth}`);
      }
      if (/\(@import /.test(text)) out.push("raw (@import");
      if (/^:::/m.test(text)) out.push("raw admonition");
      if (/\[object Object\]/.test(text)) out.push("[object Object] in text");
      const h1 = document.querySelectorAll("article h1").length;
      if (h1 !== 1) out.push(`h1 x${h1}`);
      const generated = (el) => el.closest("[class*='api-docs'], [class*='playground']");
      // Phones scroll code inside its block, which is fine; the desktop column must fit hand-written code
      if (window.innerWidth >= 997) {
        const code = [...md.querySelectorAll("pre")].filter((p) => p.scrollWidth > p.clientWidth + 2 && !generated(p));
        if (code.length) out.push(`code scrolls sideways x${code.length}`);
      }
      const tables = [...md.querySelectorAll("table")].filter((t) => !generated(t) && t.scrollWidth > md.clientWidth + 2);
      if (tables.length) out.push(`table wider than column x${tables.length}`);
      const mermaid = md.querySelectorAll(".docusaurus-mermaid-container").length;
      const svgs = md.querySelectorAll(".docusaurus-mermaid-container svg").length;
      if (mermaid !== svgs) out.push(`mermaid rendered ${svgs}/${mermaid}`);
      const broken = [...md.querySelectorAll("img")].filter((img) => !(img.complete && img.naturalWidth > 0));
      if (broken.length) out.push(`images not loaded: ${broken.map((i) => i.getAttribute("src")).join(" ")}`);
      return out;
    })
    .catch((e) => [`evaluate: ${e.message.slice(0, 120)}`]);
  page.off("pageerror", onError);
  if (opts.shots) {
    const name = `${file.replace(/\//g, "__").replace(/\.mdx?$/, "")}${mobile ? ".m" : ""}.png`;
    await page.screenshot({ path: join(opts.shots, name), fullPage: true }).catch(() => {});
  }
  const all = [...issues, ...new Set(errors)];
  if (all.length) failing++;
  console.log(`${all.length ? "!!" : "ok"} ${file}${all.length ? `  ${all.join(" | ")}` : ""}`);
}
await browser.close();
console.log(`${pages.length} pages, ${failing} with issues (${mobile ? "390px" : "1440px"})`);
process.exitCode = failing ? 1 : 0;
