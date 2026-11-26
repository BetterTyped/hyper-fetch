# Education research: live, type-safe and AI-driven frontends

Raw research for the education plan, collected 2026-11-25 by a research agent from public sources (HN via the Algolia
API, the GitHub API, YouTube trackers, first-party pages). X post view and like counts were not findable, so none are
quoted. Every number below is as reported; spot-check before using any of them in a post (for example the
`mattpocock/skills` star count looks high and needs a recheck).

## Who gets traction, and in what format

- Matt Pocock: about 404K to 435K YouTube subscribers, about 253K on X. His top outlier videos are all AI coding
  (210K to 612K views, for example "mattpocock/skills: A complete AI Coding workflow" 612K, "How To De-Slop A Codebase
  Ruined By AI" 253K). Grew from two-minute TypeScript tips; his writing advice: short, summary first, for skimmers.
  Sources: superx.so/creators/mattpocockuk, outlierkit.com/channel/mattpocockuk,
  newsletter.pragmaticengineer.com/p/ai-skills-with-matt-pocock.
- Theo: about 571K to 576K subscribers, about 102K average views; outliers are AI and model-news reactions. That lane
  is his. Source: outlierkit.com/channel/t3dotgg.
- Josh Comeau: interactive essays hit the HN front page (SVG paths 455, Future of CSS 636, "AI has a multiplying
  effect" 344) and feed his courses (first course over $500K in pre-sales).
- Dan Abramov: long essays (Open Social 991, Progressive JSON 575).
- Kent C. Dodds: moved to MCP; his 2025 review reports 1,259 to 5,265 likes on top posts, MCP content strongest.
- Newsletters: This Week in React over 63K (Feb 2025); Bytes 210K claimed on its site, 69K by a third party
  (unresolved); TLDR 1.6M flagship.
- X formats (Buffer, no methodology given): median engagement text 3.56%, image 3.40%, video 2.96%, link 2.25%.

## Topic heat (HN, 2025-2026)

- Local-first and sync engines: hot but contested. Ink & Switch repost 883; "Why haven't local-first apps become
  popular?" 505 points, 485 comments (skeptical); "Linear sent me down a local-first rabbit hole" 467; InstantDB "Sync
  Engines Are the Future" 327; reverse-engineered Linear sync engine 175 points, about 2.9K stars; LiveStore 156.
- Realtime wins as a contrarian take: "You might not need WebSockets" 419; long-polling over websockets 258; SSE
  stories under 160.
- Optimistic UI and useEffect: quiet (nothing over 88 points). Evergreen, not news.
- Type safety wins only on big releases (Zod 4 782, TS native port 1,827). Frontend "type-safe fetching" pieces did
  not surface. Stars: tRPC 40.9K, Zod 44.4K, Hono 33.1K, Standard Schema 3.7K.
- Agents and AI quality: the loudest area. Claude Skills 816, AGENTS.md 837, Vercel "AGENTS.md outperforms skills in
  our agent evals" 524, "After two years of vibecoding, I'm back to writing by hand" 865, Simon Willison on vibe coding
  vs agentic engineering 787, Google Chrome "Get your coding agent off ~2019 JavaScript" 449. No llms.txt story
  scored: absorbed into skills and AGENTS.md.

## What spreads, what lasts, what fails

- Spreads: contrarian takes on a named assumption, receipts and evals, teardowns of famous products, honest
  postmortems (TanStack supply-chain postmortem 1,097).
- Lasts: interactive explainers that lead into a course, a recurring short-tip series, an open repo people star.
- Fails: news reactions against Theo, generic tips, product posts from small accounts (one anecdote: 47 followers
  after 3 months of build in public).

## Series a small account can run

Weekly teardown (model: the Linear reverse-engineering repo), two-minute tip clips (Pocock), a monthly interactive
essay (Comeau), a public skills repo with versioned releases (Pocock's skill release videos, 237K to 263K), eval posts
(Vercel).

## Ranked angles from the research

1. "How X syncs" teardowns: Linear, Figma or Notion, each idea rebuilt with HyperFetch DB. Thread with diagrams, then
   a post and a repo.
2. Agent skills with receipts: coding-agent tasks on HyperFetch with and without the skill, pass rates published.
3. "You probably don't need a sync engine": a decision test from server state to cache to normalized store to sync.
4. Interactive latency lab: sliders for latency, loss and concurrent edits showing races, rollback and reconnect.
5. Types as guardrails for agents: measured agent errors with typed SDKs vs raw fetch.
6. Two-minute "typed client from X" clips, one backend a week (audience builder, not viral).
7. Maintainer postmortems: hardest bugs in react-zoom-pan-pinch and HyperFetch, why v10 was rebuilt.
8. Public skills repo with release posts.
9. Streaming an AI reply into a live store on the Hype Stack starter (lead with the chat UX problem, not the
   transport).
10. Distribution: pitch teardowns to This Week in React and Bytes, the sync story to localfirst.fm.

Avoid: AI news reactions, generic TypeScript or useEffect tips, plain Hype Stack promotion with no lesson in it.
