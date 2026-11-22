/* oxlint-disable unicorn/prefer-math-trunc -- `>>> 0` keeps the state an unsigned 32-bit integer, which trunc does not */
/** A small deterministic PRNG (mulberry32), so every seed of a model test replays the same steps */
export const createRandom = (seed: number) => {
  let state = seed >>> 0;
  const next = () => {
    // 0x6D2B79F5, written in decimal so the formatter and the linter agree
    state = (state + 1_831_565_813) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));
  const pick = <T>(items: readonly T[]): T => items[int(0, items.length - 1)];
  const chance = (probability: number) => next() < probability;
  return { int, pick, chance };
};

export type Random = ReturnType<typeof createRandom>;
