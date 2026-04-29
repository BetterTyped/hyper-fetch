# 🧪 Hyper Fetch Testing

<p align="center">
  <b>Internal testing utilities for stubbing HyperFetch requests and sockets in test environments.</b>
</p>

<p align="center">
  <a href="https://github.com/BetterTyped/hyper-fetch">
    <img src="https://img.shields.io/github/stars/BetterTyped/hyper-fetch?style=flat" alt="GitHub stars" />
  </a>
  <a href="https://github.com/BetterTyped/hyper-fetch/blob/main/License.md">
    <img src="https://img.shields.io/github/license/BetterTyped/hyper-fetch" alt="License" />
  </a>
  <a href="https://github.com/BetterTyped/hyper-fetch">
    <img src="https://img.shields.io/badge/typescript-%23007ACC.svg?logo=typescript&logoColor=white" alt="TypeScript" />
  </a>
</p>

## 📖 About

`@hyper-fetch/testing` provides utilities for mocking and stubbing HyperFetch requests and WebSocket connections in test suites. It is primarily used internally across the HyperFetch monorepo.

## 🎯 Key Capabilities

- 🔮 **Mock any request instantly** — Stub responses with custom data and status codes in one call
- 🧪 **Test sockets too** — Mock WebSocket listeners and emitters for real-time test scenarios
- 🚫 **Zero network calls** — All mocked requests resolve locally, tests stay fast and deterministic

## 💡 Examples

### Mock a request

```ts
import { getUser } from "./api";

const mockedRequest = getUser.setMock({
  data: { id: 1, name: "John Doe", email: "john@example.com" },
  status: 200,
});

const { data } = await mockedRequest.send();
console.log(data.name); // "John Doe"
```

## License

[MIT](https://github.com/BetterTyped/hyper-fetch/blob/main/License.md)
