---
name: fix-flaky-tests
description: Find, reproduce, root-cause and permanently fix flaky (intermittently failing) tests in the hyper-fetch monorepo. Use proactively whenever a test fails once and passes on re-run, when CI is red and then green without code changes, when a `waitFor` times out around 1000ms, when a test depends on sleeps or default mock delays, or when a user says "flaky", "intermittent", "timeout", "works locally", "fix flake". Also use after adding new async tests to prove they are deterministic before committing.
---

# Fix Flaky Tests

A flaky test is a test with a hidden dependency on time, order or shared state. Never "fix" it by re-running, retrying,
widening a timeout, or marking it skipped. Find the dependency and remove it.

## Workflow

1. **Reproduce, don't guess.** Run the single spec repeatedly and shuffled before reading any code:

   ```bash
   .claude/skills/fix-flaky-tests/scripts/repeat-test.sh packages/react __tests__/features/use-submit/use-submit.queue.spec.ts 10
   ```

   The script runs the file N times (default 10) with `pnpm exec vitest run` inside the package and prints the failure
   rate. Add `--shuffle` to also randomize test order (`--sequence.shuffle`). A 0/10 result after a fix is the minimum
   bar; prefer 20 runs for timing-related fixes.

2. **Confirm it is pre-existing or new.** If the failing test is unrelated to the current change, check it on `main`
   with `git stash push -u` → run → `git stash pop`. Pre-existing flakes still get fixed in the same branch (small,
   separate commit) - leaving them costs everyone time.

3. **Read the failure, not the test name.** The message tells you the class of flake:
   - `waitFor` / `testLoading` timing out around `1000ms` → the awaited state was already gone or never reached (race).
   - "Calling the test function inside another test function" → structural (misplaced braces), not timing.
   - `act` warnings / "state update on unmounted component" → missing cleanup or delivery after unsubscribe.
   - Different failures each run → shared mutable state between tests.
   - Fails only in the full suite, passes alone → order dependence or leaked globals / timers / servers.

4. **Classify the root cause** (see table) and apply the matching fix pattern. Fix the cause, keep the assertion.

5. **Verify**: repeat-run the spec (10-20x), run the package suite once, run `pnpm typecheck` in the package.

6. **Commit with the cause in the message**, e.g. `test(react): make useSubmit queue spec deterministic - mock resolved
   before second hook mounted`.

## Root causes and fixes in this repo

| Symptom | Root cause | Fix |
| --- | --- | --- |
| Second hook/instance expected to see an in-flight request but sees finished | `mockRequest(request)` default delay is **20ms** (`packages/testing/src/http/http.mock.ts`) - request finishes before the next render/mount | Pass an explicit `delay` (e.g. `{ delay: 500 }`) so the window is wide enough; never rely on the default |
| Assertion right after an async emit | Treating async delivery as sync | Wrap in `await waitFor(() => ...)`; for sockets use `waitForConnection(socket)` before emitting |
| Test uses `await sleep(n)` and asserts a count | Real-timer race | Use `vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] })` + `vi.advanceTimersByTime`, or `waitFor`. Keep `Date`/promises real so mock servers still connect |
| Fake timers break connection setup | mock-socket / msw use timers to connect | Connect with real timers first (`await waitForConnection`), then switch to fake timers inside the test or `beforeEach` |
| Passes alone, fails in suite | Leaked state: `client` cache/dispatchers, socket listeners, servers, spies | Reset in `beforeEach` (`client.clear()`, `vi.resetAllMocks()`), stop servers in `afterEach/afterAll`, `vi.useRealTimers()` in `afterEach` |
| Random test fails each run | Shared module-level fixture mutated by tests | Create fixtures inside `beforeEach`; use unique topics/keys (`getUniqueRequestId`) |
| Only fails on CI | Slower machine amplifies a race | Same fixes as above; never just raise `testTimeout` |
| Timer-based delivery (throttle/batch/debounce) asserts after unsubscribe | Pending timer fires after cleanup | Assert nothing is delivered after dispose; ensure the implementation clears timers on unsubscribe |

## Rules

- A flake found while working on something else is still fixed, in its own small commit. Do not leave `it.skip`.
- The fix must make the test deterministic, not merely rarer. If you cannot explain *why* it failed, you have not fixed it.
- Prefer controlling time (fake timers, explicit mock delays) over waiting longer.
- Prefer `waitFor` over `sleep`. Prefer asserting on events over asserting on elapsed time.
- When you touch a flaky spec, also scan its sibling specs for the same pattern (same helper, same default delay) and
  fix them in the same commit.
- After fixing, run the whole package suite once - some flakes hide others.

## Monorepo notes

- Tests are Vitest; packages expose `pnpm test` and `pnpm typecheck`. Run a single file with
  `pnpm exec vitest run <path>` from the package directory.
- `@hyper-fetch/testing` helpers: `createHttpMockingServer` (`mockRequest(request, { delay, data, status })`),
  `createWebsocketMockingServer` (`emitListenerEvent`), `createSseMockingServer`, `waitForConnection`, `sleep`.
- Dependents resolve sibling packages through `dist/` - if types look stale, `pnpm build` the dependency first.
