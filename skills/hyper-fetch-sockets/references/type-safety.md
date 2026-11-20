# Type safety in @hyper-fetch/sockets

Every example below compiles against the current package; each `// @ts-expect-error` line is rejected by the types.

## 1. Socket generic = adapter type

`createSocketClient<Adapter>(options)` (same as `new Socket<Adapter>(options)`) has exactly one generic: the adapter
type. It defaults to `WebsocketAdapterType` and is inferred from the `adapter` option, so never write it by hand. There
is no `createSocket` export; the factory is `createSocketClient`.

The adapter type decides `adapterOptions`, `queryParams`, listener `options`, emitter `options` and the `extra` passed
to every callback.

```ts
import { createSocketClient, ServerSentEventsAdapter } from "@hyper-fetch/sockets";
import type {
  ExtractSocketAdapterType,
  ExtractSocketExtraType,
  ServerSentEventsAdapterType,
  WebsocketAdapterType,
} from "@hyper-fetch/sockets";

const socket = createSocketClient({ url: "wss://api.example.com/ws" });
const sse = createSocketClient({ url: "https://api.example.com/events", adapter: ServerSentEventsAdapter() });

type WsAdapter = ExtractSocketAdapterType<typeof socket>; // WebsocketAdapterType
type WsExtra = ExtractSocketExtraType<typeof socket>; // MessageEvent<any>
type SseAdapter = ExtractSocketAdapterType<typeof sse>; // ServerSentEventsAdapterType

// @ts-expect-error - heartbeat is a WebSocket option, not an SSE one
createSocketClient({ url: "https://x", adapter: ServerSentEventsAdapter(), adapterOptions: { heartbeat: true } });
// @ts-expect-error - eventSourceInit is an SSE option
createSocketClient({ url: "wss://x", adapterOptions: { eventSourceInit: {} } });
// @ts-expect-error - onConnect must return the connection (sync or async)
socket.onConnect(() => null);
```

`socket.onConnect(({ connection, attempt }) => ...)` is typed: `connection.adapterOptions` has the adapter's options
(`protocols`, `heartbeat`, ...), `attempt` is `number`. Lifecycle registrars return the same socket type, so chains keep
it. `connect()`, `disconnect()`, `reconnect()` return `Promise<void>`.

## 2. `createListener<Response>()` and `createEmitter<Payload>()`

Both are curried: the first call takes **one positional generic**, the second call takes the options and infers the
topic literal.

- `createListener<Response>()({ topic, options?, delivery? })` - `Response` is the raw message data type.
- `createEmitter<Payload>()({ topic, options? })` - `Payload` is the outgoing data type.

They do **not** take a core-style object generic (`{ response, payload }`) and there is no second "acknowledgement"
generic.

```ts
type ChatMessage = { text: string; author: string };

const onChat = socket.createListener<ChatMessage>()({ topic: "chat" });
onChat.listen(({ data, extra }) => {
  data.text; // ChatMessage
  extra.data; // MessageEvent<any> for WebSocket
});

// Wrong: createRequest-style generic - data becomes { response: ChatMessage }
const wrong = socket.createListener<{ response: ChatMessage }>()({ topic: "chat" });
wrong.listen(({ data }) => {
  // @ts-expect-error - text lives under data.response here
  data.text;
});
```

## 3. Topic params are inferred from the topic string

`:name` segments become a required params object (`string | number` values) for `setParams` and `emit`.

```ts
const onRoom = socket.createListener<ChatMessage>()({ topic: "orgs/:orgId/rooms/:roomId" });
onRoom.setParams({ orgId: 1, roomId: "a" });
// @ts-expect-error - unknown param
onRoom.setParams({ orgId: 1, roomId: 1, other: 1 });
// @ts-expect-error - missing param
onRoom.setParams({ orgId: 1 });
```

The topic type stays the template literal (`"orgs/:orgId/rooms/:roomId"`) after `setParams`; the runtime `topic` is the
filled string. `listen()` is not blocked when params are missing - it would subscribe to the literal template - so call
`setParams` first.

## 4. Emitter payload and params are tracked by the type

The `Emitter` generics are `Emitter<Payload, Topic, Socket, HasPayload, HasParams>`. `setPayload` flips `HasPayload` to
`true`, `setParams` flips `HasParams` to `true`; `emit()` then makes those parts optional.

```ts
import type { ExtractEmitterHasParamsType, ExtractEmitterHasPayloadType } from "@hyper-fetch/sockets";

const sendChat = socket.createEmitter<ChatMessage>()({ topic: "chat" });
const sendToRoom = socket.createEmitter<ChatMessage>()({ topic: "rooms/:roomId" });

sendChat.setPayload({ text: "hi", author: "me" }).emit(); // payload already set
sendToRoom.emit({ payload: { text: "hi", author: "me" }, params: { roomId: 1 } });

// @ts-expect-error - payload is required until it is set
sendChat.emit();
// @ts-expect-error - payload misses author
sendChat.emit({ payload: { text: "hi" } });
// @ts-expect-error - wrong field type
sendChat.setPayload({ text: 1, author: "me" });
// @ts-expect-error - params are required for a topic with params
sendToRoom.emit({ payload: { text: "hi", author: "me" } });

type Prepared = ReturnType<typeof sendToRoom.setParams>;
type HasParams = ExtractEmitterHasParamsType<Prepared>; // true
type HasPayload = ExtractEmitterHasPayloadType<typeof sendChat>; // false
```

`setPayloadMapper((payload) => ...)` receives `Payload` typed; its return value is what goes on the wire and is not
type-checked against the server.

### Acknowledgements

There is no acknowledgement type: `emit()` returns `void` and accepts only `{ payload?, params? }`. Type replies as a
separate listener (`createListener<Reply>()`) and correlate them with an id - see `listeners-emitters.md`.

```ts
// @ts-expect-error - createEmitter takes one generic; there is no acknowledgement type
socket.createEmitter<ChatMessage, { ok: boolean }>();
```

## 5. Delivery changes the callback type

A listener carries two data types: the wire **response** and the **delivered** type (what callbacks receive).
`Listener<Response, Topic, Socket, HasParams, Delivered>`; they differ only with `batch` or a custom strategy.

| `delivery`                                 | `ExtractListenerResponseType` | `ExtractListenerDeliveredType` |
| ------------------------------------------ | ----------------------------- | ------------------------------ |
| none, `latest`                             | `Response`                    | `Response`                     |
| `batch`                                    | `Response`                    | `Response[]`                   |
| `createDeliveryStrategy<Response, Output>` | `Response`                    | `Output`                       |

```ts
import type { ExtractListenerDeliveredType, ExtractListenerResponseType } from "@hyper-fetch/sockets";

const batched = socket.createListener<ChatMessage>()({ topic: "c", delivery: { strategy: "batch", interval: 100 } });
type Wire = ExtractListenerResponseType<typeof batched>; // ChatMessage
type Delivered = ExtractListenerDeliveredType<typeof batched>; // ChatMessage[]
const unbatched = batched.setDelivery(undefined); // delivered back to ChatMessage

// @ts-expect-error - unknown strategy
socket.createListener<ChatMessage>()({ topic: "c", delivery: { strategy: "nope", interval: 1 } });
// @ts-expect-error - interval is required
socket.createListener<ChatMessage>()({ topic: "c", delivery: { strategy: "latest" } });
```

`createDeliveryStrategy<Input, Output>` needs `Output` declared explicitly; TypeScript cannot infer it from `deliver`.

## 6. Instance vs Model types

| Type                                                                       | Mindset                                                                             | Omitted fields                                                                  |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `ListenerInstance<{ response?, topic?, socket?, hasParams?, delivered? }>` | "any listener matching this" - generic constraints, reusable helpers and components | `any`                                                                           |
| `EmitterInstance<{ payload?, topic?, socket?, hasPayload?, hasParams? }>`  | same for emitters                                                                   | `any`                                                                           |
| `ListenerModel<{ ... }>`                                                   | "this exact topic" - SDK schemas                                                    | `response: unknown`, `topic: string`, `hasParams: false`, `delivered: response` |
| `EmitterModel<{ ... }>`                                                    | same for emitters                                                                   | `payload: undefined`, `topic: string`, `hasPayload: false`, `hasParams: false`  |

```ts
import type { EmitterInstance, ListenerInstance } from "@hyper-fetch/sockets";

const renderTexts = <L extends ListenerInstance<{ response: { text: string } }>>(listener: L) =>
  listener.listen(({ data }) => console.log(data.text));
const sendText = (emitter: EmitterInstance<{ payload: { text: string } }>) => emitter;

renderTexts(onChat); // ChatMessage has text
sendText(sendChat);
const onCount = socket.createListener<{ count: number }>()({ topic: "count" });
// @ts-expect-error - response has no text
renderTexts(onCount);
```

Batched listeners still satisfy `ListenerInstance<{ response: T }>`; constrain on `delivered` when the callback shape
matters (`ListenerInstance<{ delivered: T[] }>`). `ExtendListener<L, { ... }>` / `ExtendEmitter<E, { ... }>` derive a
type with some fields replaced.

## 7. Socket SDK schema typing

`createSocketSdk<typeof socket, Schema>(socket)` - socket type first, schema second. Leaves use `ListenerModel` /
`EmitterModel`; the SDK injects the real socket type into every leaf, so `extra` and options follow the adapter.

```ts
import { createSocketSdk } from "@hyper-fetch/sockets";
import type { EmitterModel, ListenerModel } from "@hyper-fetch/sockets";

type Schema = {
  chat: {
    messages: {
      $listener: ListenerModel<{ response: ChatMessage; topic: "chat/messages" }>;
      $emitter: EmitterModel<{ payload: { text: string }; topic: "chat/messages" }>;
    };
    $roomId: { $listener: ListenerModel<{ response: ChatMessage; topic: "chat/:roomId" }> };
  };
};

const sdk = createSocketSdk<typeof socket, Schema>(socket);
sdk.chat.messages.$listener.listen(({ data, extra }) => data.author); // data: ChatMessage, extra: MessageEvent
sdk.chat.messages.$emitter.emit({ payload: { text: "x" } });
sdk.chat.$roomId.$listener.setParams({ roomId: 1 });

// @ts-expect-error - payload required
sdk.chat.messages.$emitter.emit();
// @ts-expect-error - payload shape
sdk.chat.messages.$emitter.emit({ payload: { text: 1 } });
// @ts-expect-error - wrong param name
sdk.chat.$roomId.$listener.setParams({ id: 1 });
// @ts-expect-error - not in the schema
sdk.chat.rooms;
// @ts-expect-error - configuration keys are checked against schema topics and dot paths
sdk.$configure({ "news/*": {} });

type Untyped = { chat: { $listener: ListenerModel<{ topic: "chat" }> } };
createSocketSdk<typeof socket, Untyped>(socket).chat.$listener.listen(({ data }) => {
  // @ts-expect-error - response defaults to unknown and must be narrowed
  data.text;
});
```

What the SDK types do not check: that the `topic` literal in a model matches the property path that builds the runtime
topic (`camelCaseToKebabCase` included). Keep them in sync by hand. A `delivery` set through `defaults` / `$configure`
does not change types - declare `delivered` in the model.

## 8. Extractor types

| Type                                                                                               | Gives                                 |
| -------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `ExtractListenerResponseType<L>`                                                                   | wire data type                        |
| `ExtractListenerDeliveredType<L>`                                                                  | callback data type                    |
| `ExtractListenerTopicType<L>`, `ExtractListenerHasParamsType<L>`, `ExtractListenerSocketType<L>`   | topic literal, params flag, socket    |
| `ExtractEmitterPayloadType<E>`, `ExtractEmitterTopicType<E>`                                       | payload, topic literal                |
| `ExtractEmitterHasPayloadType<E>`, `ExtractEmitterHasParamsType<E>`, `ExtractEmitterSocketType<E>` | flags, socket                         |
| `ExtractSocketAdapterType<S>`, `ExtractSocketExtraType<S>`                                         | adapter, `extra`                      |
| `ExtractSocketOptionsType<S>`, `ExtractListenerOptionsType<S>`, `ExtractEmitterOptionsType<S>`     | adapter, listener and emitter options |
| `ExtractAdapterExtraType<A>`, `ExtractAdapterOptionsType<A>`, `ExtractAdapterQueryParamsType<A>`   | same, from an adapter type            |

## 9. React hook results

`useListener` and `useEmitter` derive everything from the listener / emitter you pass; no generics needed.

```tsx
import { useEmitter, useListener } from "@hyper-fetch/react";

export const useChatTypes = () => {
  const chat = useListener(onChat);
  chat.data; // ChatMessage | null
  chat.extra; // MessageEvent<any> | null
  chat.timestamp; // number | null

  const length = useListener(onChat, { select: (message) => message.text.length });
  length.data; // number | null

  const batch = useListener(batched);
  batch.data; // ChatMessage[] | null - follows the delivered type
  batch.onEvent(({ data }) => data.length); // ChatMessage[]

  const room = useEmitter(sendToRoom);
  room.emit({ payload: { text: "a", author: "b" }, params: { roomId: 1 } });
  // @ts-expect-error - params are required by the emitter's topic
  room.emit({ payload: { text: "a", author: "b" } });
  room.connected; // boolean
};
```

`data` is always `| null` (nothing received yet). Narrow before use.
