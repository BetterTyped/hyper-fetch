---
name: release-posts
description:
  Write or rewrite HyperFetch release blog posts (major hub posts, per-area deep dives and minor releases) so they read
  like the best release posts in the ecosystem instead of a page of cards. Use whenever a release post, release notes,
  "what's new" post, announcement or changelog post under documentation/blog is planned, drafted, reviewed or fixed,
  when a version is about to ship, or when the user says a release post is boring, hard to read or "just cards".
metadata:
  internal: true
---

# Release posts

A release post is read top to bottom by people deciding whether to upgrade, and scanned by people looking for the one
change they care about. It has to work for both: a story with real code, and a skeleton you can jump through.

This formula comes from reading the release posts of Docusaurus (3.0, 3.6, 3.10), Vite 7, Next.js 15, Astro 5,
TanStack Query v5 and React 19 in November 2026. None of them uses cards. Their shared moves: a plain title, a short
intro with one concrete hook and the upgrade cost, highlights as an anchor-linked list, one short section per feature
with one small code sample, deep links as one sentence, a breaking-changes table that points to the guide, and named
thanks.

Load `.cursor/rules/blog-posts.mdc` (hero image, code highlighting) and the `humanizer` skill before writing. Verify
every API name, option, default and behavior against `packages/*/src`: a release post that promises a wrong default
costs more trust than it earns.

## Pick the post type

| Type | When | Length |
| --- | --- | --- |
| Major hub | `X.0`: the release overview that links the area posts | 1,200-2,000 words, one code sample per section |
| Area deep dive | One post per area of a major (core and React, sockets, GraphQL...) | 1,200-2,500 words |
| Minor | `X.Y`: a few features, no breaking changes | 500-1,000 words |

## Major hub post

1. **Title**: `HyperFetch 10`. No tagline in the title; the hero image carries it.
2. **Hero**: `<BlogPostImage badge="release" pattern="paths" />` with a short tagline.
3. **Intro, 3-5 sentences, no heading**: announce it, name the one theme, give one concrete number, say who upgrades
   and how hard it is ("Core, React and Firebase upgrade with no code changes"). Then `{/* truncate */}`.
4. **Install**: one ` ```bash npm2yarn2pnpm ` block, then one sentence that points at the breaking changes section.
5. **`## Highlights`**: 6-10 bullets, `- **[Feature name](#section-anchor)**: one line on the gain.` Tag breaking ones
   with `_Breaking._` at the end. Anchors point at sections of this post.
6. **One `##` per area**, in order of reader impact, split by `---`. Each section:
   - Opens with the problem or the gain in one or two sentences, in the reader's terms.
   - Shows one code sample of at most ~12 lines, with the point highlighted (`// highlight-next-line`). Use a
     `<Screenshot>` instead of code when the feature is visual (devtools).
   - Adds at most one short paragraph: what else this area got, in one sentence.
   - Ends with the deep link as part of a sentence: "The [sockets post](/blog/hyper-fetch-10-sockets) covers delivery
     strategies and the upgrade steps." Never a card.
   - 120-250 words.
7. **`## Hardened everywhere`** or similar: the fix count, 4-8 bullets of the fixes users feel, a link to where the rest
   live.
8. **`## Upgrading from N`**: who needs to change nothing, then a `Change | What to do` table, then one sentence linking
   the area posts' upgrade sections and the previous docs version.
9. **`## Thank you`**: name the people whose issues and pull requests shaped the release, with GitHub links. Find them
   with `gh issue list --state closed --search "closed:>=<previous major date>"` and `gh pr list --state merged`, and
   say exactly what they reported. Close with one call to action: open an issue, start a discussion, star the repo.

## Area deep dive

1. Hero `<BlogPostImage badge="feature" />` (any pattern but `paths`), may carry a short code child.
2. Intro, 2-3 sentences: what changed in this area and the upgrade cost.
3. `:::info Version` one line linking the hub post.
4. `## Highlights`: the same bullet form as the hub, anchors into this post.
5. One `##` per change, split by `---`: gain first, then the shortest code (at most ~15 lines, split or `<Tabs>` when
   longer), then a short paragraph or a small table for options and defaults.
6. `## Reliability fixes`, grouped by `###` when long. `## Upgrading` with `Before` / `After` tabs per change.
7. `## Learn more`: a plain list, `- [Docs page](/docs/...): one line.` Never cards.

## Minor post

Title `HyperFetch 10.2`. Intro of 2-3 sentences ending with "no breaking changes". Highlights as one paragraph or 3-5
bullets. 2-5 sections in the hub section shape. Then "Other changes" bullets, thanks and the changelog link.

## Never

- Card grids (`<Highlights>`, `LinkCard`) in release posts. A link costs one line at most.
- A "What is HyperFetch" essay. One clause for newcomers is enough, in the intro.
- A section with no code or image for more than about 300 words.
- Marketing headings or tagline titles. Headings name the feature: "Optimistic updates", "Sockets that recover".
- Highlights that repeat the section text word for word, or link nowhere.
- Full migration steps in the hub. The table plus a link to the area post or guide.
- Generic thanks when you can name people.
- `@hyper-fetch/testing`: it is internal and never mentioned.

## Check it

1. Every highlight anchor matches a heading (Docusaurus ids: lowercase, spaces to dashes, punctuation dropped,
   `## GraphQL, typed end to end` is `#graphql-typed-end-to-end`).
2. Build the docs for production: it throws on broken links and lists broken anchors. See the `docs-quality` skill
   for the commands.
3. Serve the build and run the post check, then open each screenshot and look at it:

   ```bash
   node .claude/skills/release-posts/scripts/check-posts.mjs --base http://localhost:3360 --shots /tmp/hf-posts \
     hyper-fetch-10-0 hyper-fetch-10-sockets
   ```

   It reports anchors that point at no heading, lists without markers, code that scrolls sideways, images that do
   not load, highlight card grids, and the rhythm: one code block or image per 150-300 words is the target.
4. Read it once as someone deciding whether to upgrade, once as someone looking for one feature.
