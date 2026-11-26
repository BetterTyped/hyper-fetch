# HyperFetch 10 launch on X

All copy lives in `posts.json` and passes the HypeStack Typefully checker (X character count, no dashes, no banned
words). Typefully gets **drafts only**, titled with the planned slot. Set each time in Typefully.

## Calendar

Three posts a week at 15:00 UTC (16:00 Warsaw, 10:00 New York): a tip on Monday, launch threads on Tuesday and
Thursday. Thanksgiving week opens with a tip, so the launch thread starts on the Monday after. A break from 24 December
to 3 January with replies only. The first 2 to 3 hours after each post are for replying to every reply.

| Slot (15:00 UTC) | Thread | Account | Angle | Media |
| --- | --- | --- | --- | --- |
| 2026-11-26 (Thu) | T1-request-object | Maciej Pyrc | Tip: requests are objects | code image |
| 2026-11-30 (Mon) | L1-overview | Maciej Pyrc | X is here + category sentence + number bullets | video |
| 2026-12-01 (Tue) | L2-db | Maciej Pyrc | Problem first | video |
| 2026-12-03 (Thu) | L3-backends | Maciej Pyrc | Contrarian / first | video |
| 2026-12-07 (Mon) | T2-mocking | Maciej Pyrc | Tip: mocking with setMock | code image |
| 2026-12-08 (Tue) | L4-core-react | Maciej Pyrc | Demo first | video |
| 2026-12-10 (Thu) | L5-sockets | Maciej Pyrc | Mechanism first | video |
| 2026-12-14 (Mon) | T3-upload-progress | Maciej Pyrc | Tip: upload progress | code image |
| 2026-12-15 (Tue) | L6-graphql | Maciej Pyrc | Before / after | video |
| 2026-12-17 (Thu) | L7-firebase | Maciej Pyrc | Problem first | video |
| 2026-12-21 (Mon) | T4-sync-ladder | Maciej Pyrc | Contrarian: you probably don't need a sync engine | none |
| 2026-12-22 (Tue) | L8-tooling | Maciej Pyrc | Number first | video |
| 2026-12-23 (Wed) | L9-recap | Maciej Pyrc | Index | none |
| 2027-01-04 (Mon) | T5-offline | Maciej Pyrc | Tip: offline writes | code image |
| 2027-01-05 (Tue) | D1-docs | Maciej Pyrc | Number first, first post after the holiday break: new docs, examples, integrations | code image |
| 2027-01-07 (Thu) | H1-hypestack | HypeStack | Product, team voice | none |
| 2027-01-11 (Mon) | T6-search-race | Maciej Pyrc | Problem first: the search race | code image |
| 2027-01-12 (Tue) | E1-late-responses | Maciej Pyrc | Explainer: race condition | clip |
| 2027-01-14 (Thu) | H2-hypestack | HypeStack | Problem first, team voice | none |
| 2027-01-18 (Mon) | T7-cli-openapi | Maciej Pyrc | Tip: typed SDK from OpenAPI | code image |
| 2027-01-19 (Tue) | E2-delivery | Maciej Pyrc | Explainer: latest vs batch | clip |
| 2027-01-21 (Thu) | E3-optimistic | Maciej Pyrc | Explainer: optimistic create | clip |
| 2027-01-25 (Mon) | T8-dedupe | Maciej Pyrc | Tip: deduplication | code image |
| 2027-01-26 (Tue) | E4-persisted | Maciej Pyrc | Explainer: persisted queries | clip |
| 2027-01-28 (Thu) | E5-reconnect | Maciej Pyrc | Explainer: reconnection | clip |
| 2027-02-02 (Tue) | E6-hydrate | Maciej Pyrc | Explainer: SSR | clip |

Tips (T1 to T8) sit between the launch threads: one HyperFetch feature or problem each, with a code image, chosen from
the angles that drew the most attention in the research (problem first, contrarian, a concrete tip).

## Why this shape

From the research (launches pulled on 2026-11-25, numbers from the public fxtwitter mirror):

- **The head post carries everything.** Replies get about 5 to 10% of the head's views (TanStack DB RC1: 7.2k reply
  views vs 121k head). Each head post has the video and stands alone; the blog link is always the last reply.
- **Native video.** TanStack Start and TanStack DB launched with 40 to 45 second native videos. External embeds did
  badly. No hashtags anywhere: none of the successful launches used them.
- **Angles that worked:** number first (Zod 4, Bun), demo first (TanStack), problem first (Theo on data fetching,
  1.1k likes as text only), "first" claims (Biome v2), partner waves (TanStack Start with Vercel, Netlify, Clerk).
  Memes underperform for small accounts, so there are none.
- **Recap threads are an index, not a peak** (Next.js 16 recap: 65k vs 505k views), so L9 exists to be pinned.
- **Explainers:** one idea, a hook that names the problem, one code block, one link. Hook, then mechanism, then where
  to read more.

## Mentions

Mentions sit mid-sentence in a reply, crediting the project, never stacked in the head post.

- Verified handles used: @trpcio, @elysiaJS, @nodejs, @deno_land, @bunjavascript (exists, profile not readable from
  the mirror), @TheGuildDev, @_philpl, @boshen_c, @stackblitz.
- Hono is @honojs and oRPC is @middleapi (both confirmed). Check before posting: @Firebase and the Oxc project account,
  written as plain names in the copy until confirmed.
- Creators get a thank-you reply, not a tag in the head post: L3 thanks @alexdotjs (tRPC), @yusukebe (Hono), @saltyAom
  (Elysia) and @middleapi (oRPC); the last L9 reply thanks everyone HyperFetch 10 builds on, adding @_philpl (gql.tada),
  @TheGuildDev, @boshen_c (Oxc), @jarredsumner (Bun) and @rough__sea (Deno, Node). Each handle was checked against the
  person's own bio.
- Bigger lever than tags: a short DM to the maintainers a few days before their day (tRPC, Elysia, Hono, oRPC, The
  Guild, Oxc), asking if they would quote the post. A maintainer quote roughly doubled reach in the Oxlint 1.0 case.

## Media

- Head posts: the mastered launch videos from `videos/out/final` (`pnpm render`, then `pnpm master`; 1080p60, 46 to 88 s). No voice, so no captions needed; the
  on-screen titles carry it.
- Explainers: 8 to 15 second clips cut from the videos on the scene's own beats (`videos/launch/clips`, cut with `pnpm clips`).

## Before the HypeStack week

Hype Stack still depends on HyperFetch `^9.0.0` (hype-stack and hype-stack-www). H1 and H2 do not claim HyperFetch 10,
but upgrading Hype Stack to v10 first would let H1 say so, which is a stronger post.

## Rules

- Drafts only. Never scheduled or published from here; set each slot in Typefully.
- Nothing goes to Typefully until the copy has been read in chat.
- Every number is measured: 5,000+ new tests since v9 (1,627 at v9.0.0, 6,754 now), 17.8s vs 1.09s on 4,960 files
  (tooling post), 92 examples (tooling and docs posts), 39 integration guides (docs post). Recount the docs numbers on main the
  week before D1.
