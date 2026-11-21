import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
/**
 * Renders the header banner of every package README into `.github/assets/packages/<id>.png`.
 *
 * Each banner follows the root README banner: dark canvas, amber glow, wave lines and particles. It adds the package's
 * own logo, accent color, headline, feature chips and a real code snippet (or a HyperFlow screenshot).
 *
 *   node scripts/readme-banners/render.mjs            # every package
 *   node scripts/readme-banners/render.mjs react cli  # only these ids
 *
 * Needs Google Chrome installed and network access for Google Fonts. Content lives in `packages.mjs`.
 */
import { createRequire } from "node:module";
import { join, resolve } from "node:path";

import { banners } from "./packages.mjs";

/* eslint-disable no-console, no-await-in-loop */

const require = createRequire(import.meta.url);
const here = import.meta.dirname;
const root = resolve(here, "../..");
const img = join(root, "documentation/static/img");
const out = join(root, ".github/assets/packages");

const puppeteer = require("puppeteer");
const Prism = require("prismjs");
require("prismjs/components/prism-typescript");
require("prismjs/components/prism-jsx");
require("prismjs/components/prism-tsx");
require("prismjs/components/prism-bash");
require("prismjs/components/prism-json");

const WIDTH = 1280;
const HEIGHT = 500;

/* ------------------------------------------------------------------------------------------------------------------ */
/* Assets                                                                                                             */
/* ------------------------------------------------------------------------------------------------------------------ */

const dataUri = (file) => {
  const buffer = readFileSync(file);
  const type = file.endsWith(".svg") ? "image/svg+xml" : "image/png";
  return `data:${type};base64,${buffer.toString("base64")}`;
};

const lucideDir = (() => {
  const pnpm = join(root, "node_modules/.pnpm");
  const pkg = readdirSync(pnpm)
    .filter((name) => name.startsWith("lucide-react@"))
    .toSorted()
    .pop();
  return join(pnpm, pkg, "node_modules/lucide-react/dist/esm/icons");
})();

const icon = (name, size = 16) => {
  const source = readFileSync(join(lucideDir, `${name}.js`), "utf8");
  const match = source.match(/const __iconNode = (\[[\s\S]*?\]);\n/);
  if (!match) {
    throw new Error(`Cannot read lucide icon ${name}`);
  }
  // eslint-disable-next-line no-new-func
  const nodes = new Function(`return ${match[1]}`)();
  const children = nodes
    .map(([tag, attrs]) => {
      const attributes = Object.entries(attrs)
        .filter(([key]) => key !== "key")
        .map(([key, value]) => `${key}="${value}"`)
        .join(" ");
      return `<${tag} ${attributes}/>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${children}</svg>`;
};

const escape = (text) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const highlight = (code, language) => {
  const grammar = Prism.languages[language];
  if (!grammar) {
    throw new Error(`Unknown language ${language}`);
  }
  return Prism.highlight(code.replace(/\n$/, ""), grammar, language);
};

/* ------------------------------------------------------------------------------------------------------------------ */
/* Background                                                                                                         */
/* ------------------------------------------------------------------------------------------------------------------ */

// Deterministic, so re-rendering a banner without content changes gives the same particles
const random = (seed) => {
  let state = seed;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) % 4_294_967_296;
    return state / 4_294_967_296;
  };
};

const seedOf = (text) => [...text].reduce((sum, char) => (sum * 31 + char.codePointAt(0)) % 100_000, 7);

const particles = (seed) => {
  const next = random(seed);
  return Array.from({ length: 90 }, () => {
    const x = next() * WIDTH;
    const y = next() * HEIGHT;
    // Keep the text and the code card clean
    if ((x > 50 && x < 700 && y > 70 && y < 430) || (x > 650 && x < 1240 && y > 60 && y < 440)) {
      return "";
    }
    const r = (0.6 + next() * 1.1).toFixed(2);
    const o = (0.15 + next() * 0.55).toFixed(2);
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="#fff" opacity="${o}"/>`;
  }).join("");
};

const waves = () => {
  // Parallel curves with a constant offset, so they never cross into a bright knot
  const lines = [];
  for (let i = 0; i < 36; i += 1) {
    const y = 150 + i * 11;
    lines.push(
      `<path d="M -60 ${y + 120} C 280 ${y - 120}, 640 ${y + 210}, 900 ${y - 10} S 1220 ${y - 300}, 1360 ${y - 260}" />`,
    );
  }
  return lines.join("");
};

/* ------------------------------------------------------------------------------------------------------------------ */
/* Template                                                                                                           */
/* ------------------------------------------------------------------------------------------------------------------ */

const windowDots = `<span class="dot" style="background:#ff5f57"></span><span class="dot" style="background:#febc2e"></span><span class="dot" style="background:#28c840"></span>`;

const codeCard = (banner) => {
  const terminal = banner.terminal
    ? `<div class="window terminal">
        <div class="bar">${windowDots}<span class="file">${icon("terminal", 13)} terminal</span></div>
        <pre>${banner.terminal
          .map((line) => {
            const text = escape(line.slice(2));
            if (line.startsWith("$ ")) {
              return `<span class="prompt">$</span> ${text}`;
            }
            if (line.startsWith("! ")) {
              return `<span class="t-error">${text}</span>`;
            }
            if (line.startsWith("+ ")) {
              return `<span class="t-ok">${text}</span>`;
            }
            return `<span class="t-dim">${escape(line)}</span>`;
          })
          .join("\n")}</pre>
      </div>`
    : "";

  const code = banner.code
    ? `<div class="window code">
        <div class="bar">${windowDots}<span class="file">${icon("file-code", 13)} ${banner.file}</span></div>
        <pre class="language-${banner.language}">${highlight(banner.code, banner.language)}</pre>
      </div>`
    : "";

  const screenshot = banner.screenshot
    ? `<div class="shot"><img src="${dataUri(join(img, banner.screenshot))}" alt="" /></div>`
    : "";

  return `<div class="stage">${screenshot}${terminal}${code}</div>`;
};

const page = (banner, fonts) => {
  const logo = dataUri(join(img, banner.logo));
  const bolt = dataUri(join(img, "integration-hyper-fetch.svg"));
  const [first, accent] = banner.headline;

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<link rel="stylesheet" href="${fonts}" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${WIDTH}px; height: ${HEIGHT}px; background: #141415; overflow: hidden; }
  body { font-variant-ligatures: none; font-family: Figtree, Inter, sans-serif; color: #e4e4e7; position: relative; -webkit-font-smoothing: antialiased; }

  .bg { position: absolute; inset: 0; }
  .glow-brand { position: absolute; left: -160px; top: -340px; width: 1100px; height: 720px;
    background: radial-gradient(closest-side, rgba(251, 198, 70, 0.34), rgba(251, 198, 70, 0.10) 55%, transparent); filter: blur(8px); }
  .glow-accent { position: absolute; right: -140px; top: -40px; width: 900px; height: 640px;
    background: radial-gradient(closest-side, ${banner.accent}55, ${banner.accent}18 55%, transparent); filter: blur(10px); }
  .vignette { position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 120%, rgba(0,0,0,0.55), transparent 60%); }
  .waves { position: absolute; inset: 0; fill: none; stroke: rgba(255,255,255,0.045); stroke-width: 1; }
  .frame { position: absolute; inset: 0; border-bottom: 1px solid rgba(255,255,255,0.06); }

  .content { position: absolute; left: 76px; top: 0; bottom: 0; width: 600px; display: flex; flex-direction: column; justify-content: center; }

  .brand { display: flex; align-items: center; gap: 12px; margin-bottom: 26px; }
  .brand .wordmark { display: flex; align-items: center; gap: 4px; font-weight: 800; font-size: 21px; color: #fff; letter-spacing: -0.2px; }
  .brand .wordmark img { width: 30px; height: 30px; margin-left: -6px; }
  .brand .divider { width: 1px; height: 18px; background: rgba(255,255,255,0.18); }
  .brand .pkg { font-family: "JetBrains Mono", monospace; font-size: 13.5px; color: #d4d4d8; padding: 5px 11px; border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.04); box-shadow: inset 0 1px 0 rgba(255,255,255,0.06); }

  h1 { font-family: Inter, sans-serif; font-weight: 800; font-size: ${banner.headlineSize ?? 54}px; line-height: 1.08; letter-spacing: -1.6px; }
  h1 .line { display: block; width: fit-content; background: linear-gradient(180deg, rgba(244,244,245,0.98), rgba(212,212,216,0.72));
    -webkit-background-clip: text; background-clip: text; color: transparent; }
  h1 .accent { display: block; width: fit-content; padding-bottom: 6px; background: linear-gradient(90deg, ${banner.accent}, ${banner.accentTo ?? "#fbc646"});
    -webkit-background-clip: text; background-clip: text; color: transparent; }

  p.description { margin-top: 18px; font-size: 18.5px; line-height: 1.45; color: #a1a1aa; max-width: 560px; }
  p.description code { font-family: "JetBrains Mono", monospace; font-size: 15px; color: #e4e4e7; padding: 1px 7px; border-radius: 6px;
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); }

  .chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 26px; max-width: 590px; }
  .chip { display: inline-flex; align-items: center; gap: 7px; font-size: 13.5px; font-weight: 600; color: #e4e4e7; padding: 7px 12px 7px 10px;
    border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.035); box-shadow: inset 0 1px 0 rgba(255,255,255,0.05); }
  .chip svg { color: ${banner.accent}; flex: none; }

  .stage { position: absolute; right: 56px; top: 0; bottom: 0; width: 536px; display: flex; flex-direction: column; justify-content: center; gap: 14px; }
  .window { border-radius: 14px; border: 1px solid rgba(255,255,255,0.1); background: rgba(22,22,24,0.86); backdrop-filter: blur(6px);
    box-shadow: 0 30px 80px -20px rgba(0,0,0,0.75), 0 0 0 1px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06); overflow: hidden; }
  .bar { display: flex; align-items: center; gap: 7px; padding: 11px 14px; border-bottom: 1px solid rgba(255,255,255,0.07); background: rgba(255,255,255,0.02); }
  .dot { width: 11px; height: 11px; border-radius: 50%; opacity: 0.9; }
  .file { display: inline-flex; align-items: center; gap: 6px; margin-left: 10px; font-family: "JetBrains Mono", monospace; font-size: 12px; color: #a1a1aa; }
  pre { font-variant-ligatures: none; font-family: "JetBrains Mono", monospace; font-size: ${banner.codeSize ?? 13.5}px; line-height: 1.62; padding: 16px 20px 18px; color: #e4e4e7; white-space: pre; }
  .terminal pre { font-size: 12.5px; padding: 12px 18px 14px; }
  .prompt { color: ${banner.accent}; }
  .t-dim { color: #a1a1aa; }
  .t-error { color: #fb7185; }
  .t-ok { color: #4ade80; }

  .token.comment, .token.prolog { color: #71717a; font-style: italic; }
  .token.keyword, .token.module, .token.control-flow { color: #ff7ab2; }
  .token.string, .token.template-string, .token.attr-value { color: #9ae6b4; }
  .token.function, .token.method { color: #fcd34d; }
  .token.class-name, .token.builtin, .token.maybe-class-name { color: #7dd3fc; }
  .token.number, .token.boolean, .token.constant { color: #fdba74; }
  .token.property, .token.property-access, .token.attr-name { color: #e4e4e7; }
  .token.punctuation, .token.operator { color: #a1a1aa; }
  .token.tag { color: #f9a8d4; }
  .token.tag .token.punctuation { color: #a1a1aa; }
  .token.interpolation-punctuation { color: #ff7ab2; }
  .token.generic-function .token.function { color: #fcd34d; }

  .shot { border-radius: 14px; overflow: hidden; border: 1px solid rgba(255,255,255,0.12);
    box-shadow: 0 30px 80px -20px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.06);
    transform: perspective(1600px) rotateY(-9deg) rotateX(3deg); transform-origin: left center; }
  .shot img { display: block; width: 100%; }

  .logo-tile { position: absolute; right: 32px; top: 34px; width: 74px; height: 74px; border-radius: 20px; display: flex; align-items: center; justify-content: center;
    border: 1px solid rgba(255,255,255,0.14); background: linear-gradient(180deg, rgba(40,40,44,0.95), rgba(24,24,27,0.95));
    box-shadow: 0 0 0 6px rgba(255,255,255,0.025), 0 0 60px -6px ${banner.accent}99, inset 0 1px 0 rgba(255,255,255,0.08); z-index: 3; }
  .logo-tile img { width: 40px; height: 40px; object-fit: contain; transform: scale(${banner.logoScale ?? 1}); }
</style>
</head>
<body>
  <div class="bg">
    <div class="glow-brand"></div>
    <div class="glow-accent"></div>
    <svg class="waves" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">${waves()}</svg>
    <svg style="position:absolute;inset:0" width="${WIDTH}" height="${HEIGHT}">${particles(seedOf(banner.id))}</svg>
    <div class="vignette"></div>
    <div class="frame"></div>
  </div>

  <div class="content">
    <div class="brand">
      <span class="wordmark"><img src="${bolt}" alt="" />Hyper Fetch</span>
      <span class="divider"></span>
      <span class="pkg">${banner.pkg}</span>
    </div>
    <h1><span class="line">${escape(first)}</span><span class="accent">${escape(accent)}</span></h1>
    <p class="description">${banner.description}</p>
    <div class="chips">${banner.chips.map(([name, label]) => `<span class="chip">${icon(name, 15)}${escape(label)}</span>`).join("")}</div>
  </div>

  ${codeCard(banner)}

  <div class="logo-tile"><img src="${logo}" alt="" /></div>
</body>
</html>`;
};

/* ------------------------------------------------------------------------------------------------------------------ */
/* Render                                                                                                             */
/* ------------------------------------------------------------------------------------------------------------------ */

const fonts =
  "https://fonts.googleapis.com/css2?family=Figtree:wght@400;600;800&family=Inter:wght@400;600;800&family=JetBrains+Mono:wght@400;500&display=block";

const only = process.argv.slice(2);
const selected = only.length > 0 ? banners.filter((banner) => only.includes(banner.id)) : banners;

mkdirSync(out, { recursive: true });

const failures = [];
const browser = await puppeteer.launch({ channel: "chrome", headless: true });
try {
  const tab = await browser.newPage();
  await tab.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 2 });

  for (const banner of selected) {
    const html = page(banner, fonts);
    if (process.env.BANNER_HTML) {
      writeFileSync(join(process.env.BANNER_HTML, `${banner.id}.html`), html);
    }
    await tab.setContent(html, { waitUntil: "load" });
    await tab.evaluate(async () => {
      await document.fonts.ready;
      const missing = ["800 20px Figtree", "800 20px Inter", '400 13px "JetBrains Mono"'].filter(
        (font) => !document.fonts.check(font),
      );
      if (missing.length > 0) {
        throw new Error(`Fonts did not load: ${missing.join(", ")}`);
      }
    });

    // A banner that overflows its canvas is a content bug, not something to crop silently
    const overflow = await tab.evaluate(() => {
      const box = (selector) => document.querySelector(selector)?.getBoundingClientRect();
      const content = box(".content > .chips");
      const stage = [...document.querySelectorAll(".stage > *")].map((el) => el.getBoundingClientRect());
      const pres = [...document.querySelectorAll(".window pre")].map((el) => el.scrollWidth - el.clientWidth);
      const stageLeft = Math.min(...stage.map((rect) => rect.left));
      const textRight = Math.max(
        ...[...document.querySelectorAll(".content h1 span, .content .chip, .content .brand > *")].map(
          (el) => el.getBoundingClientRect().right,
        ),
      );
      const chips = [...document.querySelectorAll(".chip")].map((el) => el.getBoundingClientRect().top);
      return {
        chipRows: new Set(chips).size > 1,
        overlap: textRight > stageLeft - 24,
        content: content ? content.bottom > window.innerHeight - 24 : false,
        stage: stage.length > 0 ? stage[0].top < 20 || stage.at(-1).bottom > window.innerHeight - 20 : false,
        code: pres.some((delta) => delta > 1) ? pres : false,
      };
    });
    const problems = Object.entries(overflow).filter(([, value]) => value);
    if (problems.length > 0) {
      failures.push(`${banner.id}: ${JSON.stringify(Object.fromEntries(problems))}`);
      continue;
    }

    const file = join(out, `${banner.id}.png`);
    await tab.screenshot({ path: file, type: "png" });
    console.log(`✓ ${banner.id} → ${file.replace(`${root}/`, "")}`);
  }
} finally {
  await browser.close();
}

if (failures.length > 0) {
  console.error(`\nThese banners overflow their canvas and were not written:\n${failures.join("\n")}`);
  process.exit(1);
}
