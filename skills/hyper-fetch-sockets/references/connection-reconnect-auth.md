# Connection, reconnection and authentication

## Socket options

| Option           | Type                                | Default              | Notes                                                                             |
| ---------------- | ----------------------------------- | -------------------- | --------------------------------------------------------------------------------- |
| `url`            | `string`                            | required             | Connection URL. For Firebase adapters it is the path prefix.                      |
| `adapter`        | adapter instance or `() => adapter` | `WebsocketAdapter()` | Changes the socket type (`Socket<Adapter>`).                                      |
| `adapterOptions` | adapter options                     | -                    | Merged into the adapter options on initialization.                                |
| `queryParams`    | object or string                    | -                    | Appended to the URL (`?a=1&b=2`, arrays supported by the core stringifier).       |
| `reconnect`      | `number`                            | `Infinity`           | Maximum reconnection attempts.                                                    |
| `reconnectTime`  | `number`                            | `5000`               | Delay before each reconnection attempt, and the time an attempt may take to open. |
| `appManager`     | `() => AppManager`                  | browser `AppManager` | Online/offline source (React Native, Node).                                       |

## Methods

| Method                                 | Behavior                                                                                                                                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `connect()`                            | Opens a connection; the promise settles when the attempt finishes (check `socket.adapter.connected`). No-op when connected. Concurrent calls join the attempt in progress. Skipped while offline. |
| `disconnect()`                         | Closes with code `1000` and marks the socket as closed on purpose: no automatic reconnect, no reconnect on going online.                                                                          |
| `reconnect()`                          | Closes the current transport and connects again, counting an attempt. Works after a manual `disconnect()`.                                                                                        |
| `setUrl(url)`                          | Used by the next attempt. Call `reconnect()` to apply to a live connection.                                                                                                                       |
| `setQueryParams(params)`               | Replaces default query params for the next attempt. Call `reconnect()` to apply.                                                                                                                  |
| `setDebug(true)`, `setLogLevel(level)` | Logging.                                                                                                                                                                                          |

State lives on the adapter: `socket.adapter.connected`, `socket.adapter.connecting`,
`socket.adapter.reconnectionAttempts`, `socket.adapter.forceClosed` (true after manual `disconnect()`).

## Automatic reconnection (WebSocket)

1. The transport closes with a code other than `1000`, an attempt does not open within `reconnectTime`, or the heartbeat
   times out.
2. After `reconnectTime` the socket calls `reconnect()`: `onReconnect` callbacks and
   `socket.events.onReconnecting({ attempts })` fire, then a new attempt starts while `attempts < reconnect`.
3. When attempts run out, `onReconnectFailed` and `onReconnectingFailed({ attempts })` fire and the socket stops.
4. A successful open resets the attempts counter to `0`.

SSE: the browser `EventSource` retries on its own; the socket marks itself disconnected when an open stream breaks and
the same `reconnectTime` timeout takes over if the stream does not come back.

```ts
import { createSocketClient } from "@hyper-fetch/sockets";

export const socket = createSocketClient({
  url: "wss://api.example.com/ws",
  reconnect: 5,
  reconnectTime: 3000,
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

With `autoConnect: false` the socket also does not reconnect on its own when the browser comes back online.

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

Every socket has `socket.appManager`. In the browser it follows `navigator.onLine` and the `online` / `offline` window
events: attempts are skipped while offline, and an `autoConnect` socket that was not disconnected on purpose connects
again when the app goes online. In React Native or Node pass your own:

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
- "WebSocket is not available in this environment" / "EventSource is not available in this environment": the code runs
  without `window` (SSR, Node, tests without jsdom).
