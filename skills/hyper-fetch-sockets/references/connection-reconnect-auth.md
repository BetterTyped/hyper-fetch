# Connection, reconnection and authentication

## Socket options

| Option              | Type                                           | Default              | Notes                                                                                  |
| ------------------- | ---------------------------------------------- | -------------------- | -------------------------------------------------------------------------------------- |
| `url`               | `string`                                       | required             | Connection URL. For Firebase adapters it is the path prefix.                           |
| `adapter`           | adapter instance or `() => adapter`            | `WebsocketAdapter()` | Changes the socket type (`Socket<Adapter>`).                                           |
| `adapterOptions`    | adapter options                                | -                    | Merged into the adapter options on initialization.                                     |
| `queryParams`       | object or string                               | -                    | Appended to the URL (`?a=1&b=2`, arrays supported by the core stringifier).            |
| `reconnect`         | `number`                                       | `Infinity`           | Reconnection attempts before the socket gives up.                                      |
| `reconnectTime`     | `number`                                       | `1000`               | Minimum delay in ms before an attempt. The backoff grows from it.                      |
| `maxReconnectTime`  | `number`                                       | `30000`              | Maximum delay in ms before an attempt.                                                 |
| `minUptime`         | `number`                                       | `5000`               | How long in ms a connection must stay up before the attempt counter resets.            |
| `connectionTimeout` | `number`                                       | `5000`               | How long in ms one attempt may take until the connection is ready, handshake included. |
| `reconnectDelay`    | `({ attempt, elapsed, reason }) => ms \| null` | jittered backoff     | Replaces the backoff. `null` stops reconnecting.                                       |
| `shouldReconnect`   | `({ code, reason, error }) => boolean`         | `1000` stays closed  | Decides which lost connections are retried. The client's own closes never are.         |
| `appManager`        | `() => AppManager`                             | browser `AppManager` | Online/offline and focus source (React Native, Node).                                  |

## Methods

| Method                                 | Behavior                                                                                                                                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `connect()`                            | Opens a connection; the promise settles when the attempt finishes (check `socket.adapter.connected`). No-op when connected. Concurrent calls join the attempt in progress. Skipped while offline. |
| `disconnect()`                         | Closes with code `1000` and marks the socket as closed on purpose: no automatic reconnect, no reconnect on going online.                                                                          |
| `reconnect()`                          | Replaces the connection with a new one right away. Works after a manual `disconnect()` and after the automatic attempts ran out; the `reconnect` limit never refuses it.                          |
| `destroy()`                            | Closes the connection and stops following the network and focus. A destroyed socket never connects again.                                                                                         |
| `setUrl(url)`                          | Used by the next attempt. Call `reconnect()` to apply to a live connection.                                                                                                                       |
| `setQueryParams(params)`               | Replaces default query params for the next attempt. Call `reconnect()` to apply.                                                                                                                  |
| `setDebug(true)`, `setLogLevel(level)` | Logging.                                                                                                                                                                                          |

State lives on the adapter: `socket.adapter.connected`, `socket.adapter.connecting`,
`socket.adapter.reconnectionAttempts`, `socket.adapter.forceClosed` (true after manual `disconnect()`).

## Automatic reconnection

The WebSocket, SSE, tRPC, oRPC and GraphQL socket adapters share one reconnection engine:

1. A connection is lost: the transport closes with a code other than `1000`, errors, is not ready within
   `connectionTimeout`, or the heartbeat times out. A normal closure (`1000`) from the server stays closed, and so does
   every close the client started (`disconnect()`, `destroy()`). `shouldReconnect` overrides which losses are retried.
2. The next attempt waits
   `reconnectTime + random(0, min(maxReconnectTime - reconnectTime, reconnectTime * 2 ** attempt))` ms, `attempt`
   counting from 0 within the outage. The jitter spreads the clients of a restarted server. `reconnectDelay` replaces
   this formula.
3. Each attempt fires `onReconnect` and `socket.events.onReconnecting({ attempts })`. When `reconnect` attempts ran out
   (or `reconnectDelay` returned `null`), `onReconnectFailed` and `onReconnectingFailed({ attempts })` fire and the
   socket stops until `connect()` or `reconnect()`.
4. The attempt counter resets only after a connection stayed ready for `minUptime`. A server that accepts and then
   closes at once (an expired token, a crash loop) keeps backing off and counts towards `reconnect`.
5. Offline drops the transport at once and counts no attempts. Online connects immediately. Focus skips the rest of a
   pending delay.

SSE: the browser `EventSource` also retries on its own. The socket reports itself as connecting while it does, and
`connectionTimeout` replaces the stream if it does not come back in time.

```ts
import { createSocketClient, defaultShouldReconnect } from "@hyper-fetch/sockets";

export const socket = createSocketClient({
  url: "wss://api.example.com/ws",
  reconnect: 10,
  // Retry quickly a few times, then every 10 seconds, and give up after 5 minutes
  reconnectDelay: ({ attempt, elapsed }) => {
    if (elapsed > 5 * 60_000) return null;
    return attempt < 3 ? 500 : 10_000;
  },
  // A rejected token won't get better by retrying
  shouldReconnect: (loss) => defaultShouldReconnect(loss) && loss.code !== 4401,
})
  .onReconnect(() => console.log("reconnecting"))
  .onReconnectFailed(() => console.error("giving up - show a retry button that calls socket.reconnect()"));
```

## Lazy connection

```ts
export const lazySocket = createSocketClient({
  url: "wss://api.example.com/ws",
  adapterOptions: { autoConnect: false },
});

// later, e.g. after login
await lazySocket.connect();
```

`autoConnect` only decides the first connection. Until `connect()` is called, a lazy socket stays closed, also when the
app comes back online. Once connected it recovers like any other socket, until `disconnect()`.

## onConnect - prepare every attempt

`onConnect(({ connection, attempt }) => connection | Promise<connection>)` receives
`{ url, queryParams, adapterOptions }` and the attempt number (`0` fresh, `n` for the n-th reconnection). Interceptors
run in registration order, each gets the previous one's output. Return the connection, modified or not.

```ts
declare const authStore: { getState: () => { accessToken: string | null } };
declare function refreshAccessToken(): Promise<string>;

export const appSocket = createSocketClient({ url: "wss://api.example.com/ws" }).onConnect(
  async ({ connection, attempt }) => {
    const current = authStore.getState().accessToken;
    // Refresh on reconnects - the previous close may have been an auth rejection
    const token = attempt > 0 || !current ? await refreshAccessToken() : current;
    return { ...connection, queryParams: { token } };
  },
);
```

- Register it in the same synchronous chain as the socket creation so the automatic first attempt uses it.
- A token refreshed while connected does not force a reconnect; the next attempt reads the new value. Call
  `socket.reconnect()` to apply immediately (for example after re-login or tenant switch).
- If an interceptor throws or rejects, the attempt fails with `onError` and the socket does not retry by itself.
- A `disconnect()` during an async interceptor cancels the attempt.

Auth placement options:

| Server reads credentials from   | Return from `onConnect`                                                                             |
| ------------------------------- | --------------------------------------------------------------------------------------------------- |
| URL query (`?token=`)           | `{ ...connection, queryParams: { token } }`                                                         |
| `Sec-WebSocket-Protocol` header | `{ ...connection, adapterOptions: { ...connection.adapterOptions, protocols: ["bearer", token] } }` |
| Cookies (same site)             | nothing; for SSE set `adapterOptions: { eventSourceInit: { withCredentials: true } }`               |
| A first "auth" message          | emit it in `onConnected` (the socket is open then)                                                  |

Browsers cannot set custom headers on `WebSocket` or `EventSource`; do not look for a `headers` option.

Logout: `await socket.disconnect()` (stays closed). Login as another user: update the store, then `socket.reconnect()`.

## Heartbeat (WebSocket)

```ts
export const liveSocket = createSocketClient({
  url: "wss://api.example.com/ws",
  adapterOptions: {
    heartbeat: true,
    pingTimeout: 10000, // idle time before sending a ping, default 5000
    pongTimeout: 5000, // time to wait for any frame after the ping, default 5000
    heartbeatMessage: "ping", // default "heartbeat"
  },
});
```

The ping is sent as an emit on topic `"heartbeat"` through `encode` (default `{"topic":"heartbeat","data":"ping"}`). Any
incoming frame resets the timer, so the server only has to send something back. On timeout the socket is marked
disconnected immediately, `onError` fires and a reconnect is scheduled.

## Offline handling

Every socket has `socket.appManager`. In the browser it follows `navigator.onLine`, the `online` / `offline` window
events and the page visibility. Going offline closes the connection at once (a connection on a dead network can hang for
minutes otherwise), no attempts run or count while offline, and coming back online connects immediately. Regaining focus
skips the rest of a pending reconnection delay. This applies to every socket that should be connected, from its first
connection until `disconnect()`. In React Native or Node pass your own app manager, and return a cleanup function from
`onlineEvent` so `socket.appManager.unmount()` can remove the listener:

```ts
import { AppManager } from "@hyper-fetch/core";
import { Socket } from "@hyper-fetch/sockets";

declare const NetInfo: {
  fetch: () => Promise<{ isConnected: boolean | null }>;
  addEventListener: (cb: (state: { isConnected: boolean | null }) => void) => () => void;
};

export const nativeSocket = new Socket({
  url: "wss://api.example.com/ws",
  appManager: () =>
    new AppManager({
      initiallyOnline: async () => Boolean((await NetInfo.fetch()).isConnected),
      onlineEvent: (setOnline) => NetInfo.addEventListener((state) => setOnline(Boolean(state.isConnected))),
    }),
});
```

## Debugging connection state

- `socket.setDebug(true)` logs connection, message and emit events.
- `socket.events.onConnecting(({ connecting }) => ...)` and `onError(({ error }) => ...)` explain stuck states. Close
  codes are translated into readable messages (1006 abnormal closure, 1008 policy violation, 1011 server error, ...).
- "Cannot emit event when connection is not open" means an emit happened before open, while reconnecting or after
  `disconnect()`.
- "WebSocket is not available in this environment" / "EventSource is not available in this environment": the runtime has
  no global `WebSocket` (Node.js before 22) or `EventSource` (Node.js). Pass the class in `adapterOptions`:
  `{ WebSocket }` from `ws` or `{ EventSource }` from `eventsource`.
