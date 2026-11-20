---
name: hyper-fetch-axios
description:
  Axios adapter for HyperFetch (`@hyper-fetch/axios`). Swaps the built-in fetch transport of `@hyper-fetch/core` for
  axios while keeping typed requests, cache, queueing, retries, offline and React hooks. Use when the user installs or
  configures `@hyper-fetch/axios`, imports `AxiosAdapter`, calls `client.setAdapter(AxiosAdapter)`, wants to reuse
  existing axios interceptors, `axios.defaults`, `transformResponse`, `responseType`, `auth`, `proxy`, `httpsAgent` or
  `withCredentials` with HyperFetch, needs real incremental upload progress (`onUploadProgress`,
  `onSubmitUploadProgress`), passes axios options through `options` / `setOptions` / `setAdapterDefaults`, handles
  `AxiosError` / `isAxiosError` in HyperFetch responses, or asks "axios vs fetch adapter", "migrate from axios to
  HyperFetch" or why an axios timeout, header or param is ignored.
---

# HyperFetch Axios adapter

`@hyper-fetch/axios` exports `AxiosAdapter`, a ready-made adapter **instance** that performs every request with the
default `axios` export. Everything above the transport (requests, cache, dispatchers, retries, deduplication, React
hooks) is plain `@hyper-fetch/core`. Only the wire call changes: core builds the URL, headers, query string and payload,
then hands them to `axios({...})`. Adapter options are the axios request config (`AxiosRequestConfig` minus the fields
HyperFetch owns).

For requests, cache, SDKs and interceptors read the `hyper-fetch-core` skill. For hooks read `hyper-fetch-react`.

## Install and set up

```bash
npm install @hyper-fetch/core @hyper-fetch/axios axios
```

`axios` and `@hyper-fetch/core` are peer dependencies, install both.

```ts
import { createClient } from "@hyper-fetch/core";
import { AxiosAdapter } from "@hyper-fetch/axios";

export const client = createClient({ url: "https://api.example.com" }).setAdapter(AxiosAdapter);
```

`AxiosAdapter` is an object, not a factory: pass it without parentheses. Every request created from this client now
accepts axios options.

```ts
type User = { id: number; name: string };

export const getUser = client.createRequest<{ response: User }>()({
  endpoint: "/users/:userId",
  options: { timeout: 5000, withCredentials: true },
});

const { data, error, status, extra } = await getUser.setParams({ userId: 1 }).send();
// extra.headers holds the axios response headers
```

## When to choose it over the default adapter

| Need                                                                       | Pick                             |
| -------------------------------------------------------------------------- | -------------------------------- |
| Existing axios setup: global interceptors, `axios.defaults`, transforms    | `AxiosAdapter`                   |
| Incremental upload progress in the browser (axios uses XHR)                | `AxiosAdapter`                   |
| Node-only axios options: `proxy`, `httpAgent`/`httpsAgent`, `maxRedirects` | `AxiosAdapter`                   |
| Smallest bundle, no extra dependency, a default 5 s timeout                | Default `HttpAdapter` (no setup) |
| Streaming response bodies                                                  | Default `HttpAdapter`            |
| Per-client axios instances (`axios.create()`)                              | Not supported, see pitfalls      |

The default `HttpAdapter` reports upload progress as a single event once the body is handed to `fetch`. With
`AxiosAdapter` you get every axios `onUploadProgress` event.

## Golden rules

1. **Configure the transport through HyperFetch, not through axios fields it owns.** The adapter always sets `url`,
   `baseURL`, `method`, `data`, `headers`, `signal`, `onUploadProgress` and `onDownloadProgress`. `url`, `baseURL`,
   `method`, `data` and the progress callbacks are removed from the option type. `headers` and `signal` are not removed
   from the type, but a value you pass is overwritten. Use the request `headers`, `payload`, `method`, `abort()` and the
   `send()` progress callbacks instead.
2. **Set a timeout yourself.** The default `HttpAdapter` times out after 5 seconds. `AxiosAdapter` adds no timeout, so
   axios waits forever unless you pass `timeout`. Set it once with `setAdapterDefaults` (below).
3. **Send query params with `queryParams`, never axios `params`.** Core already appends the encoded query string
   (`?page=2&tags[]=a&tags[]=b`) to the URL. Axios `params` would be appended a second time.
4. **Turn on deduplication for GETs if you relied on it.** The default `HttpAdapter` deduplicates `GET` requests.
   `AxiosAdapter` sets no request defaults, so `deduplicate` is `false` unless you set it.
5. **Do not change `validateStatus`.** The adapter treats a resolved axios call as success and a rejected one as
   failure. `validateStatus: () => true` makes `404` and `500` responses resolve with `success: true`.
6. **Remember the adapter is a shared singleton.** `AxiosAdapter.setAdapterDefaults(...)` and other setters mutate the
   one exported instance, so they apply to every client that uses it.

## Core patterns

### Global axios defaults for every request

`setAdapterDefaults` runs per request and its result is shallow-merged under the request `options` (request options
win).

```ts
import { createClient } from "@hyper-fetch/core";
import { AxiosAdapter } from "@hyper-fetch/axios";

export const client = createClient({ url: "https://api.example.com" }).setAdapter(
  AxiosAdapter.setAdapterDefaults(() => ({ timeout: 5000 })).setRequestDefaults((options) =>
    (options.method ?? "GET") === "GET" ? { deduplicate: true } : {},
  ),
);
```

`setRequestDefaults` restores the default adapter's GET deduplication. Explicit request options still win.

### Per-request axios options

```ts
const downloadReport = client.createRequest<{ response: Blob }>()({
  endpoint: "/reports/:reportId",
  options: { responseType: "blob", timeout: 30000 },
});

// setOptions replaces the whole options object on the returned clone
const slowReport = downloadReport.setOptions({ responseType: "blob", timeout: 120000 });
```

Options such as `transformResponse`, `responseType`, `auth`, `withCredentials`, `maxContentLength`, `proxy`, `httpAgent`
and `httpsAgent` are passed straight to axios.

### Upload and download progress

```ts
const uploadAvatar = client.createRequest<{ response: { url: string }; payload: FormData }>()({
  endpoint: "/avatar",
  method: "POST",
});

const form = new FormData();
form.append("file", file);

await uploadAvatar.send({
  payload: form,
  onUploadProgress: ({ progress, loaded, total }) => console.log(progress, loaded, total),
  onDownloadProgress: ({ progress }) => console.log(progress),
});
```

In React, `useSubmit` exposes the same events as `onSubmitUploadProgress` and `onSubmitDownloadProgress` (see
`hyper-fetch-react`). `FormData`, `Blob` and other binary payloads are passed to axios untouched. Plain objects are
JSON-stringified by core and sent with `Content-Type: application/json`.

### Handling errors

`send()` resolves, it never rejects. HTTP errors and network failures carry the `AxiosError` in `error`. Aborts come
back as HyperFetch errors, which are plain `Error`s. The default global error type is `Error`, and `AxiosError` extends
it, so narrow with `isAxiosError`:

```ts
import { isAxiosError } from "axios";

const { data, error, status, extra } = await getUser.setParams({ userId: 1 }).send();

if (isAxiosError<{ message: string }>(error)) {
  error.response?.data?.message; // server body of a 4xx/5xx
  error.code; // "ECONNABORTED" when the axios `timeout` runs out
}
```

| Situation                   | `status`  | `error`                               | `extra.headers`  |
| --------------------------- | --------- | ------------------------------------- | ---------------- |
| 2xx                         | real code | `null`                                | response headers |
| 4xx / 5xx                   | real code | `AxiosError`, body in `response.data` | response headers |
| Connection broken, no reply | `0`       | `AxiosError` (`Error` instance)       | `{}`             |
| axios `timeout` reached     | `0`       | `AxiosError`, `code: "ECONNABORTED"`  | `{}`             |
| `request.abort()`           | `0`       | HyperFetch abort error                | `{}`             |

Failed requests are retried by HyperFetch (`retry`, `retryTime`) like with any adapter. Aborted requests are never
retried.

### Auth and interceptors

The adapter calls the default `axios` export, so interceptors and defaults registered on it apply to HyperFetch traffic:

```ts
import axios from "axios";

axios.interceptors.response.use(undefined, (error) => {
  reportToMonitoring(error);
  return Promise.reject(error);
});
```

Order for one attempt: HyperFetch `onRequest`, then `onAuth` interceptors, then axios request interceptors, the network
call, axios response interceptors, and last HyperFetch `onError` / `onSuccess` / `onResponse` interceptors.

Prefer HyperFetch interceptors for new code. `onAuth` runs only for requests with `auth: true` (the default) and works
with any adapter, so the code survives a later adapter switch:

```ts
client.onAuth((request) => request.setHeaders({ ...request.headers, Authorization: `Bearer ${getToken()}` }));
```

An axios response interceptor that turns a rejected error into a resolved value makes the adapter report success with
that value's status. Do not recover errors there, use HyperFetch `onError` or `retry` instead.

## Type safety

`setAdapter(AxiosAdapter)` returns a `Client<Error, AxiosAdapterType>`, and every request created from it reads its
adapter types from that client:

| Slot      | Type with `AxiosAdapter`                                                                                           |
| --------- | ------------------------------------------------------------------------------------------------------------------ |
| `options` | `Omit<AxiosRequestConfig, "url" \| "baseURL" \| "method" \| "onUploadProgress" \| "onDownloadProgress" \| "data">` |
| `method`  | axios `Method` (`"GET"`, `"get"`, `"PATCH"`, ...). Prefer uppercase                                                |
| `status`  | `number` (`0` for system errors)                                                                                   |
| `extra`   | `AxiosExtra` (`{ headers }`, the axios response headers)                                                           |
| `error`   | the client's global error, `Error` by default                                                                      |

Read them with core helpers: `ExtractAdapterOptionsType<AxiosAdapterType>`, `ExtractAdapterExtraType<...>`,
`ExtractAdapterMethodType<...>`. Response, payload, params and query params are typed per request exactly as in core
(`createRequest<{ response; payload; queryParams; error }>()`, params from `:param` in `endpoint`).

What the compiler rejects:

```ts
// @ts-expect-error not an axios method
client.createRequest()({ endpoint: "/a", method: "FETCH" });
// @ts-expect-error `data` belongs to HyperFetch, send a `payload`
client.createRequest()({ endpoint: "/a", options: { data: { a: 1 } } });
// @ts-expect-error `onUploadProgress` belongs to HyperFetch, pass it to send()
client.createRequest()({ endpoint: "/a", options: { onUploadProgress: () => {} } });
// @ts-expect-error `responseType` is checked against axios values
client.createRequest()({ endpoint: "/a", options: { responseType: "xml" } });

const res = await getUser.setParams({ userId: 1 }).send();
// @ts-expect-error `error` is `Error | null`, axios fields need narrowing first
res.error?.response;
```

`headers` and `signal` still compile inside `options` but are overwritten at runtime (rule 1).

Error typing: the adapter does not change the error type. Do not declare `createClient<{ error: AxiosError }>` (aborts
are not `AxiosError`s) and do not put the server body in a request's `error` generic (the error is always the
`AxiosError`, the body is in `error.response.data`). Type the body at the narrowing site with
`isAxiosError<Body>(error)`, or declare the honest union `createClient<{ error: AxiosError<Body> | Error }>`.

## Pitfalls

| Symptom                                               | Cause                                              | Fix                                                      |
| ----------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------- |
| `setAdapter(AxiosAdapter())` fails to compile         | `AxiosAdapter` is an instance                      | `setAdapter(AxiosAdapter)`                               |
| `AxiosAdapter({ instance })` from an old README fails | No instance option exists                          | Configure the default `axios` export or use `onAuth`     |
| `axios.create()` interceptors never run               | The adapter always uses the default `axios` export | Register them on `axios` itself, or move to HyperFetch   |
| `headers` in `options` are missing on the wire        | The adapter overwrites `headers`                   | Request `headers`, `setHeaders`, or `onAuth`/`onRequest` |
| Query string is duplicated                            | Axios `params` plus HyperFetch `queryParams`       | Use only `queryParams` / `setQueryParams`                |
| Requests hang forever                                 | No timeout by default                              | `options.timeout` or `setAdapterDefaults`                |
| Two identical GETs hit the server                     | No GET deduplication by default                    | `deduplicate: true` or `setRequestDefaults`              |
| `transformRequest` receives a string                  | Core JSON-stringifies object payloads first        | Transform in `setRequestMapper` or `setPayloadMapper`    |
| 404 counted as success                                | Custom `validateStatus`                            | Remove it                                                |

## Testing

`createHttpMockingServer` from `@hyper-fetch/testing` intercepts axios traffic (it uses msw), and `request.setMock(...)`
skips the transport entirely. Both work unchanged with `AxiosAdapter`. See the `hyper-fetch-testing` skill.

```ts
import { createHttpMockingServer } from "@hyper-fetch/testing";

const { startServer, stopServer, resetMocks, mockRequest } = createHttpMockingServer();

mockRequest(getUser, { status: 400 });
const { error, status } = await getUser.setParams({ userId: 1 }).send();
// status 400, error is an AxiosError with message "Request failed with status code 400"
```

## Links

- Docs: https://hyperfetch.bettertyped.com/docs/integrations/adapter-axios/overview
- Axios request config: https://axios-http.com/docs/req_config
- Related skills: `hyper-fetch-core` (client, requests, interceptors, retries), `hyper-fetch-react` (hooks),
  `hyper-fetch-testing` (mocking).
