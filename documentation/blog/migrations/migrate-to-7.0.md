---
slug: migrate-to-7-0
title: Migrate to v7
authors: [maciej]
tags: [Migration]
image: ./img/migrate.png
date: 2025-06-28
---

# Migration Guide: HyperFetch v7

[![Migrate](./img/migrate.png)](/blog/migrate-to-7-0)

> Welcome to the official migration guide for upgrading to HyperFetch v7. This guide will walk you through the key
> changes, breaking updates, and recommended steps to update your codebase efficiently.

<!-- truncate -->

---

## ESM-Only Support

HyperFetch v7 is now an ESM-only package. We have fully dropped support for CommonJS (CJS) to embrace modern JavaScript
standards.

You will need to ensure your build system and tooling (e.g., bundlers, Node.js, TypeScript) are configured to support
ESM modules. For many projects, this involves setting `"type": "module"` in your `package.json`.

---

## Core Library Changes

### 1. New Object-Based Type Initialization

We've redesigned how request types are defined to improve readability and flexibility. Instead of a tuple-like generic,
you now use an object with named keys. This change allows you to provide only the types you need, in any order.

**Before (v6)**

```ts
import { client } from "./client";

const request = client.createRequest<ResponseType, PayloadType, LocalError, QueryParams>()({
  endpoint: "/",
});
```

**Now (v7)**

```ts
import { client } from "./client";

const request = client.createRequest<{
  response: ResponseType;
  payload: PayloadType;
  error: LocalErrorType;
  queryParams: QueryParams;
}>()({ endpoint: "/" });
```

:::tip ESLint Plugin

To help with this transition and prevent typos, we recommend using our new
[ESLint plugin](/docs/integrations/plugin-eslint/).

:::

### 2. Adapters Are Now Classes

Adapter configuration has been refactored. Methods like `setDefaultMethod` or `setHeaderMapper` have been moved from the
`Client` to the adapter instance itself, making the setup more modular and improving TypeScript inference.

You will need to update your adapter usage to instantiate them as classes and configure them directly.

### 3. Naming Convention: `setData` is now `setPayload`

To better distinguish between request and response data, `request.setData()` has been renamed to `request.setPayload()`.

```ts
// Before
request.setData({ ... });

// code-editor-split

// Now
request.setPayload({ ... });
```

### 4. `RequestEffects` are now Plugins

`RequestEffects` have been renamed to **Plugins**. Their scope has been expanded, allowing them to hook into key
lifecycle events across the entire library, not just requests. You will need to update your effects logic to use the new
Plugin API.

### 5. `queueKey` is now `queryKey`

All instances of `queueKey` should be renamed to `queryKey`. This is a simple find-and-replace change across your
project.

### 6. Simplified Mocking API

The `request.setMock()` method now accepts a single, more flexible function for defining mocks. This simplifies testing
and development workflows.

### 7. Other Notable Changes

- **Improved Deduplication**: Request deduplication now persists as long as similar requests are processing, with
  options to configure the wait time.
- **New SSR Hydration APIs**: We've introduced new and improved APIs for server-side rendering (SSR) hydration.
- **Granular Caching**: New `cacheTime` and `staleTime` options provide more control over caching behavior.

---

## React Package Changes

### Hook Adjustments & Stronger Type Safety

All React hooks (`useFetch`, `useSubmit`, etc.) have been updated to align with the new core API. As a significant
improvement, TypeScript will now raise an error if you attempt to dispatch a request without setting all required
parameters (e.g., URL params, payload), preventing runtime errors.

### Provider Renamed: `<ConfigProvider />` → `<HyperFetchProvider />`

For better clarity and naming consistency, the `<ConfigProvider />` has been renamed to `<HyperFetchProvider />`. You'll
need to update this in your application's component tree.

```tsx
// Before
import { ConfigProvider } from "@hyper-fetch/react";

const App = () => {
  return <ConfigProvider client={client}>...</ConfigProvider>;
};

// code-editor-split

// Now
import { HyperFetchProvider } from "@hyper-fetch/react";

const App = () => {
  return <HyperFetchProvider client={client}>...</HyperFetchProvider>;
};
```

### `useQueue` Enhancements

The `useQueue` hook can now retain finished requests in memory. This is particularly useful for building developer tools
or UI visualizations that need access to a history of requests.

---

## Sockets Package Changes

### Adapter Instantiation

Just like with the core library, Socket adapters are now classes and must be instantiated when creating a new `Socket`
instance.

```ts
// Before
import { websocketAdapter } from "@hyper-fetch/sockets";

new Socket({ adapter: websocketAdapter() });

// code-editor-split

// Now
import { WebsocketAdapter } from "@hyper-fetch/sockets";

new Socket({ adapter: WebsocketAdapter() });
```

```ts
// Before
import { sseAdapter } from "@hyper-fetch/sockets";

new Socket({ adapter: sseAdapter() });

// code-editor-split

// Now
import { ServerSentEventsAdapter } from "@hyper-fetch/sockets";

new Socket({ adapter: ServerSentEventsAdapter() });
```

### Emitter Acknowledgements Removed

Acknowledgements have been removed from the core `Emitter`. This change was made because the previous implementation was
too tightly coupled to specific adapters. For a more robust and adapter-agnostic solution, you should now handle
acknowledgements manually using listeners.

---

For more details and code examples, see the [full documentation](https://hyperfetch.dev/). If you encounter issues,
check the migration FAQ or open an issue on GitHub.
