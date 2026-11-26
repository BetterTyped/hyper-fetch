/*
 * Cuts single scenes out of the rendered videos for explainer posts, exactly on the cue sheet's beats: from half a
 * beat before the scene's downbeat to the end of its last bar, with a short audio fade at both ends.
 *
 *   node scripts/clips.mjs            every clip in CLIPS
 *   node scripts/clips.mjs db-late    one clip
 *
 * Needs the videos in out/ (pnpm render) and ffmpeg on the PATH.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { BAR, cues, downbeats, FPS } from "../src/cues.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const CLIPS = {
  "db-late": { video: "HyperFetchDB", scene: "late" },
  "sockets-delivery": { video: "Sockets", scene: "delivery" },
  "core-optimistic": { video: "CoreAndReact", scene: "optimistic" },
  "graphql-persisted": { video: "GraphQL", scene: "persisted" },
  "sockets-reconnect": { video: "Sockets", scene: "reconnect" },
  "core-hydrate": { video: "CoreAndReact", scene: "hydrate" },
};

const only = process.argv.slice(2);
mkdirSync(path.join(root, "launch/clips"), { recursive: true });

for (const [name, { video, scene }] of Object.entries(CLIPS)) {
  if (only.length && !only.includes(name)) continue;
  const cue = cues[video];
  const index = cue.scenes.findIndex((s) => s.id === scene);
  if (index < 0) throw new Error(`${video} has no scene ${scene}`);
  const start = Math.max(0, (downbeats(cue)[index] - BAR / 8) / FPS);
  const duration = (cue.scenes[index].bars * BAR + BAR / 8) / FPS;
  const output = path.join(root, `launch/clips/${name}.mp4`);
  execFileSync(
    "ffmpeg",
    [
      "-loglevel", "error", "-y",
      "-ss", start.toFixed(3), "-t", duration.toFixed(3),
      /* The mastered file when it exists (audio limited to -1.5 dBTP), the raw render otherwise */
      "-i", existsSync(path.join(root, `out/final/${video}.mp4`)) ? path.join(root, `out/final/${video}.mp4`) : path.join(root, `out/${video}.mp4`),
      "-af", `afade=t=in:d=0.25,afade=t=out:st=${(duration - 0.6).toFixed(3)}:d=0.6`,
      "-c:v", "libx264", "-crf", "17", "-preset", "slow", "-pix_fmt", "yuv420p",
      "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart",
      output,
    ],
    { stdio: "inherit" },
  );
  console.log(`${name}: ${duration.toFixed(1)}s → ${path.relative(root, output)}`);
}
