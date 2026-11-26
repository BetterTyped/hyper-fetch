/*
 * Renders every launch video to out/<id>.mp4, or only the ids passed as arguments.
 *   pnpm render                         all videos
 *   pnpm render HyperFetchDB            one video
 *   pnpm still HyperFetchDB 300 900     those frames as PNG in out/stills
 * The project is bundled once per run.
 */
import { execFileSync } from "node:child_process";

import { bundle } from "@remotion/bundler";
import { getCompositions, renderMedia, renderStill } from "@remotion/renderer";
import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const still = args[0] === "--still";
const rest = still ? args.slice(1) : args;

/* The music and sound effects are generated, so make sure they match the current cue sheet */
execFileSync(process.execPath, [path.join(root, "scripts/score.mjs"), ...(still ? [] : rest)], { stdio: "inherit" });

const serveUrl = await bundle({ entryPoint: path.join(root, "src/index.ts"), publicDir: path.join(root, "public") });
/*
 * Every bundle copies public/ (the music and sound effects, about 120 MB) into a temp folder that Remotion does not
 * remove. A day of stills and audits filled the disk with 23 GB of them, so the bundle is deleted when the run ends,
 * even when it fails.
 */
const removeBundle = () => rmSync(serveUrl, { recursive: true, force: true });
process.on("exit", removeBundle);
/* Light leaks and other effects draw with WebGL */
const chromiumOptions = { gl: "angle" };

/* Text that doesn't fit is logged by FitAudit in the page; collect it here and print it once */
const fit = new Map();
const onBrowserLog = (log) => {
  if (log.text.startsWith("[fit]")) {
    const key = log.text.replace(/ frame \d+/, "");
    if (!fit.has(key)) fit.set(key, log.text);
  }
};
const reportFit = () => {
  if (fit.size === 0) return;
  console.log(`\n${fit.size} fit problem(s):`);
  for (const line of fit.values()) console.log(`  ${line}`);
  process.exitCode = 1;
};
const inputProps = still ? { audit: true } : {};
const compositions = await getCompositions(serveUrl, { chromiumOptions, inputProps });

if (still) {
  const [id, ...frames] = rest;
  const composition = compositions.find((c) => c.id === id);
  if (!composition) throw new Error(`No composition ${id}. Available: ${compositions.map((c) => c.id).join(", ")}`);
  mkdirSync(path.join(root, "out/stills"), { recursive: true });
  for (const frame of frames) {
    const output = path.join(root, `out/stills/${id}-${frame}.png`);
    await renderStill({ composition, serveUrl, output, frame: Number(frame), chromiumOptions, onBrowserLog, inputProps });
    console.log(output);
  }
} else {
  /* The pattern gallery and reel are design aids, not a launch video: rendered only when asked for by name */
  const ids = rest.length ? rest : compositions.map((c) => c.id).filter((id) => !id.startsWith("Pattern"));
  mkdirSync(path.join(root, "out"), { recursive: true });
  for (const id of ids) {
    const composition = compositions.find((c) => c.id === id);
    if (!composition) throw new Error(`No composition ${id}`);
    const outputLocation = path.join(root, `out/${id}.mp4`);
    let last = -1;
    await renderMedia({
      composition,
      serveUrl,
      chromiumOptions,
      onBrowserLog,
      codec: "h264",
      crf: 16,
      pixelFormat: "yuv420p",
      imageFormat: "jpeg",
      jpegQuality: 95,
      outputLocation,
      onProgress: ({ progress }) => {
        const pct = Math.floor(progress * 10) * 10;
        if (pct !== last) {
          last = pct;
          console.log(`${id} ${pct}%`);
        }
      },
    });
    console.log(outputLocation);
  }
}

reportFit();
