# Requests and typing

## Creating a request

```ts
const request = client.createRequest<{
  response?: Data; // `data` type. Default `undefined`, so always declare it for reads.
  payload?: Body; // body type. Default `undefined`: no payload accepted.
  queryParams?: Query; // query params type. Without it no queryParams can be passed (HTTP adapter).
  error?: LocalError; // endpoint-specific error, unioned with the client's global error
  endpoint?: string; // rarely needed - the literal endpoint is inferred from the options
}>()({
  endpoint: "/users/:userId", // required; `:name` segments become typed params
  method: "GET", // adapter methods; HTTP: GET | POST | PUT | PATCH | DELETE | QUERY
  // every option below is optional
  headers: { "X-Client": "web" },
  auth: true,
  cache: true,
  cacheTime: Time.MIN * 5,
  staleTime: Time.MIN * 5,
  retry: 0,
  retryTime: 500,
  cancelable: false,
  queued: false,
  offline: true,
  deduplicate: false, // HTTP adapter makes it true for GET and QUERY
  deduplicateTime: undefined, // null/undefined: join for the whole flight
  structuralSharing: true,
  disableRequestInterceptors: false, // skip onRequest and onAuth
  disableResponseInterceptors: false, // skip onResponse, onSuccess and onError
  options: { timeout: 10_000 }, // adapter options (HTTP: RequestInit fields + timeout + streaming + responseType)
  cacheKey: undefined, // overrides; generated when omitted
  queryKey: undefined,
  abortKey: undefined,
});
```

- The double call is mandatory. `createRequest<Types>(options)` does not compile on purpose.
- `Time` is exported: `Time.SEC`, `Time.MIN`, `Time.HOUR`, `Time.DAY`, `Time.WEEK`.
- `method` without a value falls back to the adapter `defaultMethod` (`"GET"` for HTTP).
- Request creation runs `adapter.setRequestDefaults` (merged under your options) and the client key mappers.
- `RequestGenericType` also accepts a `params` field, but endpoint params are always inferred from the endpoint string.

## Endpoint params

`"/users/:userId/posts/:postId"` produces `{ userId: string | number; postId: string | number }`.

```ts
await getPost.send({ params: { userId: 1, postId: "abc" } }); // required until set
const userPosts = getPost.setParams({ userId: 1, postId: 2 }); // new request, endpoint "/users/1/posts/2"
await userPosts.send(); // params now optional
```

Each `:segment` is replaced once by the longest matching param name, so `:id` never eats `:idx`. Values are inserted
as-is (no encoding); encode user input yourself if it may contain `/` or `?`.

## Query params

```ts
const getUsers = client.createRequest<{
  response: User[];
  queryParams?: { page?: number; tags?: string[]; search?: string }; // `?:` key = optional at send
}>()({ endpoint: "/users" });

await getUsers.send(); // allowed because the key is optional
await getUsers.send({ queryParams: { page: 2, tags: ["a", "b"] } }); // -> /users?page=2&tags[]=a&tags[]=b
const page2 = getUsers.setQueryParams({ page: 2 });
```

- Declare `queryParams: Q` (no `?`) to make them required on every `send` until `setQueryParams` is called.
- The HTTP adapter also accepts a string: `queryParams: string` and pass `"?a=1"` or `"a=1"`.
- Default encoding: `arrayFormat: "bracket"`, `null`, `undefined` and `""` are skipped, Dates become ISO strings, nested
  objects JSON. Change it with `client.adapter.setQueryParamsMapperConfig({ arrayFormat: "comma" })`; options: `strict`,
  `encode`, `arrayFormat` (`bracket | index | comma | separator | bracket-separator | none`), `arraySeparator`,
  `skipNull`, `skipEmptyString`, `dateParser`, `objectParser`.
- Query params are part of `cacheKey` and `queryKey`: each combination is a separate cache entry and queue.

## Payload

```ts
await createUser.send({ payload: { name: "Ann", email: "ann@x.com" } });
const draft = createUser.setPayload({ name: "Ann", email: "ann@x.com" });
await draft.send(); // payload now optional
```

- Objects are JSON-stringified and get `Content-Type: application/json` automatically (unless you set the header).
- `FormData`, `Blob`, `ArrayBuffer`, typed arrays, `URLSearchParams` and `ReadableStream` are sent untouched and the
  runtime sets their content type. Type the payload as `FormData` for uploads:

```ts
const uploadAvatar = client.createRequest<{ response: { url: string }; payload: FormData }>()({
  endpoint: "/avatar",
  method: "POST",
});
const form = new FormData();
form.append("file", file);
await uploadAvatar.send({ payload: form, onUploadProgress: ({ progress }) => setProgress(progress) });
```

- Falsy payloads (`0`, `false`, `""`) are valid. The HTTP adapter never sends a body for GET.
- `setPayloadMapper(fn)` replaces the default JSON serialization, so return the final body (string or FormData). The
  default header mapper still looks at the original payload: an object payload mapped to `FormData` keeps
  `Content-Type: application/json`. Build `FormData` before sending instead.

## Immutability and cloning

Every setter clones: `setHeaders`, `setAuth`, `setParams`, `setPayload`, `setQueryParams`, `setOptions`, `setScope`,
`setCancelable`, `setRetry`, `setRetryTime`, `setRetryOnError`, `setOptimistic`, `setCacheTime`, `setCache`,
`setStaleTime`, `setQueued`, `setOffline`, `setAbortKey`, `setCacheKey`, `setQueryKey`, `setDeduplicate`,
`setDeduplicateTime`, `setStructuralSharing`, `setUsed`, `setPayloadMapper`, `setRequestMapper`, `setResponseMapper`,
`abort` (returns a clone after aborting). Clones inherit mappers, `retryOnError`, optimistic callback, mock and a copy
of the `$hooks` listeners.

Mutating exceptions: `setMock(fn, config)`, `clearMock()`, `setMockingEnabled(bool)` change the instance and return it.

Generated keys are recomputed on every clone (so `setParams` gives a new `cacheKey`), but a key set by hand with
`setCacheKey` / `setQueryKey` / `setAbortKey` (or the option) sticks to all later clones.

`setHeaders` replaces the whole header object; spread `request.headers` to extend.

## Sending

`send(options?)` options:

- `params`, `queryParams`, `payload` - required by the types until set on the request.
- Any request option except `endpoint` and `method`: `headers`, `retry`, `retryTime`, `cacheTime`, `staleTime`, `cache`,
  `cancelable`, `queued`, `offline`, `deduplicate`, `deduplicateTime`, `options`, keys, interceptor switches...
- `dispatcherType`: `"auto"` (default: GET/QUERY -> `fetchDispatcher`, others -> `submitDispatcher`), `"fetch"`,
  `"submit"`.
- `cachePolicy`: `"network-only"` (default), `"cache-first"` (cached entry if any, else network), `"revalidate"` (cached
  entry immediately and a background refresh; awaits the network when nothing is cached). Neither checks `staleTime`.
- `optimistic`: per-call optimistic operations or callback, replaces the request's own.
- Callbacks: `onBeforeSent({ request, requestId })` (synchronously, after the request is queued), `onRequestStart`,
  `onResponseStart`, `onUploadProgress` / `onDownloadProgress`
  (`{ progress, timeLeft, sizeLeft, total, loaded, startTimestamp, request, requestId }`),
  `onRetry({ retry, delay, response, details, request, requestId })` for every failed attempt that schedules a retry
  (`retry` from 1, `delay` in ms; these attempts never reach `onResponse`), `onResponse({ response, details, request,
requestId })` once with the final response, `onRemove` when the request is removed from the queue before finishing.
  Every callback also receives `mutationContext` from `setOptimistic`.

`details` (`ResponseDetailsType`): `retries`, `isCanceled`, `isOffline`, `willRetry`, `addedTimestamp`,
`triggerTimestamp`, `requestTimestamp`, `responseTimestamp`.

Callbacks that throw do not break the request: `send()` still resolves and the error is rethrown outside the lifecycle
(it reaches `window.onerror` / `uncaughtException`).

### exec vs send

|                                                      | `send()` | `exec()` |
| ---------------------------------------------------- | -------- | -------- |
| Interceptors, mappers, mock                          | yes      | yes      |
| Dispatcher: dedup, cancelable, queue, offline, retry | yes      | no       |
| Writes the cache, emits cache events                 | yes      | no       |
| Lifecycle callbacks and `$hooks`                     | yes      | no       |
| Can be aborted with `request.abort()`                | yes      | yes      |

## Response object

```ts
type ResponseType<Data, Error, Adapter> = {
  data: Data | null; // null on failure
  error: Error | null; // null on success
  status: number | null; // HTTP status; 0 for network, timeout and abort; null when removed from the queue
  success: boolean;
  extra: { headers: Record<string, string> } | null; // HTTP adapter: response headers
  requestTimestamp: number; // ms, when the adapter started
  responseTimestamp: number; // ms, when the response arrived
};
```

It is not a discriminated union (GraphQL can return data and error together), so check `success` or `data` before use.
The body is parsed as JSON when possible, otherwise returned as text; an empty 2xx gives a falsy `data`.
`options: { streaming: true }` on the HTTP adapter gives `data` as the raw `ReadableStream<Uint8Array>`.
`options: { responseType: "blob" | "arrayBuffer" | "text" | "json" }` picks the shape of a successful body - use `"blob"`
or `"arrayBuffer"` for files, the default text decoding corrupts binary data. Error bodies are always parsed.

## Instance hooks ($hooks)

```ts
const unsubscribe = getUser.$hooks.onResponse(({ response }) => analytics.track("user", response.status));
```

Available: `onBeforeSent`, `onRequestStart`, `onResponseStart`, `onUploadProgress`, `onDownloadProgress`, `onRetry`,
`onResponse`, `onRemove`. They fire for every `send()` of the instance and of clones created **after** registration (clones take a
copy). Register once on the module-level request, never inside a render or a loop, and keep the unsubscribe function.
Not serialized by `toJSON`.

## Reusable typing

- `RequestInstance<{ response?: R; payload?: P; queryParams?: Q; error?: E }>` - constraint for helpers and components
  that accept any matching request. Omitted fields are `any`.
- `RequestModel<{ ... }>` - definition of one endpoint (SDK schemas). Omitted fields are strict: `response: unknown`,
  `payload` and `queryParams: undefined`, `error: Error`.
- Extractors: `ExtractResponseType<T>`, `ExtractPayloadType<T>`, `ExtractQueryParamsType<T>`, `ExtractParamsType<T>`,
  `ExtractErrorType<T>` (local | global), `ExtractLocalErrorType<T>`, `ExtractGlobalErrorType<T>`,
  `ExtractEndpointType<T>`, `ExtractAdapterType<T>`, `ExtractClientType<T>`; `RequestResponseType<T>` is the resolved
  response; `RequestSendOptionsType<T>` the options of `send`.

```ts
import type { RequestInstance, RequestSendOptionsType } from "@hyper-fetch/core";

function sendTracked<T extends RequestInstance<{ response: User[] }>>(request: T) {
  // Inside generic code the options type is not resolved yet, so pass it explicitly
  return request.send({} as RequestSendOptionsType<T>);
}
```

## Serialization

`request.toJSON()` returns a plain object (keys, options, params, payload...) and `client.fromJSON(json)` or
`Request.fromJSON(client, json)` rebuilds it. Functions (mappers, mocks, `$hooks`, `retryOnError`, optimistic) are not
serialized; dispatchers rebuild JSON items automatically when they come from persistent storage.

## Other request members

- `request.read()` - cached response for the request's key (and scope), or `undefined`.
- `request.dehydrate({ response?, override? })` - hydration payload for SSR, see the cache reference.
- `request.abort()` - aborts in-flight requests with the same scoped `abortKey`.
- `request.setScope(id)` - prefixes cache, queue and abort keys with `id__`; required for caching in server mode.
- `request.setUsed(true)` - marks an intentional resend: never deduplicated against an in-flight twin.
- `request.requestOptions` - the original options (template endpoint, etc.), handy in plugins and key mappers.
