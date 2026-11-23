# HyperFetch

Type-safe data-exchange framework for HTTP, GraphQL, Firebase and realtime transports. This is a public library: every
exported type and behavior is a promise to its users.

Domain vocabulary lives in [CONTEXT.md](CONTEXT.md). Use those terms exactly, and add new concepts there in the same
change.

## Packages

pnpm workspaces and Nx. Packages resolve each other through `dist/`, so build a package before typechecking its
dependents.

| Directory                         | Published as                   | Nx project        |
| --------------------------------- | ------------------------------ | ----------------- |
| `packages/core`                   | `@hyper-fetch/core`            | `core`            |
| `packages/sockets`                | `@hyper-fetch/sockets`         | `sockets`         |
| `packages/react`                  | `@hyper-fetch/react`           | `react`           |
| `packages/adapter-axios`          | `@hyper-fetch/axios`           | `axios`           |
| `packages/adapter-graphql`        | `@hyper-fetch/graphql`         | `graphql`         |
| `packages/adapter-orpc`           | `@hyper-fetch/orpc`            | `orpc`            |
| `packages/adapter-firebase`       | `@hyper-fetch/firebase`        | `firebase`        |
| `packages/adapter-firebase-admin` | `@hyper-fetch/firebase-admin`  | `firebase-admin`  |
| `packages/hono`                   | `@hyper-fetch/hono`            | `hono`            |
| `packages/elysia`                 | `@hyper-fetch/elysia`          | `elysia`          |
| `packages/plugin-devtools`        | `@hyper-fetch/plugin-devtools` | `plugin-devtools` |
| `packages/plugin-eslint`          | `eslint-plugin-hyper-fetch`    | `plugin-eslint`   |
| `packages/plugin-oxlint`          | `oxlint-plugin-hyper-fetch`    | `plugin-oxlint`   |
| `packages/cli`                    | `@hyper-fetch/cli`             | `cli`             |
| `packages/testing`                | internal, never published      | `testing`         |
| `packages/hyper-flow`             | desktop app, not on npm        | `hyper-flow`      |

`documentation/` is the docs site. `examples/<group>/<name>` are the docs examples: standalone apps that StackBlitz and
CodeSandbox open from GitHub, each with a page in `documentation/examples`. `examples/README.md` explains how to add
one; `pnpm test:examples` and `pnpm examples` check them. The other folders in `examples/` are development apps.

## Verification

Work is finished when everything the branch affects is green. Run this from the repo root:

```bash
pnpm exec nx affected -t build lint typecheck --base=origin/main --exclude='documentation,shop,react-app,next-app,next-app-router'
```

```bash
pnpm exec nx affected -t test --parallel=1 --base=origin/main --exclude='firebase,firebase-admin,documentation,shop,react-app,next-app,next-app-router'
```

While iterating, stay inside one package:

```bash
pnpm exec vitest run __tests__/features/cache/cache.base.spec.ts
```

- `packages/elysia/__bun__` holds specs that run on Bun, outside vitest. When `packages/elysia` changes, run them too.
  They need Bun installed and core built:

```bash
pnpm --filter @hyper-fetch/elysia test:bun
```

- `firebase` and `firebase-admin` specs run against the Firebase emulators, so the affected command skips them. When
  those packages, `core` or `sockets` change, run them too. They need Java 11 or newer, and CI runs them in the
  `firebase-tests` job:

```bash
pnpm test:firebase
```

- To run one Firebase spec, wrap vitest in the emulators from the package directory:

```bash
pnpm exec firebase emulators:exec "npx vitest run __tests__/features/constraints/constraints.base.spec.ts"
```

- Fix every error you introduced before reporting the work as complete. Never report a check you did not run.
- `pnpm format` rewrites unrelated files. Revert those instead of committing them.
- Changes limited to Markdown, MDX or agent rules need no package checks.

## Non-negotiables

1. **Every bug fix ships with a regression test** that was seen failing first.
2. **Never make a test pass by retrying, skipping or widening a timeout.** Find the cause.
3. **No new `as any`, no dynamic imports** in `packages/*/src`.
4. **Requests report failure through the response.** `send()` resolves, it does not reject. The only exception is the
   opt-in `throwOnError` request option.
5. **Exported API changes update TSDoc and documentation in the same change.**
6. **The commit type decides the release.** `feat`, `fix`, `perf` and `revert` publish every package to npm. Read
   `.cursor/rules/commit-conventions.mdc` before committing.
7. **Never hand-edit `dist/`** or other build output.
8. **`@hyper-fetch/testing` is internal.** It exists only for this repo's own specs. Never mention, recommend or market
   it in READMEs, documentation, blog posts, the landing page, examples, changelogs or social posts, and never list it
   among the packages. Never publish it. Users mock requests with `request.setMock()`.

## Rules by area

Read the matching rule before changing an area.

| Working on                            | Rule in `.cursor/rules/`                                                     |
| ------------------------------------- | ---------------------------------------------------------------------------- |
| Any code in `packages/*/src`          | `library-design.mdc`, `typescript.mdc`                                       |
| Hooks in `packages/react/src`         | `react.mdc`                                                                  |
| Specs in `packages/*/__tests__`       | `testing.mdc`                                                                |
| A bug, failure or regression          | `debugging.mdc`                                                              |
| Commits and releases                  | `commit-conventions.mdc`                                                     |
| Symbols used by `(@import …)` in docs | `import-tsdoc.mdc`                                                           |
| Consumer-facing examples              | `hyper-fetch.mdc`, `hyper-fetch-react.mdc`                                   |
| Pages in `documentation/docs`         | `documentation.mdc`, `guides.mdc`, `visualizations.mdc`                      |
| Posts in `documentation/blog`         | `blog-posts.mdc`, `tutorials.mdc`                                            |
| Landing page and docs UI              | `landing-page.mdc`, `landing-copy-style.mdc`, `branding.mdc`, `tailwind.mdc` |
| READMEs                               | `readme-conventions.mdc`                                                     |

## Skills

Workflows in `.claude/skills/`:

- `fix-bug`: reproduce a bug with a failing test, fix it, keep the test.
- `fix-flaky-tests`: root-cause intermittent failures and prove the fix by repeated runs.
- `ship-change`: verify, pick the commit type by release impact, open the PR and merge it.
- `publish-new-package`: first npm publish and trusted publishing for a package that is not on npm yet.

These are for working on this repo. Every `SKILL.md` outside `skills/` sets `metadata.internal: true` so the
[skills](https://skills.sh) CLI never installs it for users and skills.sh never lists it. `pnpm test:skills` checks it
in CI.

`skills/` holds the public skills, one per package, installed with `npx skills add BetterTyped/hyper-fetch/skills`.
Their readers build apps with HyperFetch. Verify every API name, option, default and type claim in them against
`packages/*/src`, and update the matching skill when a change alters public behavior or types.

## Decisions

Architecture decisions that are hard to reverse or cross-cutting are recorded in `docs/adr/NNNN-<slug>.md` as context,
decision and consequences. Read the ADRs for an area before restructuring it. If a recorded decision looks wrong, raise
it instead of refactoring around it. Create the folder when the first ADR is needed.
