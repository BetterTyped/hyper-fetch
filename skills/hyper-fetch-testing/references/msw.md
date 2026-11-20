# MSW (Mock Service Worker) with HyperFetch

`setMock` replaces the adapter, so it never runs the HTTP adapter itself: URL building, query string encoding, headers,
auth interceptors, payload serialization and response parsing are skipped. When a test must cover those, mock at the
network level with MSW. The built-in HTTP adapter uses the global `fetch`, which `msw/node` intercepts.

## Choose

| Test target                                                 | Mock with                   |
| ----------------------------------------------------------- | --------------------------- |
| Component state, hook behavior, business logic              | `setMock` / `$configure`    |
| Loading, ordering, abort, progress, timeouts of the mocker  | `setMock` (gated or config) |
| Headers, auth tokens, `onRequest` / `onAuth` interceptors   | MSW                         |
| Query string and URL format, payload serialization          | MSW                         |
| Error body parsing from a real `Response`, network failures | MSW                         |
| Shared mocks with Storybook or the browser dev server       | MSW                         |

Do not mix both on one request in a test: an enabled `setMock` wins and MSW never sees the call. If request definitions
ship with development mocks, call `client.setEnableGlobalMocking(false)` in the MSW suite.

## Setup

```ts
// test/msw.ts
import { setupServer } from "msw/node";

export const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

`onUnhandledRequest: "error"` turns a forgotten handler into a visible failure instead of a hang or a real network call.

## Handlers built from request definitions

Build handler URLs from the client and the request, so they follow endpoint changes:

```ts
import { http, HttpResponse } from "msw";
import { client, getUsers } from "src/api/client";
import { server } from "test/msw";

beforeEach(() => client.clear());

it("sends query params and parses the response", async () => {
  let url = "";
  server.use(
    http.get(`${client.url}${getUsers.endpoint}`, ({ request }) => {
      url = request.url;
      return HttpResponse.json([{ id: 1, name: "John" }]);
    }),
  );

  const response = await getUsers.send({ queryParams: { page: 2 } });

  expect(url).toBe("http://localhost:3000/users?page=2");
  expect(response.data).toEqual([{ id: 1, name: "John" }]);
  expect(response.extra?.headers["content-type"]).toBe("application/json");
});
```

- The adapter requests `${client.url}${endpoint}${queryString}`. MSW path matching ignores the query string, so match on
  the path and assert `request.url` for query params.
- For endpoints with params (`/users/:userId`), MSW uses the same `:param` syntax:
  `http.get(\`${client.url}/users/:userId\`, ({ params }) => ...)`.
- The client URL must be **absolute** (`http://localhost:3000`). Node `fetch` rejects relative URLs.

## Outcomes as the HTTP adapter reports them

| Handler                                                       | Response                                                         |
| ------------------------------------------------------------- | ---------------------------------------------------------------- |
| `HttpResponse.json(data)`                                     | `success: true`, `status: 200`, parsed `data`                    |
| `HttpResponse.json({ message: "Nope" }, { status: 404 })`     | `success: false`, `status: 404`, `error` is the parsed body      |
| `HttpResponse.error()`                                        | `success: false`, `status: 0`, network error (`Failed to fetch`) |
| `await delay(200)` with request `setOptions({ timeout: 50 })` | `success: false`, `status: 0`, `Request timeout`                 |

For timeouts, lower the request's `timeout` adapter option (default 5000 ms) instead of delaying the handler for
seconds.

## Asserting headers and payload

```ts
let authorization: string | null = null;
let body: unknown = null;

server.use(
  http.post(`${client.url}/users`, async ({ request }) => {
    authorization = request.headers.get("authorization");
    body = await request.json();
    return HttpResponse.json({ id: 2, name: "Jane" }, { status: 201 });
  }),
);

const response = await createUser.send({ payload: { name: "Jane" } });

expect(response.success).toBe(true);
expect(authorization).toBe("Bearer test-token");
expect(body).toEqual({ name: "Jane" });
```

Capture values in the handler and assert after `await send()`. An `expect` that throws inside a handler becomes a 500
response from MSW, which hides the real assertion message.

## Isolation

Reset both layers: `server.resetHandlers()` in `afterEach` and `client.clear()` in `beforeEach`. Without the second, a
cached response from a previous test can satisfy a `useFetch` before MSW is ever called, and deduplication can merge two
identical GETs into one network call.
