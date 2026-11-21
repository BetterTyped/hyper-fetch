# Socket adapters

`@hyper-fetch/sockets` ships two adapters: `WebsocketAdapter` (default) and `ServerSentEventsAdapter`. Firebase
Firestore and Realtime Database adapters live in `@hyper-fetch/firebase` / `@hyper-fetch/firebase-admin` (see the
`hyper-fetch-firebase` and `hyper-fetch-firebase-admin` skills). Anything else is a custom `SocketAdapter`.

Pass an adapter instance (or a factory) to the socket; the socket type follows it:

```ts
import { createSocketClient, ServerSentEventsAdapter, WebsocketAdapter } from "@hyper-fetch/sockets";

export const ws = createSocketClient({ url: "wss://api.example.com/ws", adapter: WebsocketAdapter() });
export const sse = createSocketClient({ url: "https://api.example.com/events", adapter: ServerSentEventsAdapter() });
```

Both built-in adapters use the global `WebSocket` (browsers, Node.js 22+, Bun, Deno) and `EventSource` (browsers, Bun,
Deno). Where there is none, pass the class in `adapterOptions` (`{ WebSocket }` from `ws`, `{ EventSource }` from
`eventsource`), otherwise every attempt fails with an "... is not available in this environment" error reported through
`onError`. Both reconnect through the shared engine described in `connection-reconnect-auth.md`.

## WebsocketAdapter

`extra` in listener callbacks: the raw `MessageEvent`. Listener and emitter options: none.

| `adapterOptions`   | Default                                    | Notes                                                                            |
| ------------------ | ------------------------------------------ | -------------------------------------------------------------------------------- |
| `autoConnect`      | `true`                                     | Connect on creation. Only the first connection depends on it.                    |
| `WebSocket`        | global `WebSocket`                         | The constructor to use, e.g. from `ws` in Node.js before 22.                     |
| `protocols`        | -                                          | `string \| string[]` for the `WebSocket` constructor (`Sec-WebSocket-Protocol`). |
| `heartbeat`        | `false`                                    | Ping after `pingTimeout` of silence, expect any frame within `pongTimeout`.      |
| `pingTimeout`      | `5000`                                     | ms.                                                                              |
| `pongTimeout`      | `5000`                                     | ms.                                                                              |
| `heartbeatMessage` | `"heartbeat"`                              | Payload of the ping, sent on topic `"heartbeat"`.                                |
| `decode`           | JSON `{ topic, data }`                     | `(event: MessageEvent) => { topic, data } \| null`. `null` ignores the frame.    |
| `encode`           | `JSON.stringify({ topic, data: payload })` | `({ topic, payload }) => string \| ArrayBufferLike \| Blob \| ArrayBufferView`.  |

Errors thrown by `decode` / `encode` are reported through `onError` (and the emitter error event for `encode`); they
never break the connection.

### Mapping a non-HyperFetch protocol

```ts
type ServerFrame = { type: string; payload: unknown } | { type: "pong" };

export const appSocket = createSocketClient({
  url: "wss://example.com/ws",
  adapterOptions: {
    decode: (event) => {
      const frame = JSON.parse(event.data as string) as ServerFrame;
      if (frame.type === "pong" || !("payload" in frame)) return null;
      return { topic: frame.type, data: frame.payload };
    },
    encode: ({ topic, payload }) => JSON.stringify({ type: topic, payload }),
  },
});
```

The decoded `topic` must equal the listener's resolved topic exactly.

## ServerSentEventsAdapter

Receive-only. `emit()` throws "Cannot emit events in SSE adapter" synchronously. `extra`: the raw `MessageEvent`.

| `adapterOptions`  | Default                | Notes                                                                     |
| ----------------- | ---------------------- | ------------------------------------------------------------------------- |
| `autoConnect`     | `true`                 | Connect on creation. Only the first connection depends on it.             |
| `EventSource`     | global `EventSource`   | The constructor to use, e.g. from the `eventsource` package in Node.js.   |
| `eventSourceInit` | -                      | Passed to `new EventSource(url, init)`, e.g. `{ withCredentials: true }`. |
| `decode`          | JSON `{ topic, data }` | Same contract as WebSocket.                                               |

Unnamed messages (the default `message` event) are decoded as `{ topic, data }` JSON, or with your `decode`. Named
events (`event: price`) reach the listeners of the topic with that name: their data is parsed as JSON when it is JSON
and passed as a string otherwise, or mapped by `decode`.

```ts
type Price = { symbol: string; value: number };

export const prices = createSocketClient({
  url: "https://api.example.com/stream",
  adapter: ServerSentEventsAdapter(),
  adapterOptions: {
    eventSourceInit: { withCredentials: true },
    decode: (event) => ({ topic: "prices", data: JSON.parse(event.data as string) }),
  },
});

export const onPrice = prices.createListener<Price>()({ topic: "prices" });
```

## Custom adapter

Build one with `new SocketAdapter<Extra, AdapterOptions, ListenerOptions, EmitterOptions, QueryParams>({ name })` and
`setConnector(bindings => ...)`. Hand the bindings to `createReconnectingConnection` and describe only the transport:
the engine owns one attempt at a time, `connectionTimeout`, backoff with jitter, `shouldReconnect`, offline and focus
handling, and closing on purpose, exactly like the built-in adapters.

```ts
import {
  SocketAdapter,
  createReconnectingConnection,
  defaultShouldReconnect,
  getSocketUrl,
} from "@hyper-fetch/sockets";

type Transport = {
  send: (frame: string) => void;
  close: () => void;
  on: (event: "open" | "close" | "message", cb: (payload: any) => void) => void;
};
declare function openTransport(url: string): Transport;

export const MyAdapter = () =>
  new SocketAdapter<undefined, { autoConnect?: boolean }>({ name: "my-transport" }).setConnector((bindings) => {
    let transport: Transport | null = null;

    const connection = createReconnectingConnection({
      bindings,
      autoConnect: bindings.adapter.adapterOptions?.autoConnect ?? true,
      // Protocol close codes that retrying can't fix. The socket's own shouldReconnect wins over this
      shouldReconnect: (loss) => defaultShouldReconnect(loss) && loss.code !== 4401,
      open: (attempt) => {
        const url = getSocketUrl(attempt.connection.url, bindings.getQueryParams(attempt.connection.queryParams));
        const current = openTransport(url);
        transport = current;

        current.on("open", () => attempt.ready());
        current.on("close", ({ code, reason }) => attempt.lost({ code, reason }));
        current.on("message", ({ topic, data }) => {
          if (attempt.isCurrent()) bindings.onEvent({ topic, data, extra: undefined });
        });

        return {
          close: () => {
            if (transport === current) transport = null;
            current.close();
          },
        };
      },
    });

    // connection has connect, reconnect, disconnect and dispose
    return {
      ...connection,
      listen: (listener, callback) => bindings.onListen({ listener, callback }),
      emit: async (emitter) => {
        const prepared = await bindings.onEmit({ emitter });
        if (!prepared) return;
        transport?.send(JSON.stringify({ topic: prepared.topic, data: prepared.payload }));
      },
    };
  });
```

The attempt handle given to `open`:

| Member          | Call it                                                                                                  |
| --------------- | -------------------------------------------------------------------------------------------------------- |
| `connection`    | Read it: `{ url, queryParams, adapterOptions }` after the `onConnect` interceptors.                      |
| `ready()`       | Once the transport can carry messages - on open, or after the handshake of a protocol that has one.      |
| `lost(loss)`    | When the transport is gone, with `{ code, reason, error }`. The engine closes it and plans the next try. |
| `interrupted()` | For a transport that reconnects by itself (`EventSource`). `ready()` brings it back, else the timeout.   |
| `isCurrent()`   | In your own handlers: `false` once the attempt was replaced, timed out or closed.                        |

Return `null` from `open` when the transport can't be created, after reporting it with
`bindings.onConnectFailed({ error })`. No retry follows. `dispose` (on the returned connection) removes the app manager
listeners and timers; returning it from the connector makes it run on `socket.destroy()`.

Other bindings:

| Binding                                                 | Call it                                                                                            |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `onListen({ listener, callback, onUnmount })`           | From `listen`; returns the remover.                                                                |
| `onEmit({ emitter })`                                   | From `emit`; maps the payload and runs `onSend`, returns the emitter or `null` (already reported). |
| `onEmitError({ emitter, error })`, `onError({ error })` | Report failures.                                                                                   |
| `onEvent({ topic, data, extra, callbacks? })`           | For every incoming message; runs `onMessage` and dispatches to listeners (or only `callbacks`).    |
| `onListenerStart(...)`, `onListenerEnd(...)`            | With `confirmsSubscriptions: true`, when the server confirms or ends a subscription.               |
| `getQueryParams(queryParams)`                           | Stringify query params with the adapter mapper.                                                    |

For subscriptions with a payload per listener (tRPC, oRPC, GraphQL style), and full reference implementations, read
`packages/sockets/src/adapter-websockets/websocket-adapter.ts` and `packages/adapter-trpc/src/socket` in the
[hyper-fetch repository](https://github.com/BetterTyped/hyper-fetch), and the
[custom adapter docs](https://hyperfetch.bettertyped.com/docs/sockets/adapter).
