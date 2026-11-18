---
name: fix-bug
description:
  Reproduce, root-cause and fix a bug in the hyper-fetch monorepo with a failing regression test first. Use whenever a
  user reports a bug, a GitHub issue describes wrong behavior, a behavior regressed, or says "broken", "doesn't work",
  "wrong result", "regression" or "fix this issue". For intermittent test failures use fix-flaky-tests instead.
---

# Fix a bug

A fix without a failing reproduction is a guess. Work through these steps in order.

## 1. Understand the report

Write down the expected behavior, the actual behavior, the affected package and the version. If the report is an issue,
read it with its comments:

```bash
gh issue view <number> --comments
```

Search for duplicates so the fix can close all of them.

## 2. Build a failing test

Add the spec where the behavior belongs, following `.cursor/rules/debugging.mdc` and `.cursor/rules/testing.mdc`. Run it
from the package directory and **watch it fail for the reason in the report**:

```bash
pnpm exec vitest run __tests__/features/<area>/<area>.<topic>.spec.ts
```

A test that fails for another reason proves nothing. If you cannot reproduce the bug, stop and report what you tried and
what you need.

## 3. Find the root cause

Trace from the failing assertion back to the first wrong value. Test one hypothesis at a time. Explain the cause in one
sentence before changing code. If you cannot, you have not found it.

## 4. Fix the cause

- Make the smallest change that removes the cause.
- Check sibling adapters, hooks and modules for the same pattern.
- Do not weaken the test to match the code.

## 5. Verify

1. The new spec passes.
2. Temporarily undo the fix and confirm the spec fails again, then restore the fix.
3. For async behavior, repeat the spec with `.claude/skills/fix-flaky-tests/scripts/repeat-test.sh`.
4. Run the verification commands from `AGENTS.md`, which include dependent packages.

## 6. Commit

Put the fix and its regression test in one commit, and close every related issue:

```
fix(<scope>): 🐛 <what now works>

<why it was broken>

Closes #NNN
```

Use `fix` only when published behavior changes, because it publishes a release. See
`.cursor/rules/commit-conventions.mdc`.
