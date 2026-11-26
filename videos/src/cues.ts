/*
 * The cue sheet: the bar grid every video is cut to. Both the video (src/) and the score generator
 * (scripts/score.mjs, run with Node's type stripping) read it, so the music hits the same downbeats the scenes
 * land on. Plain TypeScript with no imports, so Node can load it directly.
 *
 * 120 BPM at 60 fps: a beat is 30 frames, a bar is 120. Each scene lasts whole bars; the transition into a scene
 * takes the beat before its downbeat, so every new scene lands exactly on a "one".
 */

export const FPS = 60;
export const BPM = 120;
export const BEAT = (60 / BPM) * FPS;
export const BAR = BEAT * 4;
/* The transition into a scene: one beat, ending on the downbeat */
export const TRANSITION = BEAT;

/* How much of the band plays under a scene */
export type Energy = "hook" | "intro" | "low" | "mid" | "high" | "outro";

/* crossZoom is gone on purpose: it looked bad (Core and React intro → optimistic). Never add it back. */
export type TransitionName = "blurSlideLeft" | "blurSlideUp" | "zoomBlur" | "linearBlur" | "dreamyZoom" | "pushCut" | "fade";

export type SceneCue = {
  id: string;
  bars: number;
  energy: Energy;
  /* How this scene enters. The first scene has none */
  enter?: TransitionName;
};

export type VideoCue = {
  id: string;
  /* Semitones from A minor, so the eight videos do not all sit in one key */
  key: number;
  /* Which arpeggio and drum variations the score uses, 0 to 3 */
  flavor: number;
  scenes: SceneCue[];
};

/* A scene's length in frames. The transition beat is added to every scene after the first */
export const sceneFrames = (cue: VideoCue, index: number) => cue.scenes[index].bars * BAR + (index === 0 ? 0 : TRANSITION);

/* The frame each scene's content lands on (its downbeat) */
export const downbeats = (cue: VideoCue) => {
  const out: number[] = [];
  let at = 0;
  for (const scene of cue.scenes) {
    out.push(at);
    at += scene.bars * BAR;
  }
  return out;
};

/* The whole video, with one extra bar at the end for the final chord to ring out */
export const totalFrames = (cue: VideoCue) => cue.scenes.reduce((sum, s) => sum + s.bars * BAR, 0) + BAR;

export const cues: Record<string, VideoCue> = {
  HyperFetch10: {
    id: "HyperFetch10",
    key: 3,
    flavor: 1,
    scenes: [
      { id: "hook", bars: 2, energy: "hook" },
      { id: "intro", bars: 2, energy: "mid", enter: "zoomBlur" },
      { id: "highlights", bars: 4, energy: "mid", enter: "blurSlideUp" },
      { id: "slam-client", bars: 1, energy: "high", enter: "pushCut" },
      { id: "db", bars: 3, energy: "high", enter: "zoomBlur" },
      { id: "backends", bars: 3, energy: "high", enter: "blurSlideLeft" },
      { id: "optimistic", bars: 3, energy: "high", enter: "blurSlideUp" },
      { id: "sockets", bars: 3, energy: "high", enter: "linearBlur" },
      { id: "typed", bars: 3, energy: "high", enter: "linearBlur" },
      { id: "slam-last", bars: 1, energy: "high", enter: "pushCut" },
      { id: "hardened", bars: 3, energy: "mid", enter: "zoomBlur" },
      { id: "outro", bars: 3, energy: "outro", enter: "dreamyZoom" },
    ],
  },
  CoreAndReact: {
    id: "CoreAndReact",
    key: -2,
    flavor: 2,
    scenes: [
      { id: "hook", bars: 2, energy: "hook" },
      { id: "intro", bars: 2, energy: "mid", enter: "zoomBlur" },
      { id: "optimistic", bars: 4, energy: "mid", enter: "blurSlideLeft" },
      { id: "slam-instant", bars: 1, energy: "high", enter: "pushCut" },
      { id: "infinite", bars: 3, energy: "high", enter: "zoomBlur" },
      { id: "hydrate", bars: 3, energy: "high", enter: "zoomBlur" },
      { id: "retry", bars: 3, energy: "high", enter: "blurSlideLeft" },
      { id: "slam-never", bars: 1, energy: "high", enter: "pushCut" },
      { id: "offline", bars: 3, energy: "high", enter: "zoomBlur" },
      { id: "more", bars: 3, energy: "mid", enter: "linearBlur" },
      { id: "outro", bars: 3, energy: "outro", enter: "dreamyZoom" },
    ],
  },
  TypedBackends: {
    id: "TypedBackends",
    key: 5,
    flavor: 3,
    scenes: [
      { id: "hook", bars: 2, energy: "hook" },
      { id: "intro", bars: 2, energy: "mid", enter: "zoomBlur" },
      { id: "four", bars: 3, energy: "mid", enter: "zoomBlur" },
      { id: "slam-codegen", bars: 1, energy: "high", enter: "pushCut" },
      { id: "trpc", bars: 4, energy: "high", enter: "zoomBlur" },
      { id: "elysia", bars: 3, energy: "high", enter: "blurSlideLeft" },
      { id: "subscriptions", bars: 3, energy: "high", enter: "linearBlur" },
      { id: "slam-any", bars: 1, energy: "high", enter: "pushCut" },
      { id: "same-request", bars: 3, energy: "high", enter: "zoomBlur" },
      { id: "outro", bars: 3, energy: "outro", enter: "dreamyZoom" },
    ],
  },
  Sockets: {
    id: "Sockets",
    key: -4,
    flavor: 0,
    scenes: [
      { id: "hook", bars: 2, energy: "hook" },
      { id: "intro", bars: 2, energy: "mid", enter: "zoomBlur" },
      { id: "delivery", bars: 4, energy: "high", enter: "zoomBlur" },
      { id: "slam-smooth", bars: 1, energy: "high", enter: "pushCut" },
      { id: "payloads", bars: 3, energy: "high", enter: "zoomBlur" },
      { id: "lifecycle", bars: 3, energy: "mid", enter: "blurSlideUp" },
      { id: "reconnect", bars: 4, energy: "high", enter: "pushCut" },
      { id: "slam-everywhere", bars: 1, energy: "high", enter: "pushCut" },
      { id: "runtimes", bars: 3, energy: "high", enter: "zoomBlur" },
      { id: "outro", bars: 3, energy: "outro", enter: "dreamyZoom" },
    ],
  },
  GraphQL: {
    id: "GraphQL",
    key: 1,
    flavor: 2,
    scenes: [
      { id: "hook", bars: 2, energy: "hook" },
      { id: "intro", bars: 2, energy: "mid", enter: "zoomBlur" },
      { id: "typed-documents", bars: 4, energy: "mid", enter: "linearBlur" },
      { id: "slam-generics", bars: 1, energy: "high", enter: "pushCut" },
      { id: "persisted", bars: 3, energy: "high", enter: "zoomBlur" },
      { id: "error-policy", bars: 3, energy: "high", enter: "blurSlideLeft" },
      { id: "refetch", bars: 3, energy: "high", enter: "linearBlur" },
      { id: "slam-live", bars: 1, energy: "high", enter: "pushCut" },
      { id: "subscriptions", bars: 3, energy: "high", enter: "zoomBlur" },
      { id: "outro", bars: 3, energy: "outro", enter: "dreamyZoom" },
    ],
  },
  Firebase: {
    id: "Firebase",
    key: 4,
    flavor: 3,
    scenes: [
      { id: "hook", bars: 2, energy: "hook" },
      { id: "intro", bars: 2, energy: "mid", enter: "zoomBlur" },
      { id: "typo", bars: 4, energy: "mid", enter: "blurSlideLeft" },
      { id: "slam-caught", bars: 1, energy: "high", enter: "pushCut" },
      { id: "array", bars: 3, energy: "high", enter: "zoomBlur" },
      { id: "listeners", bars: 3, energy: "high", enter: "zoomBlur" },
      { id: "slam-solid", bars: 1, energy: "high", enter: "pushCut" },
      { id: "reliable", bars: 3, energy: "high", enter: "zoomBlur" },
      { id: "outro", bars: 3, energy: "outro", enter: "dreamyZoom" },
    ],
  },
  Tooling: {
    id: "Tooling",
    key: -1,
    flavor: 1,
    scenes: [
      { id: "hook", bars: 2, energy: "hook" },
      { id: "intro", bars: 2, energy: "mid", enter: "zoomBlur" },
      { id: "inspector", bars: 4, energy: "mid", enter: "zoomBlur" },
      { id: "slam-see", bars: 1, energy: "high", enter: "pushCut" },
      { id: "server", bars: 3, energy: "high", enter: "zoomBlur" },
      { id: "oxlint", bars: 3, energy: "high", enter: "zoomBlur" },
      { id: "examples", bars: 3, energy: "high", enter: "blurSlideLeft" },
      { id: "slam-ship", bars: 1, energy: "high", enter: "pushCut" },
      { id: "skills", bars: 3, energy: "high", enter: "zoomBlur" },
      { id: "outro", bars: 3, energy: "outro", enter: "dreamyZoom" },
    ],
  },
  HyperFetchDB: {
    id: "HyperFetchDB",
    key: 0,
    flavor: 0,
    scenes: [
      { id: "hook", bars: 2, energy: "hook" },
      { id: "intro", bars: 2, energy: "mid", enter: "zoomBlur" },
      { id: "many-copies", bars: 3, energy: "low", enter: "blurSlideUp" },
      { id: "slam-once", bars: 1, energy: "high", enter: "pushCut" },
      { id: "once", bars: 3, energy: "high", enter: "zoomBlur" },
      { id: "collection", bars: 3, energy: "high", enter: "blurSlideLeft" },
      { id: "query", bars: 3, energy: "high", enter: "blurSlideUp" },
      { id: "slam-live", bars: 1, energy: "high", enter: "pushCut" },
      { id: "live", bars: 4, energy: "high", enter: "zoomBlur" },
      { id: "late", bars: 3, energy: "mid", enter: "linearBlur" },
      { id: "slam-instant", bars: 1, energy: "high", enter: "pushCut" },
      { id: "optimistic", bars: 3, energy: "high", enter: "zoomBlur" },
      { id: "outbox", bars: 4, energy: "high", enter: "linearBlur" },
      { id: "slam-zero", bars: 1, energy: "high", enter: "pushCut" },
      { id: "sources", bars: 3, energy: "high", enter: "zoomBlur" },
      { id: "tested", bars: 3, energy: "high", enter: "blurSlideLeft" },
      { id: "outro", bars: 3, energy: "outro", enter: "dreamyZoom" },
    ],
  },
};
