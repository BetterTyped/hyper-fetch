# 🛰️ Hyper Fetch Sockets

<p align="center">
  <b>Real-time data exchange for WebSockets, SSE, and Firebase. Type-safe listeners with automatic reconnection.</b>
</p>

<p align="center">
  <a href="https://github.com/BetterTyped/hyper-fetch">
    <img src="https://img.shields.io/github/stars/BetterTyped/hyper-fetch?style=flat" alt="GitHub stars" />
  </a>
  <a href="https://www.npmjs.com/package/@hyper-fetch/sockets">
    <img src="https://img.shields.io/npm/v/@hyper-fetch/sockets" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@hyper-fetch/sockets">
    <img src="https://img.shields.io/npm/dm/@hyper-fetch/sockets" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@hyper-fetch/sockets">
    <img src="https://img.shields.io/bundlephobia/minzip/@hyper-fetch/sockets" alt="bundle size" />
  </a>
  <a href="https://github.com/BetterTyped/hyper-fetch/blob/main/License.md">
    <img src="https://img.shields.io/github/license/BetterTyped/hyper-fetch" alt="License" />
  </a>
  <a href="https://github.com/BetterTyped/hyper-fetch">
    <img src="https://img.shields.io/badge/typescript-%23007ACC.svg?logo=typescript&logoColor=white" alt="TypeScript" />
  </a>
</p>

## 📖 About

`@hyper-fetch/sockets` provides a typed abstraction for real-time communication. It wraps WebSockets and Server-Sent Events behind a consistent API with typed listeners and emitters, automatic reconnection, offline queuing, and authentication support.

## 🎯 Key Capabilities

- 🔮 **Type-safe events** — Every listener and emitter is typed end-to-end, no more `JSON.parse` guessing
- 📡 **WebSocket + SSE, one API** — Switch between protocols without rewriting your event handlers
- 🔁 **Never lose connection** — Auto-reconnect with exponential backoff handles flaky networks for you
- 📴 **Offline event queuing** — Events you emit offline are saved and sent when connection returns
- 🔐 **Auth built in** — Token and session-based authentication flows for socket connections
- ⚛️ **React hooks included** — `useListener` and `useEmitter` plug real-time data straight into components
- 🖥️ **SSR safe** — Import in server-rendered apps without breaking hydration

## 🚀 Quick Start

```bash
npm install @hyper-fetch/sockets
```

```ts
import { Socket } from "@hyper-fetch/sockets";

const socket = new Socket({ url: "ws://localhost:3000" });

const onMessage = socket.createListener<{ response: { text: string; author: string } }>()({
  endpoint: "chat-message",
});

onMessage.listen({ callback: ({ data }) => console.log(`${data.author}: ${data.text}`) });
```

## 📚 Documentation

- [Getting Started](https://hyperfetch.bettertyped.com/docs/getting-started/quick-start)
- [Sockets Overview](https://hyperfetch.bettertyped.com/docs/sockets/overview)
- [API Reference](https://hyperfetch.bettertyped.com/api/)

## 💡 Examples

### Emitting typed events

```ts
const sendMessage = socket.createEmitter<{ payload: { text: string; room: string } }>()({
  endpoint: "send-message",
});

sendMessage.emit({ data: { text: "Hello!", room: "general" } });
```

### Listening with React hooks

```tsx
import { useListener } from "@hyper-fetch/react";

const ChatMessages = ({ room }: { room: string }) => {
  const { data, connected, timestamp } = useListener(onMessage);

  return (
    <div>
      <p>Status: {connected ? "Connected" : "Disconnected"}</p>
      {data && (
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
const sseSocket = new Socket({ url: "https://api.example.com/events" });

const onUpdate = sseSocket.createListener<{ response: { type: string; payload: unknown } }>()({
  endpoint: "data-update",
});

onUpdate.listen({
  callback: ({ data }) => console.log(`Event: ${data.type}`, data.payload),
});
```

## License

[MIT](https://github.com/BetterTyped/hyper-fetch/blob/main/License.md)
