# Tips between the launch threads

Eight tips, one a week on Mondays at 15:00 UTC (T1 tomorrow). Character counts per post; images in launch/code-shots. Lint: 0 errors, 0 warnings.

## T1-request-object · 2026-11-26 15:00 UTC (Thu) · Tip: requests are objects

**1.** (269/280) · image: tip-request-object.png

> A request in HyperFetch is an object, not a promise.
> 
> You configure it once, where it's defined:
> 
> • Retries and the delay between them
> • How long its data stays fresh
> • Whether identical calls share one request
> 
> Every send, hook and component then behaves the same way.

**2.** (64/280)

> Requests in detail:
> hyperfetch.bettertyped.com/docs/core/request

## T2-mocking · 2026-12-07 15:00 UTC (Mon) · Tip: mocking with setMock

**1.** (207/280) · image: tip-mock.png

> Mock any HyperFetch request without a mock server.
> 
> setMock returns the response you want, with request and response times and even progress, so loading states and progress bars look real in tests and demos.

**2.** (63/280)

> Mocking in detail:
> hyperfetch.bettertyped.com/docs/core/mocking

## T3-upload-progress · 2026-12-14 15:00 UTC (Mon) · Tip: upload progress

**1.** (208/280) · image: tip-upload.png

> Upload progress in React, without an XHR wrapper.
> 
> useSubmit gives you onSubmitUploadProgress: the percent done and the time left for every file you send. Downloads get the same with onSubmitDownloadProgress.

**2.** (75/280)

> useSubmit in detail:
> hyperfetch.bettertyped.com/docs/react/hooks/use-submit

## T4-sync-ladder · 2026-12-21 15:00 UTC (Mon) · Contrarian: you probably don't need a sync engine

**1.** (247/280)

> You probably don't need a sync engine.
> 
> Most screens need one of three things:
> 
> • useFetch: server data, cached and deduplicated
> • Optimistic updates: writes that show before the server answers
> • HyperFetch DB: one record shown live in many places

**2.** (133/280)

> Start at the top and move down only when a screen needs it.
> 
> The same requests work at every step, so moving down is never a rewrite.

**3.** (83/280)

> When to use the db instead of useFetch:
> hyperfetch.bettertyped.com/docs/db/overview

## T5-offline · 2027-01-04 15:00 UTC (Mon) · Tip: offline writes

**1.** (216/280) · image: tip-offline.png

> Writes made offline shouldn't be lost.
> 
> In HyperFetch a request sent without a connection waits, then goes out when the connection comes back. It's the default, and with a lazyStorage the queue survives a reload too.

**2.** (89/280)

> Offline first, step by step:
> hyperfetch.bettertyped.com/docs/guides/core/advanced/offline

## T6-search-race · 2027-01-11 15:00 UTC (Mon) · Problem first: the search race

**1.** (170/280) · image: tip-race.png

> The classic search race:
> 
> • You type "ab", then "abc"
> • Both requests go out
> • "ab" answers last and replaces the right results
> 
> A bare useEffect with fetch has this bug.

**2.** (197/280) · image: tip-cancel.png

> In HyperFetch, responses for one cache key apply in the order they were sent, so an older one never overwrites a newer one.
> 
> And a cancelable request aborts the stale search before it even answers.

**3.** (89/280)

> Cancellation in detail:
> hyperfetch.bettertyped.com/docs/guides/core/advanced/cancellation

## T7-cli-openapi · 2027-01-18 15:00 UTC (Mon) · Tip: typed SDK from OpenAPI

**1.** (200/280) · image: tip-cli.png

> Your backend doesn't have to be TypeScript to get a typed client.
> 
> Point the HyperFetch CLI at the OpenAPI schema of a Django, FastAPI, Rails, Laravel or Spring Boot API, and it generates a typed SDK.

**2.** (85/280)

> The generate command in detail:
> hyperfetch.bettertyped.com/docs/cli/commands/generate

## T8-dedupe · 2027-01-25 15:00 UTC (Mon) · Tip: deduplication

**1.** (193/280) · image: tip-dedupe.png

> Three components fetch the current user on mount. One request goes out.
> 
> HyperFetch deduplicates identical requests: the second and third calls join the one in flight and get the same response.

**2.** (91/280)

> Deduplication in detail:
> hyperfetch.bettertyped.com/docs/guides/core/advanced/deduplication
