---
name: ship-change
description:
  Land a finished hyper-fetch change on main - verify it, choose the commit type by release impact, open the PR and
  merge when CI is green. Use when the user says "ship it", "open a PR", "merge this", "land this", "release this" or
  asks to merge without publishing a new version.
metadata:
  internal: true
---

# Ship a change

Only merge when the user asked for the change to land. Opening a PR does not imply permission to merge.

## 1. Isolate the change

Work on a branch from an up-to-date `origin/main`. If the current checkout has unrelated work, use a separate worktree
and stage files by name, never with `git add .`:

```bash
git fetch origin main
```

```bash
git worktree add -b <type>/<topic> .claude/worktrees/<topic> origin/main
```

## 2. Verify

Run the verification commands from `AGENTS.md`. Changes limited to Markdown, MDX or agent rules can skip them. Report
any check that was not run.

## 3. Decide the release impact

Pick the commit type from the table in `.cursor/rules/commit-conventions.mdc`.

| Goal            | Commit types                                       |
| --------------- | -------------------------------------------------- |
| Publish a patch | `fix`, `perf`                                      |
| Publish a minor | `feat`                                             |
| Publish nothing | `docs`, `test`, `refactor`, `style`, `chore`, `ci` |

When nothing should be published, confirm that `main` has no unreleased commits, because the next push would release
them:

```bash
git log --no-merges --format='%h %s' "$(git describe --tags --abbrev=0 origin/main)..origin/main"
```

If this prints any `feat`, `fix`, `perf` or `revert` commit, or a breaking change, tell the user before merging.

## 4. Commit and open the PR

Follow the commit format. The PR title uses the same format, because it becomes part of the merge commit.

```bash
gh pr create --base main --title "<type>(<scope>): <gitmoji> <subject>" --body-file <file>
```

## 5. Merge when CI is green

Wait for every check on the PR. If a check fails, fix the cause. Never merge over a red check.

`main` requires a code-owner review that a sole maintainer cannot give, so the maintainer merges with admin rights and a
merge commit:

```bash
gh pr merge <number> --merge --admin
```

## 6. Confirm the outcome

Check the `Release` job on `main`, and confirm whether a new tag appeared. Report what landed and whether a version was
published.
