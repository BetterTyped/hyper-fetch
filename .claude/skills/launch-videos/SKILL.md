---
name: launch-videos
description:
  Plan, build, review and render HyperFetch launch videos (one per release blog post) in the Remotion project in
  videos/, to the house format - a hook cold open, the brand on the drop, one idea per scene with titles instead of
  text, real code, logos for every integration, beat-synced original music and a centered closing lockup. Use whenever
  a launch video, promo video, release video, teaser, social video or "video for the blog post" is requested,
  planned, changed, reviewed or rendered, or when the user says a video looks cheap, has too much text or needs to look
  better.
metadata:
  internal: true
---

# Launch videos

Each release topic gets its own video, cut from its own blog post in `documentation/blog/releases/<version>/`, built in
`videos/` (Remotion, React, its own lockfile) and rendered to `videos/out/<Composition>.mp4` at 1080p60. `videos/README.md`
has the commands and the architecture; this skill is the format and the bar.

The format is the best of two films. The HypeStack launch film (`hype-stack-www/marketing/launch-video`) has the story
craft: one-word beats, one idea per shot, cameras that land on beats, a minimal end. Its visual design is weaker. The
HyperFetch 10 videos have the look: the landing page's tokens, real product UI and code, shader transitions and light.
Keep both.

Before building, load the `remotion-best-practices` skill (installed per user in `~/.claude/skills`, never in the
repo: `pnpm test:skills` rejects skills without `metadata.internal`). Read `remotion-markup` (transitions,
motion-blur, light-leaks, sfx, audio) when changing those areas.

## Story

Every video has the same spine, set in `videos/src/cues.ts` as whole bars at 120 BPM:

| Scene    | Bars | What happens                                                                                               |
| -------- | ---- | ---------------------------------------------------------------------------------------------------------- |
| hook     | 2    | Darker chapter. Four words slam in, one per beat, then one line states the problem (`scenes/Hook.tsx`).    |
| intro    | 2    | The brand on the drop: bolt tile with a shockwave, release pill, the post's title, its logos.             |
| features | 3-4  | 4 to 7 scenes, one idea each, in the post's order of importance.                                           |
| outro    | 3    | Centered lockup, tagline, install command in a gold pill, the post's address, the big wordmark rising.    |

Length: 40 to 70 seconds. Every scene lands on a downbeat, and every hit inside a scene sits on `beat(n)`.

Between chapters, one-bar slams keep the hype up: two to four words in, the gold word on the third beat, each on a
hit ("Store it / **once.**", "Every view. / **Live.**"). Every video has at least two in the middle, not only the
cold open at the start. The hook and the slams are a dimmer chapter of the same film: the live background stays
visible, darker at the edges and warm behind the words (`scenes/Slam.tsx`). Never a flat black screen; it reads as
detached.

No word repeats inside a hook or a slam: four different words, or it reads as a typo. Write the hook as the reader's pain in four words, then the line the video answers (DB: "Fetch. Cache. Copy. Stale." /
"Every response keeps its own copy."). The last word slams in gold.

**Every word on screen must make sense to someone seeing it cold.** Viewers know nothing about the scene that comes
later, the code, the story you have in mind or the joke behind a word. Never put a bare reference on screen that
needs that context: a deliberate typo, a code identifier, a field name, an internal package or feature name, an
error code, an abbreviation. If the point needs the context, show the context (the code line with its squiggle and
message), or name the thing in plain words.

The example that failed: the Firebase video opened on the word **"yaer."**, a deliberate misspelling of the field
`year` that the video only explains a minute later. Cold, it read as our own typo, the worst possible first frame of a
launch video. The fix said what it is: "One typo. / No error. / No data. / Silence." The misspelled `"yaer"` stays
only inside the code scene, under a red squiggle that explains it.

Test before rendering: read every hook word, slam, title and pill alone, as a stranger scrolling X. If a word only
makes sense once you know the video, rewrite it. Clever never beats clear.

## The scene bar

The reference scene is Core & React's "No second fetch". Its parts:

1. One or two real `CodeWindow`s showing only the line that matters, with file names and a mark.
2. A lit `Beam` from the code into the product.
3. A believable product surface (`AppWindow` in `src/visuals/app.tsx`, a browser or app window) filled with concrete
   rows: names, endpoints, statuses, timings, sizes.
4. One payoff status, small, in the window footer ("0 requests", "201 Created", "replayed").
5. Two or three large elements filling the frame on a clean grid.

Every video also needs a few data visuals, the kind that made Sockets' "Hundreds of updates. One render." the best
scene: a live stream of messages against a render count, a curve drawing itself, rings filling, a before-and-after.
`src/visuals/charts.tsx` ports the strongest of react-wrapped's chart vocabulary (`react-wrapped/packages/charts`: spark,
bars, rings, dumbbell; also worth porting: gauge, meter, pixels, ticks, radar, river, funnel) into the house look:
`Spark`, `Rings`, `Dumbbell`, `Bars`, `ChartCard`, and the `ChartScene` shell. Charts show measured numbers only, kept
in `src/data/` with the method in a comment.

**What the visuals are for.** Visualize the library's mechanics in striking ways: what actually happens inside when
a request is deduplicated, a socket reconnects, a write goes optimistic, a cache entry goes stale, a response races an
event. Build them as real-world situations the viewer recognizes (a team feed, a checkout, a trading screen, a chat,
a dashboard under load) and animate the problem users have first, then HyperFetch solving it: the flood of renders
and then one render, the copies drifting apart and then one record, the lost write and then the replay. The best
scene in the series ("Hundreds of updates. One render.") does exactly this. Plan each video as a few of these
problem → mechanism → result visuals, with real code beside them, rather than lists of features.

Charts are about what the user gets: renders saved, requests avoided, payload size, speed, latency, what updates live.
Our own test suite is not what users care about: at most one or two test or coverage slides across the whole series
(HyperFetch 10 has the "5,000+ new tests since v9" curve in the overview and DB's seeded races, framed as the user
benefit "Never a value the server lacks."). Never a test chart per video.

Abstract stand-ins read as cheap: icon-only feature cards, decorative toggles, dot lanes, chip clouds, logo tiles
floating alone, tiny floating chips. If a scene has one, show the product doing the thing instead.

## Text budget

The user's rule: mostly titles. Count the words on every slide.

- **Per scene:** an eyebrow of at most 3 words, one title of at most 6 words, then the visual. No paragraphs. A sub-line
  of at most 7 words only when the visual can't be read without it.
- **Cards:** icon or logo plus a 1 to 3 word title. No description lines.
- **Labels and chips:** at most 3 words, and only as part of the visual (a status, a key, a value). No sentence chips,
  no rows of takeaways.
- **Code:** the one line that carries the idea, at most 6 lines, cut setup and imports. Code must still be real: copy it
  from the post or `packages/*/src`, shorten by dropping lines, never by inventing syntax.
- Let the animation explain. If a scene needs a paragraph, the visual is wrong.

## Fit

Cut text is the most visible defect a video can have. These rules are built into the toolkit; don't work around them.

- **Code never leaves its window.** `CodeWindow` fits the longest line: the font shrinks just enough to keep the line
  and a right margin inside the panel. If the fit audit says a code font went below 18px, the snippet is too long for
  its window: shorten the code or widen the window, never accept the small font.
- **No highlight on a single line.** A mark only means something when it singles out part of the code, so
  `CodeWindow` ignores marks on a one-line window and marks that cover every line. Don't add them.
- **Titles sit on balanced lines.** `Title` takes the width of its layout (`Split`'s copy column, `Stack`'s content
  width), measures its words and sets them on as few lines as possible: one, else two split where the lines come out
  most even, three only for titles of six words or more. The font only shrinks. A side title must never stack one
  word per line; if it would, the copy column is too narrow or the title too long.
- **No letter is ever sliced.** Two failures shipped in every video and the user found them one by one on X:
  - *Last letter cut on the right* ("See", "knows", "Hundreds", "starts"): gradient text paints only inside its
    box (`background-clip: text`), and the titles' negative letter-spacing ends the box before the last glyph's
    right edge. Any box that clips (`overflow: hidden`) does the same. Every gradient text goes through `clipText`,
    which pads the sides and cancels it with negative margins; every clip box around text gets the same side room.
    Never set gradient text or a clip box around text without it.
  - *Tops of letters showing before a title rises* ("HyperFetch 10", "GraphQL in HyperFetch 10"): a word that rises
    out of a clip box must start completely below it. The box is taller than the word (room for descenders) and
    the entry tilt lifts one corner, so `Title` starts each word its full height plus 0.7em down. Any new
    rise-from-clip animation needs the same margin.
  The fit audit checks both on every frame: a pending title word inside its clip box, and a title clip box with no
  side room. Look at the first frames of every scene, not only settled ones: this bug lives in the frames before the
  motion starts.
- **Nothing overlaps.** Cards, code windows and chips never sit on top of each other unless one contains the other.
  Chips and strips that belong to a card go inside it or in clear space beside it.
- **Safe area.** Every card, window and chip keeps 100px from the left and right edges and 60px from the top and
  bottom, like a title-safe margin. Cards near a side look cramped long before they touch it; a layout that needs the
  last 100px is too wide, so shrink the visual or rearrange it. Check every scene's widest moment, including the end
  of the camera push.
- **The fit audit.** `FitAudit` checks every rendered frame for a code body wider than its window, a card whose content
  is clipped, a row label cut with an ellipsis, and a code font under 18px. The render script prints each problem as
  `[fit] <video> frame <n>: ...` and exits non-zero. In stills it also checks overlaps between solid elements
(`data-solid`: cards, code windows, chips) and the safe area (100px sides, 60px top and bottom); for that, the render script renders stills in audit
mode (`inputProps.audit`), where scenes play as plain sequences in the real frame, because shader transitions lay
scenes out in a zero-size capture box that hides real geometry. A still or render with fit problems is not done. Mark new text
  boxes with `data-fit` so the audit sees them, and keep decoration (glows, sheens) in a clipped `inset: 0` layer so
  it never counts as overflow.

## Claims and credibility

- Every API, option, number and snippet comes from the post or the source. Never invent APIs, defaults or type
  messages. For a type error, use the post's own comment as the message.
- Never advertise bug fixes or fix counts: "80+ fixes" reads as "it was broken". Show strength instead: tests,
  coverage, speed, adoption.
- Nothing negative or uncomfortable about HyperFetch on screen: no "Breaking" tags, deprecations, migrations, upgrade
  steps, known limitations or "fixed" wording. Breaking changes belong in the blog post. Red is only for a problem
  HyperFetch handles in front of the viewer: a type error caught, a failed request retried or reverted, a dropped
  connection that comes back, or the "problem" scene showing what other approaches suffer from.
- Measure every number before it goes on screen, and write the method in a comment next to it. Test cases, for
  example:

```bash
P='^[[:space:]]*(it|test)(\.each\(.*\))?(\.(only|skip|concurrent|todo|fails))?[[:space:]]*\('
git grep -hEc "$P" v9.0.0 -- packages ':(exclude)packages/hyper-flow' ':(exclude)packages/testing' | awk '{s+=$1} END {print s}'
```

  HyperFetch 10: 1,627 test cases at v9.0.0, 6,754 at release, so "5,000+ new tests". Coverage needs a real run per
  package after building (`pnpm exec nx run-many -t build -p core sockets react db`, then
  `pnpm exec vitest run --coverage --coverage.reporter=text-summary` in the package). At v10 release, lines: core
  99.51%, React 99.28%, DB 100%, sockets 97.87%. Never write a coverage figure without the report.
- Never mention, list or show `@hyper-fetch/testing`.
- Each video promotes its own topic. HyperFlow (the devtools app) appears only in the tooling video: no HyperFlow
  scenes, screenshots, logos or `DevtoolsPlugin` code in the DB, sockets or any other video, the overview included.

## Logos

Every integration, package, framework, runtime or tool named on screen gets its logo: `LogoChip` (logo plus name),
`LogoStrip` (chips dealt in on eighth notes), `Logo` / `LogoRow` (tiles). `<Intro logos>` shows what the video covers,
`<Outro logos>` what to install. Logos live in `videos/public/logos`; add one by copying
`documentation/static/img/integration-<name>.svg`, preferring the `-dark` variant (it is the one made for dark
backgrounds).

## Look

- The landing page's tokens only (`src/brand/tokens.ts`): the `#1c1c1d` page, zinc text, the BetterTyped gold
  (`#ffe08a` to `#f5a623`), yellow-to-orange eyebrows, Figtree titles with the fading zinc gradient, Inter, JetBrains
  Mono with ligatures off.
- The background (page, gold glow, grain, particles) is shared and settled; only the pattern changes per video, so
  the series has variety. Current mapping, picked by the user: HyperFetch 10, DB and Firebase the flickering squares;
  Core and React crosses; Typed backends stripes; Sockets hexagons; GraphQL dots; Tooling the grid with lit cells
  (`interactive`). Change it only when the user picks. Rejected and deleted, never bring back: the hero paths, the
  retro grid and the plain line grid ("weak").
- Motion that was approved: squares, dots and crosses are lit by one drifting noise field (`wave` in
  `Background.tsx`: smooth 3D value noise, 260px cells, drifting about 70px/s, reshaping about every 2 s). Each cell
  keeps a faint fixed grain (`texture`) and the wave crests light it, so soft bright regions roll across the grid.
  Hexagons glide per cell and the brightest briefly tint faint gold. Stripes drift slowly.
- Motion that failed, each one a real round of feedback: cells re-rolled at random 10 times a second (flicker, too
  fast); one synced breath for the whole surface (dead, lost the per-cell life); per-cell glides with random phases
  (reads as nothing on video: a 6px square changing a few grey levels is invisible); waves at 14px/s ("super slow").
  The motion has to be visible at a glance on a phone, while the glow stays subtle.
- Subtle, not invisible: layer strength 0.45, each pattern's own alpha set so it still reads at 1:1. Before changing
  a pattern, its strength or its motion, render `PatternReel` (`npx remotion render src/index.ts PatternReel
  out/reel.mp4`: every pattern full frame at real size, 5 s each) and send it to the user. Never judge motion in the
  tiled `PatternGallery`: at tile size a square is under a pixel and the motion vanishes. Prove motion with a frame
  difference (`ffmpeg ... blend=all_mode=difference`), not by eye on a thumbnail.
- No left-border accents, no stacked noise, no glow blobs as decoration. Grain stays at the site's whisper.
- The closing is never a footer or a panel of links: the centered lockup over the big fading wordmark, cut by the
  bottom edge.

## Motion

- **Titles** rise word by word out of clip masks on a long quint settle. Hook words slam (scale 2.1 to 1, blur to 0,
  outExpo) and only grow slightly after landing.
- **Cards** are dealt in: up from below, slightly turned, settling square (`deal()`), in a non-linear order. A light
  sheen sweeps each card once after it lands. Panels sit in a double bezel.
- **Focus** hops between cards with the gold ring, one card per beat (`Card ring`).
- **Connectors** are lit cables (`Beam`): S-curves that draw in, a port at each end, one glowing packet with a comet
  tail, softly lit after it passes. Never dashed or dotted lines. Ports sit exactly on card edges, and the cable leaves
  and enters along those edges: `orient="horizontal"` side to side, `orient="vertical"` bottom to top (auto follows the
  longer axis). A fan to several cards starts from separate points spread along the source edge, never from one
  point. Cables never cross each other or pass behind a card. Look at every scene with cables in a still: a cable that
  loops, curls back or tangles is a bug ("spaghetti").
- **A cable needs clear space and sits on top.** The tRPC scene shipped with two code windows touching (server.ts
  ended at y 640, api.ts began at 642), so its cable ran from a corner into the second window and vanished behind
  it. Leave at least 50px between two connected cards, connect the edges that face each other (bottom to top when
  the cards overlap horizontally, side to side when they overlap vertically), and render the cable's `svg` after
  every card it touches so no card paints over a port. The fit audit flags a cable end inside a card and a cable
  that runs under one.
- **Cuts** use a different shader transition per scene (zoom blur, blur slide, linear blur, push cut, dreamy zoom for
  the outro), motion blurred, with a subtle gold light leak. Never cross zoom: it looked terrible (Core and React,
  intro into "Describe the change.") and is removed from the toolkit; don't add it back.
- **The camera** creeps in on every scene.
- Nothing pulses, blinks or loops after it lands. Type changes at most once after landing. Nothing is cropped by the
  frame.

## Sound

`scripts/score.mjs` synthesizes each video's music from its cue sheet: no samples, no licences. Each video sets its own
`key` and `flavor`; each scene's `energy` (`hook`, `intro`, `low`, `mid`, `high`, `outro`) sets the band density.
Every cut gets a fill, a riser and a crash. Scenes place their own sound effects with `<Sfx>` / `<TypingSfx>` next to
the animation they belong to.

Targets for the final mix, checked on the rendered MP4:

```bash
ffmpeg -hide_banner -nostats -i out/<Composition>.mp4 -af ebur128=peak=true -vn -f null - 2>&1 | grep -E "^\s+(I|Peak):"
```

About -14 to -12 LUFS integrated, true peak at or below -1 dBFS. Check the band balance with a lowpass 120 Hz /
bandpass 1 kHz / highpass 4 kHz `volumedetect` and a `showspectrumpic` spectrogram; a warm mix sits near -17 / -23 /
-28 dB. You can't hear the music: say so, and ask the user to listen.

## Build and verify

1. Read the post. List the scenes and their single ideas; check each against the text budget.
2. Add the cue sheet to `src/cues.ts`, the video to `src/videos/<topic>.tsx` and `src/videos/index.ts`.
3. `npx tsc --noEmit`.
4. Render stills on the beats that matter (the render script prints any fit problems; fix every one): a scene starts one beat before its downbeat, so `beat(n)` inside scene `i`
   is frame `downbeat(i) + 30n`. `node scripts/render.mjs --still <Composition> <frames...>`, then tile them with
   ffmpeg (`hstack` / `vstack` at 960x540) and look at every scene: text count, overflow, legibility (body text at least
   21px, code at least 20px), nothing cropped.
5. Render: `node scripts/render.mjs <Composition>`. Tile the MP4 every 2.5s
   (`-vf "select='not(mod(n\,150))',scale=480:270,tile=5x5"`) to check the whole film, then check the mix.

Several videos can be built in parallel, two per agent, when the shared toolkit (`src/brand`, `src/scenes`,
`src/visuals`, `src/cues.ts`, `scripts`) is owned by one session and the agents only write their own video files.

## Hard-learned gotchas

- Remotion sends composition props through JSON, so JSX in `defaultProps` arrives as plain objects (React error #31).
  Pass an id and look the video up inside.
- Shader transitions capture each scene into a canvas, and translucent fills, glows and blurred shadows over a
  transparent scene lose their alpha there (solid yellow blobs, white chips). Every scene paints its own opaque
  backdrop, fed the video's frame so the pattern runs on across the cut.
- `motionBlur` on `TransitionSeries.Transition` needs Remotion 4.0.545 or later. Keep every `@remotion/*` package on
  the same version.
- Light leaks need WebGL: `Config.setChromiumOpenGlRenderer("angle")` for the CLI and `chromiumOptions: { gl: "angle" }`
  for the Node API (the config file is not read there).
- prism-react-renderer leaves plain identifiers unstyled, so the code container must set a text color or they render
  black on black.
- An SVG gradient with the default bounding-box units draws nothing on a horizontal or vertical line. Use
  `gradientUnits="userSpaceOnUse"`.
- A text-clipped gradient (the eyebrow) also clips its children's backgrounds. Put chips beside it, not in it.
- Adding Remotion to the pnpm workspace bumps shared transitive dependencies of the library packages. Keep `videos/`
  outside the workspace with `pnpm install --ignore-workspace`.
- Sound effects stack on the music and push the mix over 0 dBFS. The music bed sits at 0.66 volume for headroom.
- The render script regenerates all audio first. Don't run it twice at once while a full render is reading the files.
