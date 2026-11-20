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

Both built-in adapters require `window.WebSocket` / `window.EventSource`. Without them (SSR, plain Node) every attempt
fails with an "... is not available in this environment" error reported through `onError`.

## WebsocketAdapter

`extra` in listener callbacks: the raw `MessageEvent`. Listener and emitter options: none.

| `adapterOptions`   | Default                                    | Notes                                                                            |
| ------------------ | ------------------------------------------ | -------------------------------------------------------------------------------- |
| `autoConnect`      | `true`                                     | Connect on creation and when the app goes back online.                           |
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
| `autoConnect`     | `true`                 |                                                                           |
| `eventSourceInit` | -                      | Passed to `new EventSource(url, init)`, e.g. `{ withCredentials: true }`. |
| `decode`          | JSON `{ topic, data }` | Same contract as WebSocket.                                               |

Only unnamed SSE messages (the default `message` event) are dispatched. Send each event as
`data: {"topic":"x","data": ...}` or map your format with `decode`. Named events (`event: price`) are not routed to
listeners.

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
`setConnector(bindings => ({ connect, reconnect, disconnect, listen, emit }))`. Use the bindings so the socket state,
events and interceptors stay consistent:

| Binding                                                 | Call it                                                                                                                                   |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `onConnect()`                                           | At the start of every attempt. Resolves the connection details (after `onConnect` interceptors) or `null` when no attempt should be made. |
| `onConnectFailed({ error })`                            | When the transport cannot be created.                                                                                                     |
| `onConnected()` / `onDisconnected()`                    | When the transport opens / closes.                                                                                                        |
| `onReconnect({ disconnect, connect })`                  | From `reconnect()`; handles attempt counting and give-up events.                                                                          |
| `onDisconnect()`                                        | From a manual `disconnect()`; resets state and marks it closed on purpose.                                                                |
| `onListen({ listener, callback, onUnmount })`           | From `listen`; returns the remover.                                                                                                       |
| `onEmit({ emitter })`                                   | From `emit`; maps payload and runs `onSend`, returns the emitter or `null` (already reported).                                            |
| `onEmitError({ emitter, error })`, `onError({ error })` | Report failures.                                                                                                                          |
| `onEvent({ topic, data, extra })`                       | For every incoming message; runs `onMessage` and dispatches to listeners.                                                                 |
| `getQueryParams(queryParams)`                           | Stringify query params with the adapter mapper.                                                                                           |

```ts
import { SocketAdapter, getSocketUrl } from "@hyper-fetch/sockets";
import type { QueryParamsType } from "@hyper-fetch/core";
import { stringifyQueryParams } from "@hyper-fetch/core";

type Transport = {
  send: (frame: string) => void;
  close: () => void;
  onOpen: (cb: () => void) => void;
  onClose: (cb: () => void) => void;
  onFrame: (cb: (topic: string, data: unknown) => void) => void;
};
declare function openTransport(url: string): Transport;

export const MyAdapter = () =>
  new SocketAdapter<undefined, { autoConnect?: boolean }, undefined, undefined, QueryParamsType | string>({
    name: "my-transport",
  })
    .setQueryParamsMapper(stringifyQueryParams)
    .setConnector(
      ({
        socket,
        getQueryParams,
        onConnect,
        onReconnect,
        onDisconnect,
        onListen,
        onEmit,
        onConnected,
        onDisconnected,
        onEvent,
      }) => {
        let transport: Transport | undefined;

        const connect = async () => {
          const connection = await onConnect();
          if (!connection) return;
          const url = getSocketUrl(connection.url, getQueryParams(connection.queryParams));
          const current = openTransport(url);
          transport = current;
          current.onOpen(onConnected);
          current.onClose(onDisconnected);
          current.onFrame((topic, data) => onEvent({ topic, data, extra: undefined }));
        };

        const disconnect = async () => {
          transport?.close();
          transport = undefined;
          onDisconnect();
          onDisconnected();
        };

        const reconnect = () => {
          onReconnect({ disconnect, connect });
        };

        if (socket.adapter.adapterOptions?.autoConnect !== false) {
          connect();
        }

        return {
          connect,
          reconnect,
          disconnect,
          listen: (listener, callback) => onListen({ listener, callback }),
          emit: async (emitter) => {
            const prepared = await onEmit({ emitter });
            if (!prepared) return;
            transport?.send(JSON.stringify({ topic: prepared.topic, data: prepared.payload }));
          },
        };
      },
    );
```

For a complete reference implementation (connection timeout, joining a pending attempt, detaching a manually closed
transport) read `packages/sockets/src/adapter-websockets/websocket-adapter.ts` in the
[hyper-fetch repository](https://github.com/BetterTyped/hyper-fetch).
