# HyperFetch launch videos

One launch video per HyperFetch 10 blog post, built with [Remotion](https://www.remotion.dev) in the look of the
landing page: the `#1c1c1d` page, the gold glow and particles, each post's cover pattern, Figtree titles, real code in
the blog's terminal window and a closing card modeled on the site footer.

This folder is not part of the pnpm workspace. It has its own lockfile, so the video tooling never changes what the
library packages resolve.

| Composition     | Blog post                                     | Length |
| --------------- | --------------------------------------------- | ------ |
| `HyperFetch10`  | `/blog/hyper-fetch-10-0`                      | 56s    |
| `HyperFetchDB`  | `/blog/hyper-fetch-db`                        | 66s    |
| `CoreAndReact`  | `/blog/hyper-fetch-10-core-react`             | 50s    |
| `TypedBackends` | `/blog/hyper-fetch-10-backends`               | 44s    |
| `Sockets`       | `/blog/hyper-fetch-10-sockets`                | 46s    |
| `GraphQL`       | `/blog/hyper-fetch-10-graphql`                | 44s    |
| `Firebase`      | `/blog/hyper-fetch-10-firebase`               | 38s    |
| `Tooling`       | `/blog/hyper-fetch-10-tooling`                | 44s    |

## Commands

```bash
pnpm install --ignore-workspace
```

```bash
node scripts/score.mjs && pnpm studio
```

```bash
pnpm render
```

```bash
pnpm render HyperFetchDB
```

```bash
pnpm still HyperFetchDB 300 900
```

`pnpm render` writes `out/<Composition>.mp4` (1080p, 60 fps, H.264, AAC) and regenerates the music first. Studio
needs the generated audio in `public/music` and `public/sfx`, so run `scripts/score.mjs` once before opening it.

`pnpm master` limits the audio peaks of every render into `out/final/` and prints loudness and true peak; upload
those files. `pnpm clips` cuts the explainer clips from them into `launch/clips/`.

## How it is built

- **`src/cues.ts`** is the cue sheet: every video's scenes, their length in bars, their energy and the transition
  each scene enters with. The edit runs at 120 BPM (a beat is 30 frames at 60 fps). Every scene lands on a downbeat,
  and `beat(n)` in `src/brand/motion.ts` places in-scene hits on the same grid.
- **`scripts/score.mjs`** synthesizes the soundtrack of each video from its cue sheet: a supersaw pad, a pluck
  arpeggio, a sidechained bass and drums whose density follows each scene's energy, with a fill, a riser and a crash
  on every cut. It also synthesizes the sound effects in `public/sfx`. Nothing is sampled, so there is nothing to
  license. Each video has its own key and groove (`key` and `flavor` in the cue sheet).
- **`src/brand/`** holds the look: tokens copied from the site, the backgrounds and patterns of the blog covers, the
  terminal-style `CodeWindow` (typing, line marks, type-error squiggles, hover types, autocomplete), the timeline with
  motion-blurred shader transitions and gold light leaks, and the footer-style outro in `src/scenes/Outro.tsx`.
- **`src/videos/<topic>.tsx`** is one video: its scenes, in the order and with the ids of its cue sheet.

Every claim, API and snippet in a video comes from its blog post in `documentation/blog/releases/10.0`. Update the
video when the post changes.

## Adding a video

1. Add the cue sheet to `src/cues.ts`.
2. Write `src/videos/<topic>.tsx` with one scene per cue, and add it to `src/videos/index.ts`.
3. Check frames with `pnpm still <Composition> <frames...>` and render with `pnpm render <Composition>`.

Remotion is free for individuals and companies of up to three people. Larger companies need a
[company license](https://www.remotion.pro/license).
