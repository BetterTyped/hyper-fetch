#!/usr/bin/env node
// Render blog posts from a served docs build, take full-page screenshots and report what looks wrong.
// Usage, from the repository root:
//   node .claude/skills/release-posts/scripts/check-posts.mjs --base http://localhost:3360 --shots /tmp/hf-posts \
//     hyper-fetch-10-0 hyper-fetch-10-sockets
// Checks: in-page anchor links that point at no heading, lists without markers, code that scrolls sideways at 1440px,
// images that do not load, card components left in the post, and page errors.
import { mkdirSync } from "node:fs";
import { join } from "node:path";

import { args, launch, sleep } from "../../docs-quality/scripts/lib.mjs";

const opts = args();
const base = opts.base || "http://localhost:3360";
const slugs = opts._;
if (!slugs.length) throw new Error("Pass one or more blog slugs, for example hyper-fetch-10-0");
if (opts.shots) mkdirSync(opts.shots, { recursive: true });

const browser = await launch();
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

let failing = 0;
for (const slug of slugs) {
  const errors = [];
  const onError = (e) => errors.push(String(e.message || e).slice(0, 160));
  page.on("pageerror", onError);
  await page.goto(`${base}/blog/${slug}/`, { waitUntil: "load", timeout: 120000 });
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 700) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
    window.scrollTo(0, 0);
  });
  await sleep(1200);
  const report = await page.evaluate(() => {
    const issues = [];
    const article = document.querySelector("article");
    if (!article) return { issues: ["no article (404 or build error)"], words: 0, blocks: 0 };
    const ids = new Set([...document.querySelectorAll("[id]")].map((e) => e.id));
    const deadAnchors = [...article.querySelectorAll('a[href^="#"]')]
      .map((a) => a.getAttribute("href").slice(1))
      .filter((id) => id && !ids.has(decodeURIComponent(id)));
    if (deadAnchors.length) issues.push(`anchors with no heading: ${[...new Set(deadAnchors)].join(", ")}`);
    const bare = [...article.querySelectorAll("ul > li, ol > li")].filter(
      (li) => getComputedStyle(li).listStyleType === "none" && !li.closest("nav, .tabs, [class*='tabs']"),
    );
    if (bare.length) issues.push(`list items without markers x${bare.length}`);
    const wide = [...article.querySelectorAll("pre")].filter((p) => p.scrollWidth > p.clientWidth + 2);
    if (wide.length) issues.push(`code scrolls sideways x${wide.length}`);
    const broken = [...article.querySelectorAll("img")].filter((img) => !(img.complete && img.naturalWidth > 0));
    if (broken.length) issues.push(`images not loaded x${broken.length}`);
    const cards = article.querySelectorAll("[class*='link-card'], a.relative.flex.flex-col.rounded-xl, ol[class*='counter']");
    const highlightCards = [...article.querySelectorAll("div")].filter((d) => /\[counter-reset:highlight\]/.test(d.className));
    if (highlightCards.length) issues.push(`highlight card grids x${highlightCards.length}`);
    const words = article.innerText.split(/\s+/).length;
    const blocks = article.querySelectorAll("pre, img").length;
    return { issues, words, blocks, cards: cards.length };
  });
  page.off("pageerror", onError);
  if (opts.shots) await page.screenshot({ path: join(opts.shots, `${slug}.png`), fullPage: true });
  const all = [...report.issues, ...new Set(errors)];
  if (all.length) failing++;
  const rhythm = report.blocks ? Math.round(report.words / report.blocks) : report.words;
  console.log(
    `${all.length ? "!!" : "ok"} ${slug}  ${report.words} words, ${report.blocks} code blocks or images (one per ~${rhythm} words)${all.length ? `  ${all.join(" | ")}` : ""}`,
  );
}
await browser.close();
process.exitCode = failing ? 1 : 0;
