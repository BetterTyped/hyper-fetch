# React socket hooks (`@hyper-fetch/react`)

`useListener(listener, options?)` subscribes on mount and unsubscribes on unmount. `useEmitter(emitter, options?)` gives
an `emit` function plus connection state. Both read the socket from the listener / emitter, so no provider is required;
`<Provider config={{ useListener, useEmitter }}>` only sets defaults. For HTTP hooks see `hyper-fetch-react`.

## useListener

```tsx
import { useState } from "react";
import { useListener } from "@hyper-fetch/react";
import { onChatMessage } from "./socket"; // socket.createListener<ChatMessage>()({ topic: "chat/:roomId" })

export function ChatRoom({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<{ id: string; text: string }[]>([]);
  // setParams in render is fine: the hook re-subscribes only when the resolved topic changes
  const { connected, connecting, onEvent } = useListener(onChatMessage.setParams({ roomId }));

  onEvent(({ data }) => {
    setMessages((previous) => [...previous, data]);
  });

  if (connecting) return <p>Connecting...</p>;
  return (
    <ul aria-busy={!connected}>
      {messages.map((message) => (
        <li key={message.id}>{message.text}</li>
      ))}
    </ul>
  );
}
```

Returns (tracked values re-render only when read):

| Value                                                                                | Notes                                                                                 |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `data`                                                                               | Last delivered data (or the `select` result), `null` before the first message.        |
| `extra`                                                                              | Adapter `extra` of the last message (`MessageEvent` for WebSocket), `null` initially. |
| `connected`, `connecting`                                                            | Socket state, shared by every hook of the same socket.                                |
| `timestamp`                                                                          | `Date.now()` of the last message, `null` initially.                                   |
| `onEvent(cb)`                                                                        | `cb({ data, extra })` for every delivered message (full message, ignores `select`).   |
| `onConnected`, `onDisconnected`, `onConnecting`                                      | `() => void` callbacks.                                                               |
| `onReconnecting(cb)`, `onReconnectingFailed(cb)`                                     | `cb({ attempts })`.                                                                   |
| `onError(cb)`                                                                        | `cb({ error })` for socket errors.                                                    |
| `listen()`                                                                           | Re-subscribe manually (drops pending delivery buffers).                               |
| `setData`, `setExtra`, `setConnected`, `setConnecting`, `setTimestamp`, `clearState` | Local state setters.                                                                  |

There is no `error` value and no `disabled` option. To stop listening, do not render the component (or the hook's
owner).

Options:

| Option               | Default | Notes                                                                                                                                        |
| -------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `dependencyTracking` | `true`  | Re-render only for the returned values you read. Reading `timestamp` or `extra` re-renders on every message.                                 |
| `select`             | -       | `(data) => selected`; `data` updates only when the selected value changes. May close over props. A throw goes to the nearest error boundary. |
| `structuralSharing`  | `true`  | Keeps references of unchanged parts of the `select` result.                                                                                  |

Re-subscription happens when the socket, the resolved topic, the JSON of `listener.options` or the delivery key change.
Delivery presets are compared by value (inline objects are fine), custom strategies by identity (define them at module
level).

### Selecting a slice

```tsx
import { useListener } from "@hyper-fetch/react";
import { onPrices } from "./socket"; // createListener<Record<string, { price: number }>>()({ topic: "prices" })

export function SymbolPrice({ id }: { id: string }) {
  // Re-renders only when this symbol's price changes
  const { data: price } = useListener(onPrices, { select: (prices) => prices[id]?.price });
  return <span>{price ?? "-"}</span>;
}
```

### Throttled streams

Configure `delivery` on the listener; the hook needs nothing else. With `batch`, `data` and `onEvent` data are arrays.

```tsx
import { useMemo, useState } from "react";
import { useListener } from "@hyper-fetch/react";
import { onPrice } from "./socket"; // createListener<{ value: number }>()({ topic: "prices" })

export function Ticker() {
  const [rate, setRate] = useState(16);
  const live = useMemo(() => onPrice.setDelivery({ strategy: "latest", interval: rate }), [rate]);
  const { data } = useListener(live);
  return (
    <button type="button" onClick={() => setRate(rate === 16 ? 1000 : 16)}>
      {data?.value ?? "-"}
    </button>
  );
}
```

### Syncing HTTP cache from a hook

Use `onEvent` to update core cache, so `useFetch` consumers re-render with fresh data:

```tsx
onEvent(({ data }) => {
  client.cache.update(getNote.setParams({ noteId: data.id }), { data });
});
```

## useEmitter

```tsx
import { useState } from "react";
import { useEmitter } from "@hyper-fetch/react";
import { sendChatMessage } from "./socket"; // socket.createEmitter<{ text: string }>()({ topic: "chat/:roomId" })

export function ChatInput({ roomId }: { roomId: string }) {
  const [text, setText] = useState("");
  const [warning, setWarning] = useState<string | null>(null);
  const { emit, connected, onEmitError } = useEmitter(sendChatMessage.setParams({ roomId }));

  onEmitError(({ error }) => setWarning(error.message));

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        emit({ payload: { text } });
        setText("");
      }}
    >
      <input value={text} onChange={(event) => setText(event.target.value)} />
      <button type="submit" disabled={!connected}>
        Send
      </button>
      {warning && <p role="alert">{warning}</p>}
    </form>
  );
}
```

Returns:

| Value                                                                                                | Notes                                                                                                                 |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `emit(options?)`                                                                                     | Same typing as `emitter.emit`: `{ payload?, params? }`, required parts depend on what is set. Returns `void`.         |
| `connected`, `connecting`                                                                            | Socket state (tracked).                                                                                               |
| `onEmit(cb)`                                                                                         | `cb(emitter)` when a message of this topic starts sending.                                                            |
| `onEmitError(cb)`                                                                                    | `cb({ error })` when a message of this topic could not be sent (not connected, mapper / encoder / transport failure). |
| `onConnected`, `onDisconnected`, `onConnecting`, `onReconnecting`, `onReconnectingFailed`, `onError` | Same as `useListener`.                                                                                                |

Options: `dependencyTracking` (default `true`).

`emit` has no acknowledgement callback and nothing is queued: disable the send action while `!connected`, and handle
`onEmitError`. For a server reply, render a `useListener` on the reply topic.

## Rules for React

- Keep sockets, listeners, emitters and custom delivery strategies at module level; derive per-component variants with
  `setParams` / `setDelivery` (memoize `setDelivery` when its argument changes).
- Register callbacks (`onEvent`, `onEmit`, ...) unconditionally during render; the hook keeps the latest one.
- Do not call `socket.onConnected(...)` and other `socket.onX` registrars in components: they cannot be removed. The
  hooks and `socket.events.*` clean up.
- Server rendering: the hooks render with empty state and do not subscribe on the server.
- StrictMode double mounting is supported; subscriptions are not duplicated.
- Testing: render with `@testing-library/react`, drive messages with `createWebsocketMockingServer` from
  `@hyper-fetch/testing` (see `hyper-fetch-testing`).
