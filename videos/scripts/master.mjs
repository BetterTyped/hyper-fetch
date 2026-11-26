/*
 * Masters the audio of the rendered videos for upload: a true peak limiter at -2 dBFS (about -1.7 dBTP after AAC;
 * `level=false` matters: alimiter auto-levels back up to full scale by default, which undoes the limit),
 * video copied untouched. Reads out/<Video>.mp4, writes out/final/<Video>.mp4.
 *
 *   node scripts/master.mjs            every video in out/
 *   node scripts/master.mjs Sockets    one video
 *
 * Needs ffmpeg on the PATH.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { cues } from "../src/cues.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const only = process.argv.slice(2);
mkdirSync(path.join(root, "out/final"), { recursive: true });

for (const id of Object.keys(cues)) {
  if (only.length && !only.includes(id)) continue;
  const input = path.join(root, `out/${id}.mp4`);
  if (!existsSync(input)) {
    console.log(`${id}: no render in out/, skipped`);
    continue;
  }
  const output = path.join(root, `out/final/${id}.mp4`);
  execFileSync(
    "ffmpeg",
    ["-loglevel", "error", "-y", "-i", input, "-c:v", "copy", "-af", "alimiter=limit=0.79:level=false", "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", output],
    { stdio: "inherit" },
  );
  /* ebur128 prints its summary to stderr: integrated loudness and true peak */
  const { stderr } = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", output, "-af", "ebur128=peak=true", "-f", "null", "-"], { encoding: "utf8" });
  const summary = stderr.slice(stderr.lastIndexOf("Summary:"));
  const lufs = summary.match(/I:\s+(-?[\d.]+) LUFS/)?.[1];
  const peak = summary.match(/Peak:\s+(-?[\d.]+) dBFS/)?.[1];
  console.log(`${id}: ${path.relative(root, output)}  ${lufs} LUFS, ${peak} dBTP`);
}
