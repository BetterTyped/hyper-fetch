# 🛰️ Hyper Fetch Sockets

<p align="center">
  <b>Real-time data exchange for WebSockets, SSE, and Firebase. Type-safe listeners with automatic reconnection.</b>
</p>

<p align="center">
  <a href="https://bettertyped.com/">
    <img src="https://custom-icon-badges.demolab.com/static/v1?label=&message=BetterTyped&color=333&logo=BT" />
  </a>
  <a href="https://github.com/BetterTyped/hyper-fetch">
    <img src="https://custom-icon-badges.demolab.com/github/stars/BetterTyped/hyper-fetch?logo=star&color=118ab2" />
  </a>
  <a href="https://github.com/BetterTyped/hyper-fetch/blob/main/License.md">
    <img src="https://custom-icon-badges.demolab.com/github/license/BetterTyped/hyper-fetch?logo=law&color=yellow" />
  </a>
  <a href="https://www.npmjs.com/package/@hyper-fetch/sockets">
    <img src="https://custom-icon-badges.demolab.com/npm/v/@hyper-fetch/sockets.svg?logo=npm&color=e76f51" />
  </a>
  <a href="https://www.npmjs.com/package/@hyper-fetch/sockets">
    <img src="https://custom-icon-badges.demolab.com/npm/dm/@hyper-fetch/sockets?logoColor=fff&logo=trending-up" />
  </a>
  <a href="https://github.com/BetterTyped/hyper-fetch">
    <img src="https://custom-icon-badges.demolab.com/badge/typescript-%23007ACC.svg?logo=typescript&logoColor=white" />
  </a>
  <a href="https://bundlephobia.com/package/@hyper-fetch/sockets">
    <img src="https://custom-icon-badges.demolab.com/bundlephobia/minzip/@hyper-fetch/sockets?color=64BC4B&logo=package" />
  </a>
</p>

## 📖 About

`@hyper-fetch/sockets` provides a typed abstraction for real-time communication. It wraps WebSockets and Server-Sent
Events behind a consistent API with typed listeners and emitters, automatic reconnection, delivery strategies for fast
streams, and authentication support.

## 🎯 Key Capabilities

- 🔮 **Type-safe events** — Every listener and emitter is typed end-to-end, no more `JSON.parse` guessing
- 📡 **WebSocket + SSE, one API** — Switch between protocols without rewriting your event handlers
- 🔁 **Never lose connection** — Auto-reconnect on a fixed interval (`reconnect`, `reconnectTime`), with listeners kept
  across reconnects
- 🚦 **Tame fast streams** — `latest` and `batch` delivery strategies throttle or batch messages per listener
- 🔐 **Auth built in** — Resolve tokens per connection attempt with the `onConnect` interceptor
- ⚛️ **React hooks included** — `useListener` and `useEmitter` plug real-time data straight into components
- 🖥️ **SSR safe** — Import in server-rendered apps without breaking hydration

## 🚀 Quick Start

```bash
npm install @hyper-fetch/sockets
```

```ts
import { createSocketClient } from "@hyper-fetch/sockets";

const socket = createSocketClient({ url: "ws://localhost:3000" });

const onMessage = socket.createListener<{ text: string; author: string }>()({
  topic: "chat-message",
});

const stopListening = onMessage.listen(({ data }) => console.log(`${data.author}: ${data.text}`));
```

## 📚 Documentation

- [Getting Started](https://hyperfetch.bettertyped.com/docs/getting-started/quick-start)
- [Sockets Overview](https://hyperfetch.bettertyped.com/docs/sockets/overview)
- [API Reference](https://hyperfetch.bettertyped.com/api/)

## 💡 Examples

### Emitting typed events

```ts
const sendMessage = socket.createEmitter<{ text: string; room: string }>()({
  topic: "send-message",
});

sendMessage.emit({ payload: { text: "Hello!", room: "general" } });
```

`emit()` returns `void` and nothing is queued: a message emitted while the socket is not connected is dropped and
reported through `socket.events.onEmitterError`.

### Listening with React hooks

```tsx
import { useListener } from "@hyper-fetch/react";

const ChatMessages = ({ room }: { room: string }) => {
  const { data, connected, timestamp } = useListener(onMessage);

  return (
    <div>
      <p>Status: {connected ? "Connected" : "Disconnected"}</p>
      {data && timestamp && (
        <div>
          <strong>{data.author}</strong>: {data.text}
          <small>{new Date(timestamp).toLocaleTimeString()}</small>
        </div>
      )}
    </div>
  );
};
```

### Server-Sent Events

```ts
import { createSocketClient, ServerSentEventsAdapter } from "@hyper-fetch/sockets";

const sseSocket = createSocketClient({
  url: "https://api.example.com/events",
  adapter: ServerSentEventsAdapter(),
});

const onUpdate = sseSocket.createListener<{ type: string; payload: unknown }>()({
  topic: "data-update",
});

onUpdate.listen(({ data }) => console.log(`Event: ${data.type}`, data.payload));
```

Server-Sent Events are receive-only: calling `emit()` on an SSE socket throws.

## License

[Apache-2.0](https://github.com/BetterTyped/hyper-fetch/blob/main/License.md)
