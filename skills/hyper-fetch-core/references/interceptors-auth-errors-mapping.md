# Interceptors, auth, errors and mapping

## Pipeline order

For every attempt (including retries), inside the adapter:

1. `client.onRequest(cb)` interceptors, in registration order, each receiving the previous result.
2. `client.onAuth(cb)` interceptors, only when `request.auth` is `true` (the default).
3. `request.setRequestMapper(fn)`.
4. Payload: `request.setPayloadMapper(fn)` if set, otherwise the adapter payload mapper (JSON for objects).
5. Adapter header, query params and endpoint mappers, then the fetcher (or the mock).
6. `client.onResponse(cb)` for every response, then `client.onSuccess(cb)` or `client.onError(cb)`.
7. Plugins `onRequestSuccess` / `onRequestError` / `onRequestFinished`.
8. Dispatcher: retry decision, cache write (the response from step 6), events.
9. `request.setResponseMapper(fn)` per delivery to `send()` callers, never stored in the cache.

Consequences:

- Response **interceptors** change what is cached and what every consumer of the key sees. Use them for cross-cutting
  normalization (unwrap an envelope, token refresh).
- Response **mappers** are local to one request (and its clones); several mapped requests share one cache entry.
- Interceptors must return the request/response; returning nothing fails the request.
- A throwing or rejecting interceptor, mapper or mock ends that request with `success: false` and the thrown value as
  `error`. `send()` still resolves.

## Request interceptors

```ts
client.onRequest((request) => request.setHeaders({ ...request.headers, "X-Request-Id": crypto.randomUUID() }));

const authInterceptor = (request: RequestInstance) => {
  const token = session.token;
  return token ? request.setHeaders({ ...request.headers, Authorization: `Bearer ${token}` }) : request;
};
client.onAuth(authInterceptor);
client.removeOnAuthInterceptors([authInterceptor]); // removal needs the same function reference
```

Removal methods: `removeOnRequestInterceptors`, `removeOnAuthInterceptors`, `removeOnResponseInterceptors`,
`removeOnSuccessInterceptors`, `removeOnErrorInterceptors`, each taking an array of the registered callbacks.

Per request: `disableRequestInterceptors: true` skips `onRequest` and `onAuth`, `disableResponseInterceptors: true`
skips `onResponse`, `onSuccess` and `onError`. `auth: false` skips only `onAuth`.

Interceptors can be async (read a token from secure storage, wait for a refresh). Keep them fast: they run on every
attempt of every request.

## Token refresh with a single in-flight refresh

```ts
let refreshing: Promise<string | null> | null = null;

const refreshAccessToken = () => {
  // Many requests can fail with 401 at once; share one refresh call
  refreshing ??= refreshToken
    .send({ payload: { refreshToken: session.refreshToken } })
    .then(({ data }) => {
      if (data) session.token = data.token;
      return data?.token ?? null;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
};

const refreshToken = client.createRequest<{ response: { token: string }; payload: { refreshToken: string } }>()({
  endpoint: "/auth/refresh",
  method: "POST",
  auth: false,
  disableResponseInterceptors: true, // a failing refresh must not trigger this interceptor again
});

client.onError(async (response, request) => {
  if (response.status !== 401 || request.used) return response;
  const token = await refreshAccessToken();
  if (!token) {
    session.logout();
    return response;
  }
  return request.setUsed(true).send(); // onAuth adds the new token on the resend
});
```

- `request.used` / `setUsed(true)` is the loop guard and also excludes the resend from deduplication against the
  original, which is still waiting for this interceptor.
- The original request of a `queued` queue holds that queue while the interceptor runs, so a `send()` resend would wait
  behind it forever. Resend queued requests with `request.setUsed(true).exec()`.
- Cookies (`httpOnly` sessions) need no interceptor. Use `setAdapterDefaults(() => ({ credentials: "include" }))` for
  cross-origin cookies.

## Error typing

```ts
type ApiError = { message: string; code: string };
const client = createClient<{ error: ApiError | Error }>({ url }); // global error, default is Error

const signUp = client.createRequest<{
  response: User;
  payload: SignUpInput;
  error: { fields: Record<string, string[]> }; // local error
}>()({ endpoint: "/sign-up", method: "POST" });

const { error } = await signUp.send({ payload });
// error: ApiError | { fields: ... } | null
if (error && "fields" in error) showFieldErrors(error.fields);
```

Runtime sources of `error`:

| Situation                                                                                                               | `status`                               | `error`                                                             |
| ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------- |
| Non-2xx response                                                                                                        | HTTP status                            | parsed JSON body, text body, or `UnexpectedError` for an empty body |
| Network failure (DNS, CORS, offline)                                                                                    | `0`                                    | the `TypeError` thrown by `fetch`                                   |
| Timeout (HTTP default 5000 ms)                                                                                          | `0`                                    | `TimeoutError` ("Request timeout")                                  |
| `request.abort()`, cancelable replacement, `client.setUrl(url, { abort: true })`                                        | `0`                                    | `AbortError` ("Request aborted")                                    |
| Removed from the queue before finishing (`dispatcher.delete`, cancelable replacing a waiting request, `client.clear()`) | `null`                                 | `DeletedError` ("Request deleted")                                  |
| Interceptor, request mapper or mock threw                                                                               | adapter `systemErrorStatus` (HTTP `0`) | the thrown value                                                    |
| Response mapper threw                                                                                                   | status of the response                 | the thrown value                                                    |
| Optimistic callback threw                                                                                               | `null`                                 | `Error("Optimistic callback failed: ...")`                          |

The error classes `TimeoutError`, `AbortError`, `DeletedError`, `RequestProcessingError` and `UnexpectedError` are
exported. Because system failures are `Error` instances while the declared global type describes your API body, handle
both:

```ts
const { error, status } = await getUser.send({ params: { userId } });
if (error instanceof Error) {
  showToast(status === 0 ? "Network problem, try again" : error.message);
} else if (error) {
  showToast(error.message); // ApiError
}
```

`client.adapter.setInternalErrorMapping((error) => mapped)` converts the errors created inside the pipeline (aborts and
thrown interceptors/mappers) into your shape; timeouts, network errors and removals still arrive as `Error` instances.

## Request mapper

`setRequestMapper((request, requestId) => newRequest)` runs after the interceptors, sync or async. Typical uses:
validation before sending, derived headers, signing.

```ts
const createPost = client
  .createRequest<{ response: Post; payload: PostInput }>()({ endpoint: "/posts", method: "POST" })
  .setRequestMapper((request) => {
    PostInputSchema.parse(request.payload); // throws -> request is not sent, error = ZodError
    return request.setHeaders({ ...request.headers, "X-Signature": sign(request.payload) });
  });
```

The payload lives in `request.payload` (there is no `request.data`).

## Payload mapper

`setPayloadMapper((payload) => body)` runs after the request mapper and **replaces** the adapter's JSON serialization,
so return the final body (`string`, `FormData`, `Blob`...).

```ts
const login = client
  .createRequest<{ response: Session; payload: { user: string; pass: string } }>()({
    endpoint: "/login",
    method: "POST",
  })
  .setHeaders({ "Content-Type": "application/x-www-form-urlencoded" })
  .setPayloadMapper((payload) => new URLSearchParams(payload).toString());
```

## Response mapper

```ts
const getUsers = client
  .createRequest<{ response: { items: ApiUser[]; total: number } }>()({ endpoint: "/users" })
  .setResponseMapper((response) => {
    if (!response.success) return response; // keep the error untouched
    return { ...response, data: response.data.items.map(toUser) };
  });
// typeof (await getUsers.send()).data === User[] | null
```

- It receives the whole response and must return a whole response (`ResponseSuccessType` or `ResponseErrorType`). The
  returned `data` and `error` types become the request's types.
- It may be async (enrich with another request) and may turn a success into a failure by returning
  `{ ...response, data: null, error, success: false }` or by throwing.
- It also runs for cached deliveries (`cachePolicy: "cache-first" | "revalidate"`) and in framework hooks, so keep it
  pure and cheap. `request.read()` returns the raw, unmapped entry.
- Validation: parse inside the mapper; a schema error becomes `error`.

```ts
const getUser = client
  .createRequest<{ response: unknown }>()({ endpoint: "/users/:userId" })
  .setResponseMapper((response) => {
    if (!response.success) return response;
    return { ...response, data: UserSchema.parse(response.data) }; // data typed by the schema
  });
```

## Adapter-level mappers (all requests of the client)

- `client.adapter.setHeaderMapper((request, config) => headers)` - replace header generation (default adds JSON content
  type for plain object payloads and drops `null`/`undefined` header values).
- `client.adapter.setPayloadMapper((payload, config) => body)` - replaces the JSON serialization for requests without
  their own payload mapper. `payload` is the raw request payload, typed `unknown`; `config` comes from
  `setPayloadMapperConfig(config)`.
- `client.adapter.setQueryParamsMapper((queryParams, config) => string)` and `setQueryParamsMapperConfig(config)`.
- `client.adapter.setEndpointMapper((endpoint, config) => string)`.
- Each has a matching `set*MapperConfig(config)` passed as the second argument.

Prefer interceptors for per-request logic that depends on app state, adapter mappers for wire-format concerns.
