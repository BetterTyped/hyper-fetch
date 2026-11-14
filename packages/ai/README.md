# 🤖 Hyper Fetch AI

<p align="center">
  <b>Provider-agnostic, end-to-end typed AI chat for your frontend. Works with Vercel AI SDK, TanStack AI and any AG-UI agent.</b>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@hyper-fetch/ai">
    <img src="https://custom-icon-badges.demolab.com/npm/v/@hyper-fetch/ai.svg?logo=npm&color=e76f51" />
  </a>
  <a href="https://github.com/BetterTyped/hyper-fetch/blob/main/License.md">
    <img src="https://custom-icon-badges.demolab.com/github/license/BetterTyped/hyper-fetch?logo=law&color=yellow" />
  </a>
</p>

## About

Keep your backend on the AI library you like - providers, models and tool loops stay on the server. `@hyper-fetch/ai`
is the frontend: it speaks the wire protocols of those libraries on top of regular HyperFetch requests, so auth,
plugins, retries, devtools and mocking work for your chat endpoint like for any other request.

- **Backends**: Vercel AI SDK 5 - 7 (UI message stream and text stream), TanStack AI 1.x, any AG-UI 1.0 agent
- **End-to-end types**: derive tool, data, metadata and state types from your server with `InferAISDKChatTypes` or
  `InferChatTools`
- **Chat features**: typed message parts, streaming tool input, client tools, approvals, interrupts, shared agent
  state, stop, regenerate, resume, automatic follow-up requests
- **Structured output**: `useObject` with partial objects and Standard Schema validation
- **Testing**: encoders that produce real AI SDK / AG-UI streams for the HyperFetch mocker

## Installation

```bash
npm install @hyper-fetch/core @hyper-fetch/ai
```

## Usage

```tsx
import { createClient } from "@hyper-fetch/core";
import { aiSDKProtocol, type InferAISDKChatTypes } from "@hyper-fetch/ai";
import { useChat } from "@hyper-fetch/ai/react";
import type { ChatMessage } from "../server/chat"; // your AI SDK UIMessage type

const client = createClient({ url: "http://localhost:3000" });
const chatRequest = client.createRequest<{ response: string; payload: unknown }>()({
  endpoint: "/api/chat",
  method: "POST",
});

function Chat() {
  const { messages, sendMessage, status, stop } = useChat<InferAISDKChatTypes<ChatMessage>>({
    request: chatRequest,
    protocol: aiSDKProtocol(), // or tanstackAIProtocol(), aguiProtocol()
  });

  return (
    <>
      {messages.map((message) => (
        <p key={message.id}>
          {message.parts.map((part) => (part.type === "text" ? part.text : null))}
        </p>
      ))}
      <button onClick={() => sendMessage("Hello!")}>Send</button>
      {status === "streaming" && <button onClick={stop}>Stop</button>}
    </>
  );
}
```

## Documentation

[hyperfetch.bettertyped.com/docs/ai/overview](https://hyperfetch.bettertyped.com/docs/ai/overview)
