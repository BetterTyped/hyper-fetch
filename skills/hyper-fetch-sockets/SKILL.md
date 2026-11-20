---
name: hyper-fetch-sockets
description:
  Type-safe realtime client for HyperFetch (@hyper-fetch/sockets) - createSocketClient / Socket, typed Listener and
  Emitter templates, WebsocketAdapter and ServerSentEventsAdapter, onConnect interceptor for auth tokens, reconnection
  and heartbeat, delivery strategies for throttling and batching, the socket SDK (createSocketSdk, ListenerModel,
  EmitterModel) and the React hooks useListener and useEmitter from @hyper-fetch/react. Use when code imports
  @hyper-fetch/sockets or calls createListener, createEmitter, listen, emit, setParams, setPayload, onConnect,
  onMessage, onSend, setQueryParams, reconnect, createSocketSdk, $configure, useListener or useEmitter, or when the task
  is a chat, live feed, price ticker, notifications stream, presence, WebSocket or SSE connection, socket authentication
  or token refresh, reconnect/retry policy, custom message format (decode/encode), high-frequency stream throttling, or
  a custom socket adapter (socket.io, Firebase).
---

# HyperFetch Sockets

`@hyper-fetch/sockets` is the realtime counterpart of the `@hyper-fetch/core` `Client`. A **Socket** owns one connection
through a **SocketAdapter** (WebSocket by default, SSE built in, Firebase in `@hyper-fetch/firebase`). From the socket
you create reusable, typed templates: a **Listener** (typed subscription to a topic) and an **Emitter** (typed sender
for a topic). Templates are immutable - every setter returns a clone - exactly like core `Request`s. React bindings
(`useListener`, `useEmitter`) live in `@hyper-fetch/react`.

## Install and minimal setup

```bash
npm install @hyper-fetch/core @hyper-fetch/sockets
# React bindings
npm install @hyper-fetch/react
```

```ts
// socket.ts - one module-level instance per server connection
import { createSocketClient } from "@hyper-fetch/sockets";

export const socket = createSocketClient({ url: "wss://api.example.com/ws" });

type ChatMessage = { id: string; text: string; author: string };

// Note the double call: the first fixes the data type, the second infers the topic literal
export const onChatMessage = socket.createListener<ChatMessage>()({ topic: "chat/:roomId" });
export const sendChatMessage = socket.createEmitter<{ text: string }>()({ topic: "chat/:roomId" });
```

```ts
const unlisten = onChatMessage.setParams({ roomId: "general" }).listen(({ data, extra }) => {
  console.log(data.text); // data: ChatMessage, extra: the raw MessageEvent
});

sendChatMessage.emit({ payload: { text: "Hello" }, params: { roomId: "general" } });

unlisten(); // always clean up
```

`createSocketClient(options)` and `new Socket(options)` are equivalent. The WebSocket adapter connects on creation
(`autoConnect` defaults to `true`).

## Golden rules

1. **Create the socket once, at module level.** Every `Socket` opens its own connection and owns its own `AppManager`.
   Never create one inside a component render or per request.
2. **Define listeners and emitters once, next to the socket.** They are templates. Derive concrete ones with
   `setParams`, `setPayload`, `setOptions`, `setDelivery` - each returns a **clone**, so always use the returned value.
   `listener.setParams({ id: 1 }); listener.listen(cb)` listens on the literal `"items/:id"` topic.
3. **Type with the generic, not with casts.** `createListener<Response>()` and `createEmitter<Payload>()` type `data`
   and `payload`; topic params (`:roomId`) are typed from the topic string and checked by `setParams` / `emit`.
4. **Resolve credentials in `onConnect`, not in `queryParams` at creation.** `onConnect` runs before every attempt
   (initial, automatic reconnect, manual reconnect), so reconnects never reuse an expired token.
5. **`emit()` is fire-and-forget.** It returns `void`, has no acknowledgement callback and is **dropped** (not queued)
   when the socket is not connected; the drop is reported through `socket.events.onEmitterError` / `onEmitError` in
   `useEmitter`. Gate the UI on `connected` and design replies as a separate listener topic.
6. **Always unsubscribe.** `listen()` returns the remover. In React use `useListener`, which handles it.
7. **Throttle on the listener, not in the component.** High-frequency topics get `delivery: { strategy: "latest" }` or
   `{ strategy: "batch" }`; `listen`, `useListener` and the SDK all follow.
8. **Match the wire format with `decode` / `encode`, not a custom adapter.** The default frame is JSON
   `{ topic, data }`; map other shapes (`{ type, payload }`) in `adapterOptions`.
9. **SSE is receive-only.** `emit()` on a `ServerSentEventsAdapter` socket throws synchronously.
10. **Interceptors must return.** `onMessage` returns the data, `onSend` returns the emitter, `onConnect` returns the
    connection. Returning `undefined` is an error.
11. **Built-in adapters need a browser runtime.** They read `window.WebSocket` / `window.EventSource`; without them the
    attempt fails with "WebSocket is not available in this environment" through `onError`. React hooks render safely on
    the server and subscribe only on the client.

## Type safety

Types flow from three places; never cast or annotate callback parameters by hand.

| Source                                            | Generic                                                      | Drives                                                                                         |
| ------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `createSocketClient({ adapter })`                 | `Socket<Adapter>`, inferred (default `WebsocketAdapterType`) | `adapterOptions`, `queryParams`, listener / emitter `options`, `extra`, `onConnect` connection |
| `createListener<Response>()({ topic, delivery })` | one positional generic, topic literal inferred               | callback `data` (`Response`, `Response[]` with `batch`), `setParams` keys                      |
| `createEmitter<Payload>()({ topic })`             | one positional generic, topic literal inferred               | `emit` / `setPayload` payload, required `params`, "already set" flags                          |

```ts
type RoomMessage = { text: string; author: string };

const sendToRoom = socket.createEmitter<RoomMessage>()({ topic: "rooms/:roomId" });
sendToRoom.emit({ payload: { text: "hi", author: "me" }, params: { roomId: 1 } });
sendToRoom.setParams({ roomId: 1 }).setPayload({ text: "hi", author: "me" }).emit();

// @ts-expect-error - params are required by the topic
sendToRoom.emit({ payload: { text: "hi", author: "me" } });
// @ts-expect-error - payload misses author
sendToRoom.emit({ payload: { text: "hi" }, params: { roomId: 1 } });
// @ts-expect-error - createEmitter takes one generic; there is no acknowledgement type
socket.createEmitter<RoomMessage, { ok: boolean }>();
```

- `createListener<{ response: T }>()` is a common mistake carried over from core `createRequest`: it types `data` as
  `{ response: T }`.
- There is no acknowledgement type: `emit()` returns `void`. Type a reply topic with its own listener.
- `ListenerModel` / `EmitterModel` define topics in SDK schemas (strict defaults: `unknown` response, `undefined`
  payload); `ListenerInstance` / `EmitterInstance` are for generic constraints (`any` defaults).
- `ExtractListenerResponseType`, `ExtractListenerDeliveredType`, `ExtractEmitterPayloadType`, `ExtractSocketExtraType`
  and friends pull types out of existing templates.
- `useListener(listener)` returns `data: Delivered | null` (or the `select` result), `extra: Extra | null`;
  `useEmitter(emitter).emit` has the emitter's exact `emit` signature.

Full matrix with verified `@ts-expect-error` cases: `references/type-safety.md`.

## Core patterns

### Topic params

```ts
const onRoomEvent = socket.createListener<{ type: string }>()({ topic: "orgs/:orgId/rooms/:roomId" });

onRoomEvent.setParams({ orgId: 1, roomId: "a" }).listen(({ data }) => data.type); // topic "orgs/1/rooms/a"
// @ts-expect-error - missing roomId
onRoomEvent.setParams({ orgId: 1 });
```

Each param combination is a separate topic. Topics match exactly (no prefixes, no wildcards, case-sensitive).

### Emitting

```ts
const sendPrivate = socket.createEmitter<{ text: string }>()({ topic: "dm/:userId" });

// Both are typed: payload and params are required until they are set
sendPrivate.emit({ payload: { text: "hi" }, params: { userId: "u1" } });
sendPrivate.setParams({ userId: "u1" }).setPayload({ text: "hi" }).emit();

// Transform right before sending (sync or async), kept on clones
const stamped = sendPrivate.setPayloadMapper((payload) => ({ ...payload, sentAt: Date.now() }));
```

A payload passed to `emit()` wins over the one set with `setPayload`. Messages are sent in call order.

### Authentication and per-attempt connection details

```ts
declare function getAccessToken(options: { forceRefresh: boolean }): Promise<string>;

export const authedSocket = createSocketClient({ url: "wss://api.example.com/ws" }).onConnect(
  async ({ connection, attempt }) => {
    // attempt is 0 for a fresh connection, the reconnection attempt number otherwise
    const token = await getAccessToken({ forceRefresh: attempt > 0 });
    return { ...connection, queryParams: { token } };
  },
);
```

Chain `onConnect` right after creation: the automatic first connection yields once, so callbacks chained synchronously
apply to it. If `onConnect` throws, the attempt fails, `onError` receives the error and the socket **stays
disconnected** (no automatic retry) - catch and handle token failures, or call `socket.reconnect()` later. Token in a
subprotocol instead: return `adapterOptions: { ...connection.adapterOptions, protocols: ["bearer", token] }`.

### Connection lifecycle

```ts
socket
  .onConnected(() => console.log("open"))
  .onDisconnected(() => console.log("closed"))
  .onReconnect(() => console.log("reconnecting"))
  .onReconnectFailed(() => console.log("gave up"))
  .onError(({ error }) => console.error(error));

await socket.connect(); // no-op when already connected
await socket.reconnect(); // fresh connection, also after a manual disconnect
await socket.disconnect(); // stays closed until connect() or reconnect()

socket.setUrl("wss://eu.example.com/ws").setQueryParams({ tenant: "eu" }); // apply with reconnect()
```

`socket.onX(...)` callbacks are permanent (no remover) - register them at setup. For temporary or component-scoped
subscriptions use `socket.events.*`, which return an unsubscribe function:

```ts
const off = socket.events.onConnected(() => console.log("open"));
off();
```

Current state: `socket.adapter.connected`, `socket.adapter.connecting`, `socket.adapter.reconnectionAttempts`.

### Throttling and batching high-frequency topics

```ts
type Price = { symbol: string; value: number };
type Trade = { id: string; price: number };

// At most one (the newest) message per 16ms - for state-like data
export const onPrice = socket.createListener<Price>()({
  topic: "prices",
  delivery: { strategy: "latest", interval: 16 },
});

// Every message, delivered as arrays per 100ms window - for event-like data
export const onTrade = socket.createListener<Trade>()({
  topic: "trades",
  delivery: { strategy: "batch", interval: 100, maxSize: 500 },
});

onTrade.listen(({ data }) => data.length); // data: Trade[]
```

### Keeping HTTP cache in sync with realtime updates

```ts
import { Client } from "@hyper-fetch/core";

type Note = { id: string; title: string };
const client = new Client({ url: "https://api.example.com" });
const getNote = client.createRequest<{ response: Note }>()({ endpoint: "/notes/:noteId" });
const onNoteChange = socket.createListener<Note>()({ topic: "notes" });

onNoteChange.listen(({ data }) => {
  client.cache.update(getNote.setParams({ noteId: data.id }), { data });
});
```

### Custom wire format

```ts
export const typedSocket = createSocketClient({
  url: "wss://example.com/ws",
  adapterOptions: {
    decode: (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "pong") return null; // ignore the frame
      return { topic: message.type, data: message.payload };
    },
    encode: ({ topic, payload }) => JSON.stringify({ type: topic, payload }),
  },
});
```

## Decision guide

| Need                                                   | Use                                                                           |
| ------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Bidirectional realtime                                 | `WebsocketAdapter` (default)                                                  |
| Server-to-client stream only, HTTP infra, cookies      | `ServerSentEventsAdapter()` with `eventSourceInit: { withCredentials: true }` |
| Firestore `onSnapshot` / Realtime DB `onValue`         | `FirebaseSocketsAdapter` - see `hyper-fetch-firebase`                         |
| Server speaks `{ type, payload }` or binary            | `adapterOptions.decode` / `encode`                                            |
| socket.io or another protocol                          | custom `SocketAdapter` - see `references/adapters.md`                         |
| Short-lived token, tenant, feature flag per connection | `socket.onConnect`                                                            |
| Static query params                                    | `queryParams` option; change with `setQueryParams` + `reconnect()`            |
| Only the newest value matters (prices, cursors)        | `delivery: { strategy: "latest", interval }`                                  |
| Every message matters, fewer renders (trades, logs)    | `delivery: { strategy: "batch", interval, maxSize }`                          |
| Debounce or aggregate                                  | `createDeliveryStrategy`                                                      |
| Server reply to an emitted message                     | a reply listener topic plus a correlation id (no acks)                        |
| Many topics, one typed tree                            | `createSocketSdk` - see `references/sdk.md`                                   |
| React component                                        | `useListener` / `useEmitter` - see `references/react-hooks.md`                |
| Observe every message (devtools, logging)              | `socket.events.onListenerEvent` (never throttled)                             |
| Rewrite every incoming message / outgoing emit         | `socket.onMessage` / `socket.onSend`                                          |

## Defaults worth knowing

| Setting                                                                       | Default                                                                               |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `reconnect` (max attempts)                                                    | `Infinity`                                                                            |
| `reconnectTime` (delay between attempts, also the open timeout of an attempt) | `5000` ms                                                                             |
| `adapterOptions.autoConnect`                                                  | `true`                                                                                |
| `adapterOptions.heartbeat`                                                    | `false` (`pingTimeout` and `pongTimeout` `5000` ms, `heartbeatMessage` `"heartbeat"`) |
| Frame format                                                                  | JSON `{ topic, data }` in, `JSON.stringify({ topic, data: payload })` out             |
| `delivery`                                                                    | none - every message delivered immediately, zero overhead                             |
| `latest.leading`                                                              | `true`                                                                                |
| `batch.maxSize`                                                               | `Infinity`                                                                            |

The WebSocket adapter reconnects automatically when the connection closes with a code other than `1000`, when an attempt
does not open within `reconnectTime`, and on heartbeat timeout. A close with `1000` or a manual `disconnect()` does not
reconnect. When the browser comes back online, a socket with `autoConnect` connects again unless it was disconnected on
purpose. Listeners stay registered across reconnects.

## Performance notes

- Without `delivery`, the callback is registered directly - no wrapper, no timers. Add `delivery` only to fast topics.
- `latest` with `interval: 16` caps renders at one per frame; `batch` turns N updates into one state update per window.
- Pending delivered messages are dropped on unsubscribe; each `listen()` has its own buffers and timers.
- Custom strategies are compared by identity in `useListener` - define them at module level.
- `onMessage` interceptors run for every raw message before delivery - keep them cheap.
- Heartbeat (`heartbeat: true`) detects dead connections behind proxies; any incoming frame counts as a pong.

## Pitfalls

| Wrong                                                                  | Right                                                                              |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `listener.setParams(p); listener.listen(cb)`                           | `listener.setParams(p).listen(cb)` - setters return clones                         |
| `createListener<T>({ topic })`                                         | `createListener<T>()({ topic })` - curried                                         |
| `emitter.emit({ data })`, `emit(opts, ackCallback)`, `setData`         | `emit({ payload, params })`, `setPayload` - no acknowledgements exist              |
| `listen((message) => message.text)`                                    | `listen(({ data, extra }) => data.text)`                                           |
| Emitting right after `createSocketClient`                              | wait for `onConnected` / `connected`; early emits are dropped                      |
| Token in `queryParams` at creation                                     | `onConnect` resolves it per attempt                                                |
| `new Socket<{ token: string }>(...)` to type query params              | the `Socket` generic is the adapter type; query params are typed by the adapter    |
| `socket.events.onListenerEventByTopic(template, cb)` for `"notes/:id"` | it matches the exact topic string; use `onListenerEvent` and filter on `topic`     |
| Same function passed to `listen` twice (no `delivery`)                 | callbacks are keyed by identity; the second call does not add a subscription       |
| Emitting on an SSE socket                                              | use a WebSocket socket or an HTTP request for client-to-server                     |
| Throwing inside `onConnect` on a missing token                         | return the connection or handle the error; a throw stops reconnecting              |
| `socket.onConnected(...)` inside a component                           | `useListener` / `useEmitter` callbacks or `socket.events.onConnected` with cleanup |
| Throttling with `setTimeout` in a React effect                         | `delivery` on the listener                                                         |

## Testing

`@hyper-fetch/testing` ships `createWebsocketMockingServer(url)` (with `emitListenerEvent(listener, data)` and
`expectEmitterEvent(emitter, payload)`), `createSseMockingServer(url)` and `waitForConnection(socket)`. Point the socket
at the mock url, `await waitForConnection(socket)`, then push events. Use fake timers for `delivery` windows and
`reconnectTime`. See the `hyper-fetch-testing` skill.

## References

- `references/type-safety.md` - read when typing sockets, listeners, emitters, topic params, delivery, SDK schemas,
  generic helpers or React hook results, or when a type error around them is unclear.
- `references/listeners-emitters.md` - read when typing topics and payloads, params, delivery strategies, interceptors,
  socket events, request/reply over sockets.
- `references/connection-reconnect-auth.md` - read when configuring auth, query params, reconnection, heartbeat, offline
  handling, React Native / Node app managers, or debugging connection state.
- `references/adapters.md` - read when choosing or configuring WebSocket vs SSE, custom frame formats, or writing a
  custom `SocketAdapter`.
- `references/sdk.md` - read when using `createSocketSdk`, `ListenerModel` / `EmitterModel` schemas or `$configure`.
- `references/react-hooks.md` - read when using `useListener` or `useEmitter` in React.

Related skills: `hyper-fetch-core` (Client, requests, cache), `hyper-fetch-react` (HTTP hooks, Provider),
`hyper-fetch-firebase` (Firebase socket adapter), `hyper-fetch-testing`, `hyper-fetch-devtools`.

Docs: https://hyperfetch.bettertyped.com/docs/sockets/overview, https://hyperfetch.bettertyped.com/docs/sockets/socket,
https://hyperfetch.bettertyped.com/docs/sockets/listener, https://hyperfetch.bettertyped.com/docs/sockets/emitter,
https://hyperfetch.bettertyped.com/docs/sockets/adapter, https://hyperfetch.bettertyped.com/docs/sockets/sdk,
https://hyperfetch.bettertyped.com/docs/guides/sockets/throttling
