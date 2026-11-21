# Listeners, emitters, delivery and events

## Listener

```ts
import { createSocketClient } from "@hyper-fetch/sockets";

export const socket = createSocketClient({ url: "wss://api.example.com/ws" });

type Notification = { id: string; message: string };

export const onNotification = socket.createListener<Notification>()({
  topic: "notifications",
  // options: adapter-specific listener options (none for WebSocket/SSE; Firebase: groupByChangeType, onlyOnce)
  // queryParams: what the listener asks for, only on adapters that support it (Firebase constraints)
  // delivery: see below
});
```

Listener members:

| Member                                            | What it does                                                                                                                              |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `topic`                                           | Resolved topic string (params filled in). Template literal type stays the declared one.                                                   |
| `params`                                          | Params set with `setParams`.                                                                                                              |
| `options` / `setOptions(options)`                 | Adapter-specific listener options. Returns a clone.                                                                                       |
| `queryParams` / `setQueryParams(queryParams)`     | What the listener asks for (Firebase: `(c) => c.where(...)`). Adapter opt-in; a callback is resolved to data right away. Returns a clone. |
| `setParams(params)`                               | Fill `:param` segments. Typed from the topic. Returns a clone.                                                                            |
| `delivery` / `setDelivery(delivery \| undefined)` | Delivery strategy. Returns a clone; the callback data type follows it.                                                                    |
| `clone(config?)`                                  | Copy with overrides.                                                                                                                      |
| `listen(callback)`                                | Subscribe. Returns `() => void` remover.                                                                                                  |

`listen` callback receives `{ data, extra }`. `extra` is adapter-specific: the raw `MessageEvent` for WebSocket and SSE,
`{ ref, snapshot, ... }` for Firebase.

Dispatch semantics (verified in the package tests):

- Callbacks of one topic run in subscription order, once per message.
- A callback added during a dispatch receives the next message, not the current one. A callback removed during a
  dispatch is skipped. Unsubscribing from inside the callback is the "listen once" pattern:

  ```ts
  const off = onNotification.listen(({ data }) => {
    console.log(data.message);
    off();
  });
  ```

- A throwing callback does not stop the other callbacks of the topic, and the connection keeps working.
- Separate listener instances of the same topic share the same topic subscription list.
- Subscribing before the socket is connected is fine; subscriptions survive reconnects and `disconnect()` / `connect()`
  cycles and are never duplicated.
- Without `delivery`, callbacks are stored by identity: passing the same function twice registers it once. With
  `delivery`, every `listen()` call is an independent subscription.
- A frame without `data` is delivered as `undefined`. Malformed JSON is reported through `onError` and skipped.

## Emitter

```ts
type ChatPayload = { text: string };

export const sendMessage = socket.createEmitter<ChatPayload>()({ topic: "rooms/:roomId/messages" });
```

| Member                 | What it does                                                                                              |
| ---------------------- | --------------------------------------------------------------------------------------------------------- |
| `setPayload(payload)`  | Attach the payload. Returns a clone typed as "has payload".                                               |
| `setParams(params)`    | Fill topic params. Returns a clone typed as "has params".                                                 |
| `setOptions(options)`  | Adapter-specific emit options (none for WebSocket).                                                       |
| `setPayloadMapper(fn)` | Transform the payload before sending; may be async; kept on clones.                                       |
| `clone(config?)`       | Copy with overrides.                                                                                      |
| `emit(options?)`       | Send. `options` is `{ payload?, params? }`, required parts depend on what is already set. Returns `void`. |

Typing: `emit()` with no argument compiles only when payload and params are already set (or the topic has no params and
the payload was set). A wrong payload shape is a type error.

Send pipeline (WebSocket): connected check, payload mapper, `onSend` interceptors, emitter start event, `encode`,
`websocket.send`. Failure modes - all reported, none thrown, nothing queued:

| Situation                                                   | Result                                                                                        |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Not connected / connecting / after disconnect               | Dropped; emitter error event "Cannot emit event when connection is not open". Not sent later. |
| Payload mapper or `onSend` throws or rejects                | Dropped; emitter error event plus `onError`.                                                  |
| `encode` throws, payload not serializable, transport throws | Emitter error event plus `onError`; next messages still go out.                               |
| SSE adapter                                                 | `emit()` throws synchronously.                                                                |

Observe failures per topic:

```ts
const offError = socket.events.onEmitterErrorByTopic(sendMessage.setParams({ roomId: "a" }), ({ error }) => {
  console.error("not sent", error.message);
});
```

### Request/reply without acknowledgements

There is no acknowledgement callback. Correlate a reply topic instead:

```ts
type JoinRequest = { requestId: string; roomId: string };
type JoinReply = { requestId: string; ok: boolean };

const sendJoin = socket.createEmitter<JoinRequest>()({ topic: "rooms/join" });
const onJoinReply = socket.createListener<JoinReply>()({ topic: "rooms/join/reply" });

export const joinRoom = (roomId: string, timeoutMs = 5000) =>
  new Promise<JoinReply>((resolve, reject) => {
    const requestId = crypto.randomUUID();
    const timer = setTimeout(() => {
      off();
      reject(new Error("join timeout"));
    }, timeoutMs);
    const off = onJoinReply.listen(({ data }) => {
      if (data.requestId !== requestId) return;
      clearTimeout(timer);
      off();
      resolve(data);
    });
    sendJoin.emit({ payload: { requestId, roomId } });
  });
```

## Topic params

`:name` segments are replaced once, with the longest matching param name (`:id` never eats `:idx`). Values are inserted
literally (no `$&` replacement patterns, a value containing `:` is not parsed as another param). Segments with no value
are left untouched. Setting params again replaces them (the template is kept).

## Delivery strategies

`delivery` sits between the adapter and your callback, per `listen()` call:

|                 | `latest`                               | `batch`                                    | custom            |
| --------------- | -------------------------------------- | ------------------------------------------ | ----------------- |
| Callback `data` | `Response`                             | `Response[]`                               | declared `Output` |
| Drops messages  | yes, intermediate ones                 | never                                      | your choice       |
| Options         | `interval`, `leading` (default `true`) | `interval`, `maxSize` (default `Infinity`) | -                 |

- `latest`: first message of an idle period delivered immediately (with `leading`), then at most one per `interval`,
  always the newest.
- `batch`: first message opens an `interval` window; on close every collected message is delivered at once in arrival
  order. `maxSize` flushes early. Empty batches are never delivered.
- `extra` is the `extra` of the last message that went into the delivery.
- Unsubscribing disposes the controller: timers cleared, pending messages dropped, nothing fires afterwards.
- `delivery` survives `setParams`, `setOptions`, `clone`. `setDelivery(undefined)` restores immediate delivery.
- An unknown `strategy` throws at listener creation.
- `socket.onMessage` interceptors run per raw message before delivery; `socket.events.onListenerEvent` sees every raw
  message unthrottled.

Custom strategy - declare `Input` and `Output`, define it at module level:

```ts
import { createDeliveryStrategy } from "@hyper-fetch/sockets";

type Trade = { id: string; price: number };
type Summary = { count: number; max: number };

export const summarize = createDeliveryStrategy<Trade, Summary>(({ deliver }) => {
  let count = 0;
  let max = -Infinity;
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    push: ({ data, extra }) => {
      count += 1;
      max = Math.max(max, data.price);
      timer ??= setTimeout(() => {
        timer = undefined;
        deliver({ data: { count, max }, extra });
        count = 0;
        max = -Infinity;
      }, 1000);
    },
    dispose: () => clearTimeout(timer), // must be safe to call twice; nothing may be delivered after it
  };
});

export const onTradeSummary = socket.createListener<Trade>()({ topic: "trades", delivery: summarize });
```

`createLatestDeliveryStrategy` and `createBatchDeliveryStrategy` are exported for composition.

## Types

| Type                                                                                        | Use for                                                                                                |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `ListenerInstance<{ response?, topic?, socket?, hasParams?, delivered? }>`                  | Constraints: generic helpers and components accepting any matching listener. Omitted fields are `any`. |
| `EmitterInstance<{ payload?, topic?, socket?, hasParams?, hasPayload? }>`                   | Same for emitters.                                                                                     |
| `ListenerModel<...>` / `EmitterModel<...>`                                                  | Defining one topic (SDK schemas). Omitted fields are strict.                                           |
| `ExtractListenerResponseType<L>`                                                            | Wire type of a listener.                                                                               |
| `ExtractListenerDeliveredType<L>`                                                           | What callbacks receive (differs with `batch` / custom delivery).                                       |
| `ExtractEmitterPayloadType<E>`, `ExtractListenerTopicType<L>`, `ExtractEmitterTopicType<E>` | Pull types out.                                                                                        |
| `ExtractSocketAdapterType<S>`, `ExtractSocketExtraType<S>`                                  | Adapter and `extra` type of a socket.                                                                  |

```ts
import type { ListenerInstance } from "@hyper-fetch/sockets";

// Accepts any listener whose messages have a `message` field
export const logMessages = <L extends ListenerInstance<{ response: { message: string } }>>(listener: L) =>
  listener.listen(({ data }) => console.log(data.message));
```

## Interceptors on the socket

```ts
socket
  // Every incoming message after decoding. Must return the data (falsy values like 0 or "" are fine).
  .onMessage<{ message: string }>(({ event }) => ({ ...event, message: event.message.trim() }))
  // Every outgoing emit after the payload mapper. Must return an emitter.
  .onSend(({ emitter }) => emitter.setPayload({ ...emitter.payload, clientVersion: "1.2.0" }))
  .onError(({ error }) => console.error(error));
```

A throwing `onMessage` skips that message and reports it through `onError`; the transport keeps running.

## Socket events (removable subscriptions)

`socket.events` methods return an unsubscribe function. Use them for devtools, analytics, cache sync and anything
component-scoped.

| Method                                                                                 | Fires on                                    |
| -------------------------------------------------------------------------------------- | ------------------------------------------- |
| `onConnected`, `onDisconnected`                                                        | open / close                                |
| `onConnecting(({ connecting }) => ...)`                                                | connecting flag changes                     |
| `onReconnecting(({ attempts }) => ...)`, `onReconnectingFailed(({ attempts }) => ...)` | reconnect start / give up                   |
| `onError(({ error }) => ...)`                                                          | any socket error                            |
| `onListenerEvent(({ topic, data, extra }) => ...)`                                     | every incoming message, all topics          |
| `onListenerEventByTopic(listener, cb)`                                                 | messages of `listener.topic` (exact string) |
| `onListenerRemove`, `onListenerRemoveByTopic`                                          | a callback was unsubscribed                 |
| `onEmitterStartEvent`, `onEmitterStartEventByTopic(emitter, cb)`                       | a message is being sent                     |
| `onEmitterError`, `onEmitterErrorByTopic(emitter, cb)`                                 | a message could not be sent                 |

`...ByTopic` variants match the resolved topic string: pass a listener or emitter with params already set. To react to
all `notes/:id` topics, use `onListenerEvent` and test `topic.startsWith("notes/")`.
