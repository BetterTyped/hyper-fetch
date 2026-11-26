# Launch threads, final

Every post with its X character count. Media per post: the video or clip on post 1, code images where marked (files in launch/code-shots). Lint: 0 errors, 0 warnings.

## L1-overview · 2026-12-01 15:00 UTC (Tue) · Maciej Pyrc · 16 posts

**1.** (257/280) · video

> HyperFetch 10 is out.
> 
> HyperFetch is an open source TypeScript framework for everything your app sends and receives: REST, GraphQL, tRPC, Firebase, WebSockets and SSE, behind one typed API.
> 
> This release is about your backend, and keeping every screen live.

**2.** (256/280)

> What it does well:
> 
> ✅ Requests typed from your backend
> ✅ Cache, dedupe, retries and cancellation built in
> ✅ Offline queues that survive a reload
> ✅ Upload and download progress
> ✅ React hooks with server rendering
> ✅ Runs in the browser, Node.js, Bun and Deno

**3.** (231/280) · image: db-collection.png

> New: HyperFetch DB.
> 
> Each record is stored once, in a typed collection your requests and socket listeners fill. Components query the collection, so a write or a socket event updates every view of that record at once.
> 
> It's in beta.

**4.** (212/280)

> It takes care of the hard parts of live data: a slow response can't overwrite a newer socket event, a failed optimistic write reverts only what it changed, and writes made offline replay in order after a restart.

**5.** (221/280) · image: backends-trpc.png

> Typed clients from your backend.
> 
> If your server is tRPC, oRPC, Hono or Elysia, HyperFetch reads its types into a full SDK. No schema, no codegen. tRPC subscriptions and oRPC event iterators become typed socket listeners.

**6.** (164/280) · image: core-optimistic.png

> Optimistic updates: describe the change, and core does the rest. It shows before the request is sent, rolls back if the request fails and refetches once it settles.

**7.** (248/280)

> Also in core and React:
> 
> • useInfiniteFetch for page, offset and cursor lists
> • Hydrate, so server data renders with no second fetch
> • Retry backoff with jitter
> • Offline queues on IndexedDB or AsyncStorage
> • Images and files as Blob or ArrayBuffer

**8.** (233/280)

> Sockets that recover.
> 
> Every adapter reconnects on one engine:
> 
> • Jittered backoff
> • A timeout per attempt
> • A reset once the connection holds
> 
> Listeners take typed subscription payloads, and sockets run in Node.js, Bun and Deno too.

**9.** (230/280)

> GraphQL, typed end to end.
> 
> Pass a graphql-codegen or gql.tada document as the endpoint, and the response and variables are typed with no generics. Automatic persisted queries are one option, and subscriptions run over graphql-ws.

**10.** (199/280) · image: firebase-typed.png

> Firebase: query constraints are checked against your document type, so a misspelled field fails to compile instead of quietly matching nothing. Listeners take the same typed query params as requests.

**11.** (219/280)

> Tooling:
> 
> • HyperFlow shows every socket and message
> • Devtools connect from Node.js, Bun and Deno servers
> • An Oxlint plugin, 16x faster than ESLint on our repo
> • 92 runnable examples
> • An agent skill for every package

**12.** (170/280)

> Under all of it: 5,000+ new tests since v9. Line coverage is 99.5% in core, 99.3% in React and 100% in DB, and timing tests run on fake clocks so the suite doesn't flake.

**13.** (161/280)

> Core, React, Firebase and the HTTP adapters upgrade with no code changes. Sockets and GraphQL have a short list in the post, each change with a before and after.

**14.** (204/280)

> HyperFlow is the desktop devtools app for HyperFetch, on macOS, Windows and Linux. Every request, cache entry, queue, socket and db collection of your app, live.
> hyperfetch.bettertyped.com/docs/hyper-flow

**15.** (216/280)

> Want it all wired up from day one?
> 
> Hype Stack is the starter built on HyperFetch:
> 
> • A Hono backend with a typed SDK
> • Realtime over sockets
> • Auth and the screens around it
> • Web, desktop and mobile
> 
> hype-stack.dev

**16.** (183/280)

> Everything in v10, with code for each part:
> hyperfetch.bettertyped.com/blog/hyper-fetch-10-0
> 
> If it helps you, a star on GitHub helps me keep going:
> github.com/BetterTyped/hyper-fetch

## L2-db · 2026-12-03 15:00 UTC (Thu) · Maciej Pyrc · 12 posts

**1.** (228/280) · video

> You rename a post in one component:
> 
> ❌ The feed still shows the old title
> ❌ So does the post page
> ❌ And the sidebar
> 
> Every cached response keeps its own copy. HyperFetch DB stores each record once:
> 
> ✅ Every view updates together

**2.** (215/280)

> New to HyperFetch?
> 
> It's an open source TypeScript framework for everything your app sends and receives: REST, GraphQL, tRPC, Firebase, WebSockets and SSE, behind one typed API.
> 
> HyperFetch DB is its new live layer.

**3.** (185/280) · image: db-collection.png

> Collections are filled by the requests you already have and kept live by your socket listeners. Components query the collection, not an endpoint, and the db picks which request to send.

**4.** (229/280)

> A query names the data, and the db finds the request:
> 
> • It answers from rows it holds when they cover the query
> • Otherwise it sends the loader with the most conditions
> • Then it subscribes to the syncs that keep the result live

**5.** (169/280)

> useLiveQuery has no dependency array, and a query that misses a loader's required filter doesn't compile. Queries work outside React too, with subscribe and getSnapshot.

**6.** (252/280)

> @theo put it well: fetching data takes 10 lines, handling race conditions is the hard part.
> 
> In HyperFetch DB a slow response can't undo a newer socket event, because writes are ordered per field, not per response.
> x.com/theo/status/1818769081832772006

**7.** (215/280)

> How: with a version field, a write only changes fields whose stored version isn't newer. Order comes from a counter, never the clock, and a deleted row stays deleted until the requests sent before the delete settle.

**8.** (214/280)

> Optimistic writes, with no rollback code:
> 
> • A failed write reverts only what it changed
> • Edits made since then stay
> • Writes to one row go out in order
> • An insert keeps its render key when the server sets the id

**9.** (270/280)

> Also in the package:
> 
> • Links keep a summary list and a full detail in step
> • An offline outbox that replays writes after a reload
> • One call sets up a collection from a REST SDK or Firestore
> • useLiveInfiniteQuery for long lists
> • Server rendering with no loading state

**10.** (280/280)

> How I tested it:
> 
> • 90 seeded runs of 40 random steps
> • Every response released in random order
> • The hardest cases from other libraries' issue trackers
> 
> Whatever the order, the client ends on exactly the server's rows. The trackers: Apollo, Dexie, RxDB, urql, Relay and Electric.

**11.** (186/280) · image: db-devtools.png

> And you can watch it work: pass the db to the devtools plugin, and HyperFlow, the desktop devtools app, gets a DB page with every collection, query plan, loaded subset and pending write.

**12.** (120/280)

> It's in beta. The post shows how the live part works and how I tested it:
> hyperfetch.bettertyped.com/blog/hyper-fetch-db

## L3-backends · 2026-12-08 15:00 UTC (Tue) · Maciej Pyrc · 11 posts

**1.** (250/280) · video

> Your tRPC, oRPC, Hono or Elysia server already describes every endpoint. A typed client usually still means:
> 
> ❌ A client schema written again
> ❌ A codegen step
> ❌ Hand-written requests
> 
> ✅ HyperFetch 10 reads the server's types straight into a typed SDK

**2.** (218/280)

> New to HyperFetch? It's an open source TypeScript framework for talking to your backend: requests, cache, retries, offline queues and sockets behind one typed API. In v10 your backend becomes the source of those types.

**3.** (192/280) · image: backends-trpc.png

> One type per backend: TrpcSchema, OrpcSchema, HonoSchema or ElysiaSchema goes into createSdk, and every procedure or route becomes a typed request. Elysia errors are typed per status code too.

**4.** (212/280)

> tRPC: procedures run through the HyperFetch cache, loading states and retries, so there's no second data layer next to it. Subscriptions over WebSocket or SSE become typed listeners that resume after a reconnect.

**5.** (226/280)

> oRPC.
> 
> It sends Date, BigInt, Map and files with its own serializer. @hyper-fetch/orpc encodes with the one from @orpc/client, so client and server always agree.
> 
> Event iterators become typed listeners, over HTTP or WebSocket.

**6.** (212/280)

> Hono: the package exports types only, so it adds nothing to your bundle, and types a full SDK from your app type. WebSocket routes connect through the built in adapter, and the socket address is type checked too.

**7.** (137/280)

> Elysia: responses are typed the way they actually arrive over HTTP, so a Date comes in as a string, and errors are typed per status code.

**8.** (239/280)

> Every route is a regular HyperFetch request, so caching, retries, dedupe and offline queues behave the same whichever backend answers.
> 
> The types come from the work @trpcio, @elysiaJS, @honojs and @middleapi already did on the server side.

**9.** (188/280)

> Thank you @alexdotjs, @yusukebe and @saltyAom for tRPC, Hono and Elysia, and the oRPC team at @middleapi. A typed client like this only works because your servers already know their types.

**10.** (174/280)

> This is how Hype Stack works too: every app talks to its Hono backend through a typed HyperFetch SDK, with realtime over sockets, already wired when you start.
> hype-stack.dev

**11.** (87/280)

> Each backend set up end to end:
> hyperfetch.bettertyped.com/blog/hyper-fetch-10-backends

## L4-core-react · 2026-12-09 15:00 UTC (Wed) · Maciej Pyrc · 11 posts

**1.** (253/280) · video

> Optimistic UI usually means writing, for every mutation:
> 
> ❌ A snapshot of the cache
> ❌ The cache write
> ❌ The rollback
> 
> In HyperFetch 10 you describe the change:
> 
> ✅ Core applies it before the request
> ✅ Rolls it back if it fails
> ✅ Refetches once it settles

**2.** (177/280)

> New to HyperFetch?
> 
> It's an open source TypeScript framework for everything your app sends and receives: REST, GraphQL, tRPC, Firebase, WebSockets and SSE, behind one typed API.

**3.** (186/280) · image: core-optimistic-create.png

> Every step is typed from the requests themselves. The rollback gets the cached list typed from getTodos, the commit gets the mutation's typed response. No snapshot types written by hand.

**4.** (219/280) · image: core-infinite.png

> useInfiniteFetch keeps the pages, the next cursor, the end of the list and filter changes in sync from one pagination description. Page numbers, offsets and cursors all work, and each page stays a normal cached request.

**5.** (128/280)

> Hydrate hands server data to the hooks before their first render, so the page skips both the loading state and the second fetch.

**6.** (138/280)

> retryTime takes a function of the attempt now, so you can back off with jitter and clients that failed together stop retrying in lockstep.

**7.** (213/280)

> Mutations made offline survive a reload on IndexedDB or AsyncStorage: the dispatcher takes a lazyStorage, so the queue lives in async storage.
> 
> And responseType downloads images and files as a Blob or ArrayBuffer.

**8.** (161/280)

> Sharper types: a typed document from graphql-codegen or gql.tada types a request with no generics, and adapters can accept a typed query builder as query params.

**9.** (224/280)

> Core and React got most of the hardening: line coverage is 99.5% in core and 99.3% in React, and the infinite list specs were ported from TanStack Query and SWR.
> 
> No export was removed or renamed, so v9 code keeps compiling.

**10.** (204/280)

> HyperFlow is the desktop devtools app for HyperFetch, on macOS, Windows and Linux. Every request, cache entry, queue, socket and db collection of your app, live.
> hyperfetch.bettertyped.com/docs/hyper-flow

**11.** (77/280)

> Each one with code:
> hyperfetch.bettertyped.com/blog/hyper-fetch-10-core-react

## L5-sockets · 2026-12-10 15:00 UTC (Thu) · Maciej Pyrc · 9 posts

**1.** (264/280) · video

> A busy socket can push far more messages than a screen can draw. Rendering every one is how a live chart turns into a slideshow.
> 
> HyperFetch 10 listeners take a delivery strategy: latest keeps one value per frame, batch groups a window of messages into one render.

**2.** (191/280)

> New to HyperFetch? It's an open source TypeScript framework for requests and sockets behind one typed API. WebSocket, SSE, Firebase, GraphQL and tRPC subscriptions all use the same listeners.

**3.** (159/280) · image: sockets-delivery.png

> Two strategies, for two kinds of data:
> 
> • latest: state like a price, one value per animation frame
> • batch: events like trades, 100ms per render, none dropped

**4.** (174/280) · image: sockets-payload.png

> Listeners carry typed input now. tRPC, oRPC and GraphQL start one subscription per input, so the payload is the second generic of createListener and goes out when you listen.

**5.** (134/280)

> Listeners also take onStart and onEnd, so you know when a job finishes, an input fails validation or a stream completes on the server.

**6.** (217/280)

> Every adapter now reconnects on one engine: jittered backoff, a timeout per attempt, and a reset once the connection stays up. The built in adapters run in @nodejs, @bunjavascript and @deno_land without a window shim.

**7.** (182/280)

> Also:
> 
> • Server-sent events read named events
> • Listeners take query params
> • A typed GraphQL document types a subscription on its own
> • Sockets reconnect when the network comes back

**8.** (148/280)

> To see it live: HyperFlow's Socket Inspector shows each connection, every message in and out, and errors.
> hyperfetch.bettertyped.com/docs/hyper-flow

**9.** (114/280)

> Delivery strategies, payloads and the reconnection options:
> hyperfetch.bettertyped.com/blog/hyper-fetch-10-sockets

## L6-graphql · 2026-12-15 15:00 UTC (Tue) · Maciej Pyrc · 9 posts

**1.** (235/280) · video

> graphql-codegen from @TheGuildDev and gql.tada by @_philpl already give you a typed document. You shouldn't have to repeat its types as generics.
> 
> In HyperFetch 10 the document is the endpoint. Response and variables are typed from it.

**2.** (177/280)

> New to HyperFetch?
> 
> It's an open source TypeScript framework for everything your app sends and receives: REST, GraphQL, tRPC, Firebase, WebSockets and SSE, behind one typed API.

**3.** (155/280) · image: graphql-documents.png

> No generics anywhere: the document types the response and the variables. And errorPolicy: "all" keeps partial data as a success, with the errors beside it.

**4.** (170/280) · image: graphql-persisted-get.png

> Automatic persisted queries: the request sends a SHA-256 hash of the query instead of its text. Requests get lighter, and a hashed GET is short enough for a CDN to cache.

**5.** (179/280)

> After UpdateUser, every GetUser in the cache may be stale, whatever its id. matchGqlOperation matches the cache keys of every variant of a document, like refetchQueries in Apollo.

**6.** (202/280)

> Subscriptions: GraphqlWsAdapter speaks graphql-transport-ws, the protocol Apollo Server, GraphQL Yoga, Mercurius, Hot Chocolate and Hasura support, on the same reconnection engine as every other socket.

**7.** (118/280)

> Each operation follows the GraphQL over HTTP format more closely, and every set of variables gets its own cache entry.

**8.** (204/280)

> HyperFlow is the desktop devtools app for HyperFetch, on macOS, Windows and Linux. Every request, cache entry, queue, socket and db collection of your app, live.
> hyperfetch.bettertyped.com/docs/hyper-flow

**9.** (108/280)

> Typed documents, persisted queries and subscriptions:
> hyperfetch.bettertyped.com/blog/hyper-fetch-10-graphql

## L7-firebase · 2026-12-16 15:00 UTC (Wed) · Maciej Pyrc · 7 posts

**1.** (187/280) · video

> A typo in a Firestore where clause doesn't throw. It quietly matches nothing.
> 
> In HyperFetch 10 constraints are checked against your document type, so a misspelled field fails to compile.

**2.** (223/280)

> New to HyperFetch?
> 
> It's an open source TypeScript framework for the data your app sends and receives. For Firebase it wraps Firestore and the Realtime Database, web and admin SDKs, with typed requests, cache and listeners.

**3.** (206/280) · image: firebase-typed.png

> Type queryParams with FirestoreQueryParams and every field name and value is checked against the document, nested fields included. Filters a user toggles on screen can be an array too, with the same checks.

**4.** (141/280)

> Listeners take the same typed query params as requests, and groupByChangeType tells you what was added, modified or removed in each snapshot.

**5.** (236/280)

> Both Firebase packages run their full emulator suites on every change, and the release waits for them.
> 
> Nothing breaks on upgrade: the old constraints still work and are marked deprecated, so your editor points at every place to update.

**6.** (125/280)

> HyperFetch is free and open source. If it helps you, a star on GitHub helps me keep going:
> github.com/BetterTyped/hyper-fetch

**7.** (110/280)

> Typed queries for Firestore and the Realtime Database:
> hyperfetch.bettertyped.com/blog/hyper-fetch-10-firebase

## L8-tooling · 2026-12-17 15:00 UTC (Thu) · Maciej Pyrc · 9 posts

**1.** (218/280) · video

> Linting the 4,960 files of the HyperFetch repo, same rules, same findings:
> 
> • ESLint: 17.8s
> • Oxlint: 1.09s
> 
> HyperFetch 10 ships its lint rules as an Oxlint plugin, thanks to the speed @boshen_c and the Oxc team built.

**2.** (177/280)

> New to HyperFetch?
> 
> It's an open source TypeScript framework for everything your app sends and receives: REST, GraphQL, tRPC, Firebase, WebSockets and SSE, behind one typed API.

**3.** (246/280) · image: tooling-lint.png

> The rules catch what TypeScript lets through.
> 
> Every generic key on createClient and createRequest is optional, so a typo like rsponse quietly types your data as unknown. The plugin flags it.
> 
> The ESLint plugin works with typescript-eslint 8 too.

**4.** (138/280)

> HyperFlow now shows every socket: the connection, each message in and out, and errors. It connects from Node.js, Deno and Bun servers too.

**5.** (200/280)

> HyperFlow also shows how many components subscribe to each cache key, and every flow runs end to end against each adapter: fetch, axios, GraphQL, tRPC, oRPC, Firebase, Firebase Admin and a custom one.

**6.** (148/280) · image: tooling-skills.png

> 92 example apps that open in @stackblitz, and one agent skill per package, so coding agents write current HyperFetch. One command installs them all.

**7.** (185/280)

> Each agent skill covers setup, golden rules, patterns, pitfalls and type safety, checked against the package source, so the agent writes current HyperFetch instead of what it remembers.

**8.** (216/280)

> Want it all wired up from day one?
> 
> Hype Stack is the starter built on HyperFetch:
> 
> • A Hono backend with a typed SDK
> • Realtime over sockets
> • Auth and the screens around it
> • Web, desktop and mobile
> 
> hype-stack.dev

**9.** (86/280)

> Linting, devtools and examples:
> hyperfetch.bettertyped.com/blog/hyper-fetch-10-tooling

## L9-recap · 2026-12-18 15:00 UTC (Fri) · Maciej Pyrc · 9 posts

**1.** (66/280)

> Everything in HyperFetch 10, one post per part. A video for each 🧵

**2.** (103/280)

> HyperFetch DB: each record stored once, every view live.
> hyperfetch.bettertyped.com/blog/hyper-fetch-db

**3.** (103/280)

> Typed clients from tRPC, oRPC, Hono and Elysia.
> hyperfetch.bettertyped.com/blog/hyper-fetch-10-backends

**4.** (102/280)

> Optimistic helpers, infinite lists, Hydrate.
> hyperfetch.bettertyped.com/blog/hyper-fetch-10-core-react

**5.** (112/280)

> Sockets: delivery strategies and one reconnection engine.
> hyperfetch.bettertyped.com/blog/hyper-fetch-10-sockets

**6.** (111/280)

> GraphQL: typed documents, persisted queries, graphql-ws.
> hyperfetch.bettertyped.com/blog/hyper-fetch-10-graphql

**7.** (104/280)

> Firebase: typed constraints and grouped changes.
> hyperfetch.bettertyped.com/blog/hyper-fetch-10-firebase

**8.** (99/280)

> Oxlint plugin, socket devtools, 92 examples.
> hyperfetch.bettertyped.com/blog/hyper-fetch-10-tooling

**9.** (186/280)

> And thank you to the people and teams whose tools HyperFetch 10 builds on: @alexdotjs, @yusukebe, @saltyAom, @middleapi, @_philpl, @TheGuildDev, @boshen_c, @jarredsumner and @rough__sea.

## D1-docs · 2027-01-05 15:00 UTC (Tue) · Maciej Pyrc · 6 posts

**1.** (212/280)

> HyperFetch has new docs.
> 
> 92 examples that run right on the page.
> 39 integration guides, from Next.js and Bun to Django, Rails and Spring Boot.
> Guides for everything from your first request to offline-first apps.

**2.** (248/280)

> Your backend does not have to be TypeScript.
> 
> The Django, FastAPI, Rails, Laravel, Spring Boot and ASP.NET Core guides export your OpenAPI schema and turn it into a typed HyperFetch SDK with the CLI. The frontend gets your server's models as types.

**3.** (160/280) · image: docs-examples.png

> Every example is a real app in the repo. It runs live on its page, opens in @stackblitz or CodeSandbox in one click, or starts on your machine with one command.

**4.** (213/280)

> Already on TanStack Query or SWR? There are guides for calling typed HyperFetch requests from inside them.
> 
> Still choosing? There are side by side comparisons with TanStack Query, SWR, RTK Query and Apollo Client.

**5.** (225/280)

> Auth guides for Clerk, Auth0, Better Auth, Auth.js, Supabase Auth and Firebase Auth. Runtime guides for Node.js, Bun, Deno, Cloudflare Workers, Electron and React Native.
> 
> And for coding agents, the whole site is in llms.txt.

**6.** (84/280)

> Docs: hyperfetch.bettertyped.com/docs
> Examples: hyperfetch.bettertyped.com/examples/

## H1-hypestack · 2027-01-07 15:00 UTC (Thu) · HypeStack · 2 posts

**1.** (184/280)

> Every Hype Stack app talks to its Hono backend through a typed HyperFetch SDK, with realtime over HyperFetch sockets. Requests, caching and reconnects are already wired when you start.

**2.** (62/280)

> One command, and you own all of the code after:
> hype-stack.dev

## H2-hypestack · 2027-01-12 15:00 UTC (Tue) · HypeStack · 2 posts

**1.** (212/280)

> Most new apps spend their first week on the same plumbing: auth, a typed API client, realtime, and the screens around them.
> 
> Hype Stack starts there. Web, desktop, mobile and browser apps from one typed codebase.

**2.** (59/280)

> Start free and add modules as you need them:
> hype-stack.dev

## E1-late-responses · 2027-01-14 15:00 UTC (Thu) · Maciej Pyrc · 3 posts

**1.** (222/280) · clip

> The race that breaks most realtime lists: you refetch, a socket event says the title is now "Final", then the refetch lands with "Draft" it read before the edit.
> 
> A request cache shows "Draft". HyperFetch DB shows "Final".

**2.** (215/280)

> It orders writes per field, not per response. With a version field, a write only changes fields whose stored version isn't newer. Without one, a response only changes fields last written before its request was sent.

**3.** (126/280)

> Deletes count as writes too, so a late response can't bring a deleted row back.
> hyperfetch.bettertyped.com/blog/hyper-fetch-db

## E2-delivery · 2027-01-19 15:00 UTC (Tue) · Maciej Pyrc · 3 posts

**1.** (180/280) · clip

> Two kinds of socket data need two delivery strategies:
> 
> • State, like a price: latest keeps the newest value per frame
> • Events, like trades: batch renders a window of them at once

**2.** (118/280) · image: sockets-trade-log.png

> With batch, the listener gets every message of a 100ms window at once: one render per window instead of one per trade.

**3.** (90/280)

> Timelines and custom strategies:
> hyperfetch.bettertyped.com/docs/guides/sockets/throttling

## E3-optimistic · 2027-01-21 15:00 UTC (Thu) · Maciej Pyrc · 3 posts

**1.** (239/280) · clip

> Optimistic create is the hard case: the row needs an id before the server gives it one.
> 
> In HyperFetch 10 you insert with a temporary id, then say how to roll it back and how to swap in the real row. Both steps are typed from the requests.

**2.** (156/280) · image: core-optimistic-create.png

> Insert with a temporary id, roll it back by filtering it out, and commit by swapping in the server's row. The data and the response are typed at every step.

**3.** (102/280)

> Rollback and commit in detail:
> hyperfetch.bettertyped.com/docs/guides/react/basics/optimistic-approach

## E4-persisted · 2027-01-26 15:00 UTC (Tue) · Maciej Pyrc · 3 posts

**1.** (254/280) · clip

> Caching GraphQL at the edge:
> 
> ❌ A GraphQL POST can't be cached by a CDN
> ✅ A GET with a hash can
> 
> With persistedQueries on, HyperFetch sends the SHA-256 of the query instead of its text. The server answers from its store, and a CDN can cache the response.

**2.** (88/280) · image: graphql-persisted-get.png

> One option on the request. Send it as a GET and the hashed URL is short enough to cache.

**3.** (116/280)

> Persisted queries and the rest of the adapter:
> hyperfetch.bettertyped.com/docs/integrations/adapter-graphql/overview

## E5-reconnect · 2027-01-28 15:00 UTC (Thu) · Maciej Pyrc · 3 posts

**1.** (220/280) · clip

> When a server restarts, every client reconnects at once unless something spreads them out.
> 
> HyperFetch 10 sockets back off with jitter, give each attempt its own timeout, and reset the counter once a connection stays up.

**2.** (253/280) · image: sockets-reconnect.png

> The defaults, for every adapter:
> 
> • The first retry comes 1 to 2 seconds after the loss
> • The window grows up to 30 seconds
> • 5 seconds of uptime reset the counter
> 
> shouldReconnect decides which losses are worth retrying, like skipping a rejected token.

**3.** (107/280)

> Reconnection, timeouts and the options in detail:
> hyperfetch.bettertyped.com/docs/guides/sockets/connection

## E6-hydrate · 2027-02-02 15:00 UTC (Tue) · Maciej Pyrc · 3 posts

**1.** (235/280) · clip

> Server rendering often fetches the same data twice:
> 
> ❌ Once on the server
> ❌ Once again in the browser
> 
> HyperFetch's Hydrate hands the server response to the hooks:
> 
> ✅ The first render has the data
> ✅ No request goes out while it's fresh

**2.** (127/280) · image: core-hydrate-server.png, core-hydrate-client.png

> The server sends the request and dehydrates the response. In the browser, Hydrate gives it to useFetch before the first render.

**3.** (64/280)

> Hydrate in detail:
> hyperfetch.bettertyped.com/docs/react/hydrate
