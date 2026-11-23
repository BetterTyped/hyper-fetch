import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";

/**
 * Renders the root README banner into `.github/assets/readme.png` (3200x1260).
 *
 * It mirrors the landing hero without anything that only belongs on the site: the wordmark, "Fetch anything. Type
 * everything." with the red type-error squiggle, the lead line and the logo row read from `hero/ecosystem.tsx`.
 * No video, no badges, no buttons, no toasts. Never screenshot the dev server for this banner.
 *
 *   node scripts/readme-banners/root.mjs
 *
 * Needs Google Chrome installed and network access for Google Fonts.
 */

/* eslint-disable no-console */

const require = createRequire(import.meta.url);
const puppeteer = require("puppeteer");

const root = resolve(import.meta.dirname, "../..");
const img = join(root, "documentation/static/img");
const out = join(root, ".github/assets/readme.png");

const WIDTH = 1600;
const HEIGHT = 630;

const dataUri = (file) => {
  const type = file.endsWith(".svg") ? "image/svg+xml" : "image/png";
  return `data:${type};base64,${readFileSync(file).toString("base64")}`;
};

/* The hero logo row, in the same order and scale as the landing */
const ecosystem = readFileSync(
  join(root, "documentation/src/components/landing/hero/ecosystem.tsx"),
  "utf8",
);
const logos = [
  ...ecosystem.matchAll(
    /\{\s*name: "([^"]+)",[\s\S]*?src: "([^"]+)",(?:\s*scale: ([\d.]+),)?\s*\}/g,
  ),
].map(([, name, src, scale]) => ({
  name,
  src: dataUri(join(img, src.replace(/^\/img\//, ""))),
  scale: Number(scale ?? 1),
}));
if (logos.length < 10) {
  throw new Error(`Read only ${logos.length} logos from ecosystem.tsx`);
}

/* The request lines behind the hero, read from the same file the landing draws them from */
const heroPaths = readFileSync(
  join(root, "documentation/src/components/landing/hero/hero-paths.tsx"),
  "utf8",
);
const paths = [
  ...(heroPaths.match(/const paths = \[([\s\S]*?)\];/)?.[1] ?? "").matchAll(
    /"([^"]+)"/g,
  ),
].map(([, d]) => d);
if (paths.length < 10) {
  throw new Error(`Read only ${paths.length} hero paths from hero-paths.tsx`);
}

/* A few still request dots on the lines, like the hero mid-animation: [path index, position along it 0..1] */
const DOTS = [
  [11, 0.32],
  [26, 0.71],
  [19, 0.55],
];

const SQUIGGLE = `M0 6 ${"q 3.4 -6 6.8 0 t 6.8 0 ".repeat(22)}`;

const html = `<!doctype html>
<html><head><meta charset="utf-8" />
<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@800&family=Inter:wght@400;500&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet" />
<style>
  * { box-sizing: border-box; margin: 0; }
  body { width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; background: #1c1c1d; font-family: Inter, sans-serif; }
  .stage { position: relative; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .glow { position: absolute; top: -190px; left: 50%; width: 2546px; transform: translateX(-50%); opacity: 0.6; }
  /* The hero draws its paths at 0.2 inside a layer at 0.5. A touch stronger here, so they survive the README downscale */
  .paths { position: absolute; top: 50%; left: 50%; width: 2000px; height: 1000px; transform: translate(-50%, -50%); opacity: 0.16; }
  .dot { position: absolute; width: 4px; height: 4px; margin: -2px 0 0 -2px; opacity: 0.7; border-radius: 50%; background: #f59e0b; box-shadow: 0 0 4px #fff, 0 0 8px #f59e0b, 0 0 16px #f59e0b; }
  .mark { position: relative; height: 40px; }
  h1 { position: relative; margin-top: 34px; text-align: center; font-family: Figtree; font-weight: 800; font-size: 112px; line-height: 1.02; letter-spacing: -0.045em; }
  /* The hero title: each word is a gradient clipped to its text, fading at the top and bottom */
  .clip { color: transparent; -webkit-background-clip: text; background-clip: text; }
  .zinc200 { background-image: linear-gradient(to bottom, rgba(228, 228, 231, 0.6), #e4e4e7, rgba(228, 228, 231, 0.6)); }
  .zinc300 { background-image: linear-gradient(to bottom, rgba(212, 212, 216, 0.6), #d4d4d8, rgba(212, 212, 216, 0.6)); }
  h1 > span { display: block; padding-bottom: 0.06em; }
  .gold { background-image: linear-gradient(to bottom, #ffe08a, #f5a623); padding-bottom: 0.08em; }
  .error { position: relative; isolation: isolate; display: inline-block; }
  .error svg { position: absolute; z-index: -1; bottom: 0.04em; left: -0.06em; width: calc(100% + 0.12em); height: 0.14em; overflow: visible; }
  p { position: relative; margin-top: 30px; max-width: 560px; text-align: center; font-size: 20px; line-height: 1.6; color: #a1a1aa; }
  code { padding: 2px 6px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); font-family: "JetBrains Mono", monospace; font-size: 0.85em; color: #e4e4e7; }
  .logos { position: relative; margin-top: 40px; max-width: 1380px; display: flex; flex-wrap: wrap; justify-content: center; gap: 14px 24px; }
  .logo { display: flex; align-items: center; gap: 9px; font-size: 16px; font-weight: 500; color: #a1a1aa; }
  .logo img { width: 22px; height: 22px; object-fit: contain; }
</style></head>
<body><div class="stage">
  <svg class="paths" viewBox="0 0 2000 1000" fill="none" preserveAspectRatio="none">
    <defs><radialGradient id="g" cx="1" cy="-0.4" r="1.4" gradientUnits="userSpaceOnUse" gradientTransform="translate(352 34) rotate(90) scale(555 1560.62)">
      <stop offset="0.0666667" stop-color="#52525b" /><stop offset="0.243243" stop-color="#52525b" /><stop offset="0.43594" stop-color="#a1a1aa" stop-opacity="0" />
    </radialGradient></defs>
    ${paths.map((d) => `<path opacity="0.54" d="${d}" stroke="url(#g)" stroke-miterlimit="10" />`).join("")}
  </svg>
  <img class="glow" src="${dataUri(join(img, "glow-main.svg"))}" />
  <img class="mark" src="${dataUri(join(img, "brand/HF.svg"))}" />
  <h1>
    <span><span class="clip zinc200">Fetch </span><span class="clip gold">anything.</span></span>
    <span><span class="clip zinc300">Type </span><span class="error"><span class="clip zinc300">everything.</span><svg viewBox="0 0 299.2 12" preserveAspectRatio="none"><path d="${SQUIGGLE}" fill="none" stroke="#f43f5e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 6px rgba(244,63,94,0.45))" /></svg></span></span>
  </h1>
  <p>Cache, retries, dedupe, offline and realtime, built in. Every protocol through one typed <code>createRequest()</code>.</p>
  <div class="logos">${logos
    .map(
      (l) =>
        `<span class="logo"><img src="${l.src}" style="transform: scale(${l.scale})" />${l.name}</span>`,
    )
    .join("")}</div>
</div></body></html>`;

const browser = await puppeteer.launch({ channel: "chrome", headless: true });
const page = await browser.newPage();
await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 2 });
await page.setContent(html, { waitUntil: "networkidle0" });
await page.evaluate(() => document.fonts.ready);
await page.evaluate((dots) => {
  const svg = document.querySelector(".paths");
  const box = svg.getBoundingClientRect();
  const all = svg.querySelectorAll("path");
  for (const [index, at] of dots) {
    const path = all[index];
    const point = path.getPointAtLength(path.getTotalLength() * at);
    const dot = document.createElement("span");
    dot.className = "dot";
    dot.style.left = `${box.left + (point.x / 2000) * box.width}px`;
    dot.style.top = `${box.top + (point.y / 1000) * box.height}px`;
    document.querySelector(".stage").append(dot);
  }
}, DOTS);
await page.screenshot({ path: out });
await browser.close();
console.log(`✓ root → ${out.replace(`${root}/`, "")} (${logos.length} logos)`);
