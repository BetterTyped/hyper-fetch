import type { CSSProperties } from "react";

import { loadFont as loadFigtree } from "@remotion/google-fonts/Figtree";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

/*
 * The landing page's look, as constants: the #1c1c1d page, the zinc text scale, the BetterTyped gold, the
 * yellow-to-orange eyebrow and the Figtree display type. Every scene reads its colours from here.
 */

const figtree = loadFigtree("normal", {
  weights: ["500", "600", "700", "800", "900"],
  subsets: ["latin"],
});
const inter = loadInter("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});
const jetbrains = loadMono("normal", {
  weights: ["400", "500", "700"],
  subsets: ["latin"],
});

export const display = figtree.fontFamily;
export const body = inter.fontFamily;
export const mono = jetbrains.fontFamily;
/* Resolves once every font is loaded, so text can be measured with the real metrics */
export const fontsReady = Promise.all([figtree.waitUntilDone(), inter.waitUntilDone(), jetbrains.waitUntilDone()]);

export { FPS } from "../cues";
export const WIDTH = 1920;
export const HEIGHT = 1080;

export const color = {
  page: "#1c1c1d",
  panelTop: "#222224",
  panelBottom: "#1b1b1d",
  card: "#18181b",
  code: "#0f0f10",
  line: "rgba(255, 255, 255, 0.07)",
  ring: "rgba(255, 255, 255, 0.1)",
  zinc50: "#fafafa",
  zinc100: "#f4f4f5",
  zinc200: "#e4e4e7",
  zinc300: "#d4d4d8",
  zinc400: "#a1a1aa",
  zinc500: "#71717a",
  zinc600: "#52525b",
  zinc700: "#3f3f46",
  zinc800: "#27272a",
  bolt: "#fbc646",
  goldLight: "#ffe08a",
  goldDark: "#f5a623",
  cta: "#f9b233",
  red: "#f43f5e",
  green: "#34d399",
  blue: "#60a5fa",
};

export const goldGradient = `linear-gradient(to bottom, ${color.goldLight}, ${color.goldDark})`;
/* The eyebrow: yellow-500 to orange-200, left to right */
export const eyebrowGradient = "linear-gradient(to right, #eab308, #fed7aa)";
/* The section title: zinc-200 that fades at the top and bottom of each word */
export const titleGradient =
  "linear-gradient(to bottom, rgba(228,228,231,0.6), #e4e4e7 50%, rgba(228,228,231,0.6))";
export const titleGradientMuted =
  "linear-gradient(to bottom, rgba(212,212,216,0.55), #d4d4d8 50%, rgba(212,212,216,0.55))";

/*
 * Gradient text. background-clip: text only paints inside the element's box, and the titles' tight negative
 * letter-spacing ends that box before the last glyph's right edge, which sliced the end off words ("See" lost half
 * its last "e"). The side padding gives the glyphs room to paint; the matching negative margin keeps layout unchanged.
 */
export const clipText = (background: string): CSSProperties => ({
  backgroundImage: background,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  paddingLeft: "0.08em",
  paddingRight: "0.12em",
  marginLeft: "-0.08em",
  marginRight: "-0.12em",
});

/* The VS Code dark colours the docs code blocks use */
export const syntax = {
  plain: "#d4d4d4",
  comment: "#6a9955",
  keyword: "#569cd6",
  control: "#c586c0",
  string: "#ce9178",
  number: "#b5cea8",
  fn: "#dcdcaa",
  type: "#4ec9b0",
  variable: "#9cdcfe",
  punctuation: "#d4d4d4",
};
