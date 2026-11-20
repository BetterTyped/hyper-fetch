# Plugins and custom adapters

## Plugins

A `Plugin` observes the client lifecycle: requests, adapter calls, cache and dispatchers. Use it for analytics, logging,
persistence of queues, devtools-like tooling. Plugins observe; to change requests or responses use interceptors.

```ts
import { Plugin, type ClientInstance } from "@hyper-fetch/core";

export const createTimingPlugin = (report: (endpoint: string, ms: number, ok: boolean) => void) => {
  const started = new Map<string, number>();

  return new Plugin<ClientInstance, { version: number }>({ name: "timing", data: { version: 1 } })
    .onRequestStart(({ request }) => {
      started.set(request.queryKey, Date.now());
    })
    .onRequestFinished(({ request, response }) => {
      const start = started.get(request.queryKey) ?? response.requestTimestamp;
      report(request.requestOptions.endpoint, Date.now() - start, response.success);
    })
    .onCacheItemChange(({ cacheKey, newData }) => {
      console.debug("cache", cacheKey, newData.responseTimestamp);
    });
};

client.addPlugin(createTimingPlugin(sendMetric));
```

- `new Plugin({ name, data? })`; hook methods are chained on the instance. The constructor does not take hooks.
- One callback per hook: calling `.onRequestStart(cb)` again replaces the previous one. Compose inside the callback.
- `client.addPlugin(plugin)` calls `onMount`; `client.removePlugin(plugin)` calls `onUnmount`. `plugin.client` holds the
  client after mounting.
- Callbacks are synchronous observers. A throwing plugin is logged and rethrown outside the lifecycle; requests, cache
  and other plugins keep working.

Hooks and payloads:

| Hook                                                                            | When                                        | Data                                     |
| ------------------------------------------------------------------------------- | ------------------------------------------- | ---------------------------------------- |
| `onMount` / `onUnmount`                                                         | added / removed                             | `{ client }`                             |
| `onRequestCreate`                                                               | `client.createRequest()(...)` (not clones)  | `{ request }`                            |
| `onAdapterFetch`                                                                | each adapter call, before interceptors      | `{ request, requestId, adapter }`        |
| `onRequestTrigger`                                                              | the adapter is about to send                | `{ request }`                            |
| `onRequestStart`                                                                | the adapter started sending                 | `{ request }`                            |
| `onRequestSuccess` / `onRequestError`                                           | each attempt, after response interceptors   | `{ request, response }`                  |
| `onRequestFinished`                                                             | each attempt, success or error              | `{ request, response }`                  |
| `onCacheItemChange`                                                             | an entry was stored                         | `{ cache, cacheKey, prevData, newData }` |
| `onCacheItemInvalidate` / `onCacheItemDelete`                                   | invalidated / deleted                       | `{ cache, cacheKey }`                    |
| `onDispatcherItemAdded` / `onDispatcherItemDeleted`                             | queue item added / removed                  | `{ dispatcher, queue, queueItem }`       |
| `onDispatcherQueueCreated`                                                      | every queue write (not only creation)       | `{ dispatcher, queue }`                  |
| `onDispatcherQueueRunning`                                                      | `start` / `pause` / `stop`                  | `{ dispatcher, queue, status }`          |
| `onDispatcherQueueDrained` / `onDispatcherQueueCleared` / `onDispatcherCleared` | queue emptied / cleared, dispatcher cleared | `{ dispatcher, queue? }`                 |

Retries fire the request hooks once per attempt. `onRequestTrigger` and `onRequestStart` depend on the adapter's fetcher
calling `onBeforeRequest()` / `onRequestStart()`; the built-in adapters and the mocker do. The devtools plugin
(`hyper-fetch-devtools`) is a full example.

## Choosing the adapter

Most apps never write one: the default HTTP adapter (fetch) covers REST. Switch with `client.setAdapter(...)`:

| Backend                                                                                 | Package / skill                                      |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| REST with axios features (interceptors, Node agents, upload progress in older runtimes) | `@hyper-fetch/axios`, `hyper-fetch-axios`            |
| GraphQL                                                                                 | `@hyper-fetch/graphql`, `hyper-fetch-graphql`        |
| Firebase client / admin                                                                 | `hyper-fetch-firebase`, `hyper-fetch-firebase-admin` |
| tRPC / oRPC routers                                                                     | `hyper-fetch-trpc`, `hyper-fetch-orpc`               |
| Realtime                                                                                | `@hyper-fetch/sockets`, `hyper-fetch-sockets`        |

Note: request defaults belong to an adapter. The `deduplicate: true` default for GET and QUERY is set by the HTTP
adapter only.

## Writing an adapter

```ts
import {
  Adapter,
  createClient,
  stringifyQueryParams,
  type HttpMethodsType,
  type HttpStatusType,
  type QueryParamsType,
} from "@hyper-fetch/core";

type MyOptions = { timeout?: number };
type MyExtra = { headers: Record<string, string> };

export const myAdapter = new Adapter<MyOptions, HttpMethodsType, HttpStatusType, MyExtra, QueryParamsType | string>({
  name: "my-adapter",
  defaultMethod: "GET",
  defaultExtra: { headers: {} },
  systemErrorStatus: 0, // status used for errors thrown inside the pipeline
  systemErrorExtra: { headers: {} },
})
  .setQueryParamsMapper(stringifyQueryParams) // object -> "?a=1"
  .setFetcher(
    async ({
      url,
      endpoint,
      queryParams,
      request,
      headers,
      payload,
      adapterOptions,
      getAbortController,
      createAbortListener,
      onBeforeRequest,
      onRequestStart,
      onRequestEnd,
      onResponseStart,
      onResponseEnd,
      onSuccess,
      onError,
    }) => {
      const controller = getAbortController();
      // Resolves the request with AbortError when request.abort()/cancelable fires
      const unmountAbort = createAbortListener({ status: 0, extra: { headers: {} } });
      onBeforeRequest();
      onRequestStart();
      try {
        const response = await fetch(`${url}${endpoint}${queryParams}`, {
          method: request.method,
          headers: headers as Record<string, string>,
          body: request.method === "GET" ? undefined : (payload as BodyInit | undefined),
          signal: controller?.signal,
        });
        onRequestEnd();
        onResponseStart();
        const data = await response.json();
        onResponseEnd();
        const extra = { headers: Object.fromEntries(response.headers.entries()) };
        if (response.ok) onSuccess({ data, status: response.status, extra });
        else onError({ error: data, status: response.status, extra });
        console.debug(adapterOptions?.timeout);
      } catch (error) {
        // The abort listener already resolved aborted requests
        if (!controller?.signal.aborted) onError({ error, status: 0, extra: { headers: {} } });
      } finally {
        unmountAbort();
      }
    },
  );

export const client = createClient({ url: "https://api.example.com" }).setAdapter(myAdapter);
```

Fetcher bindings (all optional to use, but follow this contract):

- Inputs: `request`, `requestId`, `url` (client base url), `endpoint`, `queryParams`, `headers`, `payload` (already
  mapped), `adapterOptions` (`setAdapterDefaults` merged with `request.options`), `adapter`.
- Must end with exactly one of `onSuccess({ data, status, extra })`, `onError({ error, status, extra })`,
  `onTimeoutError({ status, extra })`, `onAbortError(...)` or the abort listener. They run response interceptors and
  resolve the request; never throw from the fetcher for expected failures.
- Progress and lifecycle: `onBeforeRequest`, `onRequestStart`, `onRequestProgress({ total, loaded })`, `onRequestEnd`,
  `onResponseStart`, `onResponseProgress({ total, loaded })`, `onResponseEnd` feed events, progress callbacks and
  plugins.
- Abort: `getAbortController()` for the signal, `createAbortListener({ status, extra, onAbort? })` to resolve on abort;
  call its return value to clean up.
- Mocks (`request.setMock`) are handled by core before your fetcher runs.

Adapter configuration methods: `setRequestDefaults(fn)`, `setAdapterDefaults(fn)`, `setDefaultMethod`,
`setDefaultExtra`, `setInternalErrorMapping`, `setHeaderMapper`, `setPayloadMapper`, `setEndpointMapper`,
`setQueryParamsMapper` (+ matching `set*MapperConfig`), `setDevtoolsEndpointGetter`, `onInitialize(cb)`.

Typing: the positional generics are options, methods, status, extra, query params, default query params, endpoint type,
then mapper types and extra `createRequest` fields;
`DeclareAdapterType<{ adapterOptions, methodType, statusType, extra, queryParams, ... }>` names them. Export a factory
or the instance and its type (`export type MyAdapterType = typeof myAdapter`) so apps can type helpers. The adapter's
types drive request `method`, `options`, `status` and `extra` checking; see type-safety.

Create one adapter instance per client (adapters hold a reference to the client they are initialized with). For deeper
examples read the sources of `@hyper-fetch/axios` and `@hyper-fetch/graphql`, and
https://hyperfetch.bettertyped.com/docs/core/adapter.
