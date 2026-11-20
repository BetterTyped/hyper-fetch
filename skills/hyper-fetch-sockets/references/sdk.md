# Socket SDK

`createSocketSdk` gives a typed, proxy-based tree of listeners and emitters, the realtime twin of the core `createSdk`.
Leaf keys are `$listener` and `$emitter`; instances are created on access, so there is no setup cost per topic.

## Schema

Describe each topic with `ListenerModel` / `EmitterModel` (strict defaults), never with `ListenerInstance` /
`EmitterInstance` (those default to `any` and are for generic constraints).

```ts
import { createSocketClient, createSocketSdk } from "@hyper-fetch/sockets";
import type { EmitterModel, ListenerModel } from "@hyper-fetch/sockets";

type ChatMessage = { text: string; user: string };
type Trade = { id: string; price: number };

export type AppSocketSchema = {
  chat: {
    messages: {
      $listener: ListenerModel<{ response: ChatMessage; topic: "chat/messages" }>;
      $emitter: EmitterModel<{ payload: { text: string }; topic: "chat/messages" }>;
    };
    $roomId: {
      $listener: ListenerModel<{ response: ChatMessage; topic: "chat/:roomId" }>;
    };
  };
  liveTrades: {
    // delivered: set only when a delivery strategy configured below changes the callback type
    $listener: ListenerModel<{ response: Trade; topic: "live-trades"; delivered: Trade[] }>;
  };
};

export const socket = createSocketClient({ url: "wss://api.example.com/ws" });

// Generics: socket type first, schema second
export const sdk = createSocketSdk<typeof socket, AppSocketSchema>(socket, {
  defaults: {
    "live-trades": { delivery: { strategy: "batch", interval: 100 } },
  },
});
```

`ListenerModel` defaults: `response: unknown`, `topic: string`, `hasParams: false`, `delivered: response`.
`EmitterModel` defaults: `payload: undefined`, `topic: string`, `hasPayload: false`, `hasParams: false`. The `socket`
field is injected by `createSocketSdk`; do not set it.

## How topics are built at runtime

The runtime topic comes from the **property path**, not from the `topic` type in the model:

- Path segments are joined with `/`: `sdk.chat.messages.$listener` listens on `chat/messages`.
- `$name` segments become params: `sdk.chat.$roomId.$listener` has topic `chat/:roomId`.
- `camelCaseToKebabCase` defaults to `true`: `sdk.liveTrades.$listener` listens on `live-trades`. Pass
  `{ camelCaseToKebabCase: false }` in the options (second argument) to keep `liveTrades`.

Keep the `topic` literal in the model equal to that path, otherwise the types lie about the real topic.

## Usage

```ts
const off = sdk.chat.messages.$listener.listen(({ data }) => console.log(data.user, data.text));
sdk.chat.messages.$emitter.emit({ payload: { text: "Hello" } });
sdk.chat.$roomId.$listener.setParams({ roomId: "general" }).listen(({ data }) => data.text);
sdk.liveTrades.$listener.listen(({ data }) => data.length); // Trade[]
off();
```

Every access returns a fresh instance; store the result if you want to reuse it.

## Configuration

`defaults` in the options or `sdk.$configure(map)` (returns a new SDK, merging with existing defaults). Keys:

| Key                                        | Matches                               |
| ------------------------------------------ | ------------------------------------- |
| `"*"`                                      | every listener and emitter            |
| exact topic, e.g. `"chat/messages"`        | leaves with that topic                |
| wildcard, e.g. `"chat/*"`                  | `chat/...` topics (and `chat` itself) |
| dot path, e.g. `"chat.messages.$listener"` | that one leaf                         |

Values are either `{ options?, delivery? }` (`options` goes to `setOptions`, `delivery` to `setDelivery` and is ignored
for emitters) or a function `(instance) => instance` with access to every setter. Order: `"*"`, then topic keys, then
dot paths; later ones override earlier ones.

```ts
import { createSocketConfiguration } from "@hyper-fetch/sockets";

export const chatConfig = createSocketConfiguration<AppSocketSchema>()({
  "chat.messages.$emitter": (emitter) => emitter.setPayloadMapper((payload) => ({ ...payload, sentAt: Date.now() })),
  "chat/*": { delivery: { strategy: "latest", interval: 50 } },
});

export const configuredSdk = sdk.$configure(chatConfig);
```

`options` must be options the adapter understands. The WebSocket and SSE adapters have no listener or emitter options;
Firebase adapters accept `constraints`, `groupByChangeType` or `onlyOnce`.
