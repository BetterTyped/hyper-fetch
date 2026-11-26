import { Easing, interpolate, spring } from "remotion";

import { FPS } from "./tokens";

/* The landing's reveal curve: [0.21, 0.47, 0.32, 0.98], quick in, long soft settle */
export const easeOut = Easing.bezier(0.21, 0.47, 0.32, 0.98);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

export const sec = (seconds: number) => Math.round(seconds * FPS);

/* 0 → 1 between two frames, clamped and eased */
export const progress = (frame: number, from: number, duration: number, easing = easeOut) =>
  interpolate(frame, [from, from + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

/* The landing's fadeUp: 14px rise and fade in 0.4s */
export const rise = (frame: number, delay = 0, distance = 18, duration = sec(0.45)) => {
  const p = progress(frame, delay, duration);
  return {
    opacity: p,
    transform: `translateY(${(1 - p) * distance}px)`,
    filter: p < 1 ? `blur(${(1 - p) * 6}px)` : undefined,
  } as const;
};

export const pop = (frame: number, delay = 0, damping = 14) =>
  spring({ frame: frame - delay, fps: FPS, config: { damping, stiffness: 170, mass: 0.7 } });

/* Deterministic pseudo random numbers, so every render of a frame is the same */
export const seeded = (seed: number) => {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

export const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/*
 * Scene-local frame of a beat. Every scene after the intro starts one transition beat before its downbeat, so
 * beat(0) is the downbeat the scene lands on and beat(2.5) the "and" after its third beat.
 */
export const beat = (n: number) => 30 + Math.round(n * 30);

/* outQuint: the long, confident settle HypeStack's film uses for cards and words */
export const outQuint = Easing.bezier(0.22, 1, 0.36, 1);
export const outExpo = Easing.bezier(0.16, 1, 0.3, 1);

/*
 * A card dealt onto the table: it comes up from below, slightly turned, and settles square. `order` picks the
 * tilt, so neighbours lean different ways.
 */
export const deal = (frame: number, at: number, order = 0, distance = 220) => {
  const p = progress(frame, at, sec(0.85), outQuint);
  const tilt = [-6, 5, -4, 6, -5, 4][((order % 6) + 6) % 6];
  return {
    opacity: Math.min(1, p * 2.2),
    transform: `translateY(${(1 - p) * distance}px) rotate(${(1 - p) * tilt}deg) scale(${0.94 + 0.06 * p})`,
  } as const;
};
