#!/usr/bin/env node
// Mechanical audit of the docs source: em dashes, filler words, internal links that do not resolve, code lines too
// wide for the content column (80 columns, 40 in live blocks), bare install fences and summaries after Next steps.
// Usage: node .claude/skills/docs-quality/scripts/audit.mjs [path-filter]
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { DOCS, args, listPages } from "./lib.mjs";

const { _: [filter = ""] } = args();
const pages = listPages();
const urls = new Set(pages.map((f) => f.replace(/\.mdx?$/, "").replace(/(^|\/)\d+-/g, "$1").replace(/(^|\/)index$/, "")));
const FLUFF =
  /\b(seamless(ly)?|effortless(ly)?|robust|powerful|simply|easily|blazing|cutting-edge|elegant(ly)?|it's worth noting|in order to|leverage|unleash|supercharge|out of the box)\b/gi;

const linkOk = (link) => {
  if (/^\/(img|examples|blog)/.test(link)) return true;
  if (!link.startsWith("/docs/")) return false;
  const rel = link.split("#")[0].replace(/\/$/, "").slice("/docs/".length);
  if (rel.startsWith("api/") && rel !== "api/getting-started") {
    // Generated pages exist after a build or docs start
    return existsSync(join(DOCS, `${rel}.mdx`)) || existsSync(join(DOCS, `${rel}.md`)) || !existsSync(join(DOCS, "api", "core"));
  }
  return urls.has(rel);
};

let withIssues = 0;
for (const page of pages.filter((p) => p.includes(filter))) {
  const src = readFileSync(join(DOCS, page), "utf8");
  const issues = [];
  const em = (src.match(/—/g) || []).length;
  if (em) issues.push(`em dash x${em}`);
  const fluff = [...src.matchAll(FLUFF)].map((m) => m[0].toLowerCase());
  if (fluff.length) issues.push(`filler: ${[...new Set(fluff)].join(", ")}`);
  const links = [...src.matchAll(/\]\((\/[^)\s]*)\)/g), ...src.matchAll(/to="(\/[^"]*)"/g)].map((m) => m[1]);
  const bad = [...new Set(links.filter((l) => !linkOk(l)))];
  if (bad.length) issues.push(`links: ${bad.join(" ")}`);
  for (const m of src.matchAll(/^( *)```(\w+)([^\n]*)\n([\s\S]*?)^\1```/gm)) {
    const [, indent, lang, meta, body] = m;
    if (lang === "npm2yarn2pnpm") issues.push("bare ```npm2yarn2pnpm fence renders no tabs: use ```bash npm2yarn2pnpm");
    if (["mermaid", "json", "bash", "sh", "text"].includes(lang)) continue;
    // ```tsx live: the playground editor is about 40 columns wide; imports wrap cleanly before the package name
    const live = /^\s*live(\s|$)/.test(meta);
    const max = live ? 41 : 82;
    const lines = body.split("\n").map((l) => l.slice(indent.length));
    const wide = lines.filter((l) => l.length > max && !(live && l.startsWith("import "))).length;
    if (wide) issues.push(`${wide} ${lang}${live ? " live" : ""} line(s) over ${max - 1} columns`);
  }
  const stepsWithCode = [...src.matchAll(/<FlowStep[^>]*>([\s\S]*?)<\/FlowStep>/g)].filter((m) => m[1].includes("`"));
  if (stepsWithCode.length) issues.push(`inline code in ${stepsWithCode.length} FlowStep(s): it breaks mid-token`);
  const next = src.search(/^## Next( steps)?$/m);
  if (next !== -1 && /^:::(secondary|success)/m.test(src.slice(next))) issues.push("summary after Next steps");
  if (issues.length) {
    withIssues++;
    console.log(`${page}\n  ${issues.join("\n  ")}`);
  }
}
console.log(`${pages.filter((p) => p.includes(filter)).length} pages, ${withIssues} with issues`);
process.exitCode = withIssues ? 1 : 0;
