import { measureText } from "@remotion/layout-utils";
import { createContext, useContext, useEffect, useState } from "react";
import { continueRender, delayRender } from "remotion";

import { display, fontsReady } from "./tokens";

/*
 * Title fitting. A title gets the width it may use (from Split's copy column or Stack's content width), then is set
 * on as few lines as possible, at most two (three only when two would need a tiny font), with the words split where
 * the lines come out most even. The font only ever shrinks from the size the scene asked for. No title is ever left
 * with one word per line.
 */

export const TitleWidth = createContext<number>(1640);
export const useTitleWidth = () => useContext(TitleWidth);

let loaded = false;
fontsReady.then(() => {
  loaded = true;
});

/* True once the fonts are in, holding the frame until then so the measurement uses the real metrics */
export const useFontsLoaded = () => {
  const [ready, setReady] = useState(loaded);
  useEffect(() => {
    if (ready) return undefined;
    const handle = delayRender("Waiting for fonts to measure a title");
    fontsReady.then(() => {
      setReady(true);
      continueRender(handle);
    });
    return undefined;
  }, [ready]);
  return ready;
};

const widthAt100 = (text: string) =>
  measureText({ text, fontFamily: display, fontSize: 100, fontWeight: 800, letterSpacing: "-0.045em" }).width;

/* Every way to split `words` into `n` consecutive lines */
const splits = (words: string[], n: number): string[][][] => {
  if (n === 1) return [[words]];
  const out: string[][][] = [];
  for (let i = 1; i <= words.length - n + 1; i += 1) {
    for (const rest of splits(words.slice(i), n - 1)) out.push([words.slice(0, i), ...rest]);
  }
  return out;
};

const cache = new Map<string, { lines: string[][]; size: number }>();

export const fitTitle = (text: string, size: number, available: number): { lines: string[][]; size: number } => {
  const key = `${text}|${size}|${available}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const words = text.split(" ");
  const budget = available * 0.97;
  /* One word per line reads badly: three lines only for titles of six words or more */
  const maxLines = Math.min(words.length, words.length >= 6 ? 3 : 2);
  const results: { lines: string[][]; size: number }[] = [];
  for (let n = 1; n <= maxLines; n += 1) {
    let bestSplit: string[][] = [words];
    let bestWidth = Infinity;
    for (const lines of splits(words, n)) {
      const widest = Math.max(...lines.map((l) => widthAt100(l.join(" "))));
      if (widest < bestWidth) {
        bestWidth = widest;
        bestSplit = lines;
      }
    }
    results.push({ lines: bestSplit, size: Math.min(size, (budget / bestWidth) * 100) });
  }
  /* The fewest lines that keep at least 85% of the asked size; otherwise two lines unless they'd be tiny */
  let best = results.find((r) => r.size >= size * 0.85);
  if (!best) best = results[2] && results[1].size < size * 0.7 ? results[2] : (results[1] ?? results[0]);
  const result = best ?? { lines: [words], size };
  cache.set(key, result);
  return result;
};
