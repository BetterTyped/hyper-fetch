---
name: docs-quality
description:
  Write, rewrite or review HyperFetch documentation pages so they are accurate, short, consistent with similar pages and
  look right on desktop and phones. Use whenever a docs page under documentation/docs is created or changed, when the
  user asks to improve, review, audit or redesign docs pages, an overview, a getting started or quick start page, or
  says the docs are "hard to start with", "too long", "boring" or "look broken". Also use before shipping any change
  that touches documentation/src/css or docs components.
metadata:
  internal: true
---

# Docs quality

What a 208-page quality pass (November 2026) taught us, as a workflow. Read `.cursor/rules/documentation.mdc` first: its
"Page formulas" section says how each page type is structured. This skill says how to get there and how to prove it.

Scope is the current version's hand-written pages under `documentation/docs`. Never edit `versioned_docs`. Generated
`/docs/api` pages and `(@import ...)` blocks come from TSDoc: fix the TSDoc, not the page.

## 1. Know the page's job before writing

Every page has one role. Name it, then pick the formula.

| Role | The reader wants | Shape |
| --- | --- | --- |
| Entry (intro, overview, hub) | The idea in a breath and where to go | `<Lead>`, one tiny example, a `<Flow>`, `<Tiles>` |
| Quick start | Something working in 5 minutes | Numbered steps, then "What just happened" and `<Tiles>` |
| Concept / reference | How it works, every option | Formula sections, options tables, `(@import ...)` |
| Guide | Solve one task | What you'll learn, approaches, summary |
| Integration | Connect X | Install, numbered setup, how it maps, limits |

Entry pages are not reference pages. A reader landing on an overview should get the main idea, see it, and be routed
in one to two screens. Push depth into the reference page or guide and link it with a tile. Pages of the same type
must read the same way: same section order, same headings.

## 2. Entry pages: the overview kit

`documentation/src/components/overview/overview.tsx`, global in MDX (no import). The reference page is
`documentation/docs/getting-started/index.mdx`.

```mdx
<Lead>

**Bold one-clause promise.** One more sentence on what it does for you.

</Lead>

<Flow caption="One line on what the picture shows.">
  <FlowStep title="Request" icon="code">Few words</FlowStep>
  <FlowStep title="Your UI" icon="atom" active>Few words</FlowStep>
</Flow>

<Tiles cols={3}>
  <Tile title="Cache" icon="database" meta="5 min" to="/docs/core/cache">One line under ~70 characters.</Tile>
</Tiles>
```

- `icon` is a key of the `icons` map in overview.tsx. Add an icon there instead of importing lucide in MDX.
- A `<Flow>` has 3-5 steps of a few words each: it is the one picture of the idea, not a full lifecycle.
- Tiles replace Purpose and Summary admonitions and "Next steps" LinkCards on entry pages.
- Style matches the cards maintainers like (integrations index, docs intro): `#1f1f21` tiles, a faint white ring,
  amber icons, an arrow that moves on hover. Keep new components in that language.

## 3. Write

- Verify every API name, option, default and behavior against `packages/*/src` (specs when unclear). The public skills
  in `skills/` are a good map but the source wins, and a docs change that finds a stale skill fixes the skill too.
- Copy rules: `.cursor/rules/landing-copy-style.mdc`. Short sentences, no em dashes, no filler, no exclamation marks
  outside the guide summary title.
- Link the matching runnable example from `documentation/examples` (`/examples/...`), the guide and the API reference.
- Code fits the column: 80 columns in normal blocks, 40 in ` ```tsx live ` blocks (the playground editor is that
  narrow). Put trailing comments on their own line above the code.
- Install commands use ` ```bash npm2yarn2pnpm `. The bare ` ```npm2yarn2pnpm ` fence renders no package manager tabs.
- Summary admonition comes before `## Next steps`, after a `---`.

## 4. Prove the code compiles

Copy each non-trivial snippet into a throwaway folder `packages/react/__tests__/guides/<name>/` (react's test
tsconfig resolves core, sockets, db, zod and the adapters; import hooks from `../../../src`). For packages without
types in the repo (react-native, NetInfo, MMKV), write a small `stubs.d.ts` copying their real public API. Plant one
deliberate error to prove the folder is checked, then from `packages/react`:

```bash
pnpm exec tsgo --noEmit -p __tests__/tsconfig.json 2>&1 | grep guides/<name>/
```

Delete the folder before committing.

## 5. Check the source

```bash
node .claude/skills/docs-quality/scripts/audit.mjs [path-filter]
```

Must end with `0 with issues`. It catches em dashes, filler words, links that do not resolve, code wider than the
column (80, or 40 in live blocks), bare install fences and summaries after Next steps.

## 6. Build and render every page you touched

A dev server cannot take a whole-site run (it went out of memory and later hung at 100% CPU with three parallel runs).
Build for production, serve it, and check desktop and phone width:

```bash
cd documentation && NODE_ENV=production NODE_OPTIONS=--max-old-space-size=12288 pnpm exec docusaurus build --out-dir /tmp/hf-docs-build
pnpm exec docusaurus serve --dir /tmp/hf-docs-build --port 3360 --no-open
```

From the repository root, in another shell:

```bash
node .claude/skills/docs-quality/scripts/render-check.mjs --base http://localhost:3360 --filter <path> --shots /tmp/hf-shots
node .claude/skills/docs-quality/scripts/render-check.mjs --base http://localhost:3360 --filter <path> --mobile
```

The build fails on broken links (`onBrokenLinks: "throw"`) and lists broken anchors; grep the log for
`Broken anchor` on pages that are not `/docs/v<version>/`. The render check must print `0 with issues` at both widths.
For a dev loop on a few pages, `docusaurus start` works; give it `NODE_OPTIONS=--max-old-space-size=12288` and
`ulimit -n 65536`.

## 7. Look at every page

Numbers miss what eyes catch (columns collapsing to one letter, cramped diagrams, walls of text). Turn the screenshots
into one sheet per page and open each with Read:

```bash
node .claude/skills/docs-quality/scripts/review-sheets.mjs /tmp/hf-shots /tmp/hf-sheets
```

For many pages, split the sheets across two or three reviewers with a written brief, each fixing page-level issues and
reporting CSS issues back. Images that look black in a full-page capture are lazy loading, not broken; the render check
scrolls first and reports images that truly fail.

## Pitfalls we hit

- `text-transform` on admonition titles or breadcrumbs mangles names ("Node.Js", "UseInfiniteFetch", "PURPOSE").
  Titles render as written. Admonition titles are sentence case.
- `overflow-wrap: anywhere` on table cells, or on code inside generated API tables, shrinks min-content and collapses
  columns to one letter wide. Use it only on inline code in hand-written tables. Generated signatures wrap with
  `white-space: pre-wrap` at spaces.
- A row of five comparison columns needs tighter cell padding to fit the 750px column.
- `.docs-wrapper p` sets 17px text with 1.8 line height on every paragraph, components included. A component that
  renders MDX children must size `[&_p]` itself.
- Mixed lines with `// error-next-line` or diff markers once widened their block by 24px; line backgrounds must bleed
  by exactly the pre padding.
- Category labels come from `_category_.json`; a folder without one shows its lowercase folder name in breadcrumbs.
- Versioned docs that link to current `/docs/...` URLs break when current headings change. That is expected; leave
  versioned docs alone.

## Done when

- The audit prints `0 with issues`, the build passes with no broken links and no broken anchors on current pages.
- The render check prints `0 with issues` at 1440px and 390px for every touched page.
- Every touched page's sheet was opened and looked at.
- Snippets typechecked, the throwaway folder is deleted, skills in `skills/` match any behavior the docs now describe.
