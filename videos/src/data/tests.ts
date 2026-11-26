/*
 * Measured numbers for the charts. Never edit by hand without re-measuring.
 *
 * Test cases: it()/test() calls (including .each/.only/.skip/.concurrent/.todo/.fails) in packages/*, excluding
 * packages/hyper-flow (the devtools app) and packages/testing (internal), counted at each git tag with:
 *   git grep -hEc '^[[:space:]]*(it|test)(\.each\(.*\))?(\.(only|skip|concurrent|todo|fails))?[[:space:]]*\(' <tag> -- packages \
 *     ':(exclude)packages/hyper-flow' ':(exclude)packages/testing' | awk '{s+=$1} END {print s}'
 * "now" is origin/main on 2026-11-25 (v10.5.1).
 *
 * Coverage: line coverage from `pnpm exec vitest run --coverage` per package on 2026-11-25, all tests passing.
 */

export const TEST_GROWTH = [
  { label: "v9.0", value: 1627 },
  { label: "v9.3", value: 1867 },
  { label: "v9.5", value: 2012 },
  { label: "v9.6", value: 2339 },
  { label: "v9.7", value: 4585 },
  { label: "v9.8", value: 4996 },
  { label: "v9.9", value: 5208 },
  { label: "v10.0", value: 5851 },
  { label: "now", value: 6754 },
];

export const TESTS_PER_PACKAGE = {
  core: { was: 746, now: 2025 },
  react: { was: 414, now: 1808 },
  sockets: { was: 280, now: 872 },
  graphql: { was: 56, now: 324 },
  trpc: { was: 0, now: 451 },
  orpc: { was: 0, now: 401 },
  hono: { was: 0, now: 162 },
  elysia: { was: 0, now: 127 },
};

export const LINE_COVERAGE = { core: 99.51, react: 99.28, db: 100, sockets: 97.87 };
