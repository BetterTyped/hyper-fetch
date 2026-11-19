# 🎡 Hyper Fetch tRPC

<p align="center">
  <b>tRPC adapter for HyperFetch. Typed procedures with caching, queueing and React hooks.</b>
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
  <a href="https://www.npmjs.com/package/@hyper-fetch/trpc">
    <img src="https://custom-icon-badges.demolab.com/npm/v/@hyper-fetch/trpc.svg?logo=npm&color=e76f51" />
  </a>
</p>

## 📖 About

This adapter connects HyperFetch to a tRPC server. Procedures become regular HyperFetch requests, with types inferred
from your router through `createSdk`.

## 🎯 Key Capabilities

- 🔮 **End-to-end types** — Inputs, outputs and errors inferred from your `AppRouter`
- 💾 **Smart caching included** — Every procedure input is cached separately
- ⚛️ **React-ready** — Use `useFetch` and `useSubmit` with your procedures
- 🔁 **Transformers** — Works with `superjson` and any `serialize` / `deserialize` pair

## 🚀 Quick Start

```bash
npm install @hyper-fetch/core @hyper-fetch/trpc
```

```ts
import { createClient, createSdk } from "@hyper-fetch/core";
import { TrpcAdapter } from "@hyper-fetch/trpc";
import type { TrpcSchema } from "@hyper-fetch/trpc";

import type { AppRouter } from "./server";

const client = createClient({ url: "http://localhost:3000/trpc" }).setAdapter(TrpcAdapter());

const api = createSdk<typeof client, TrpcSchema<AppRouter>>(client, { camelCaseToKebabCase: false });

const { data: user } = await api.user.byId.$query.setPayload({ id: 1 }).send();
const { data: created } = await api.user.create.$mutation.setPayload({ name: "John" }).send();
```

## 📚 Documentation

- [tRPC Adapter Docs](https://hyperfetch.bettertyped.com/docs/integrations/adapter-trpc/overview)
- [Getting Started](https://hyperfetch.bettertyped.com/docs/getting-started/quick-start)
- [API Reference](https://hyperfetch.bettertyped.com/api/)

## License

[Apache-2.0](https://github.com/BetterTyped/hyper-fetch/blob/main/License.md)
