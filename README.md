# ⚡ Hyper Fetch

[![BetterTyped](https://img.shields.io/static/v1?label=Created%20by&message=BetterTyped&color=blue&logo=BT)](https://github.com/BetterTyped)
[![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/BetterTyped/hyper-fetch/issues)
[![semantic-release: angular](https://img.shields.io/badge/semantic--release-commitzen-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)
[![License](https://badgen.net/github/license/BetterTyped/hyper-fetch?color=yellow)](https://github.com/BetterTyped/hyper-fetch/blob/main/License.md)
[![Maintainability](https://api.codeclimate.com/v1/badges/eade9435e75ecea0c004/maintainability)](https://codeclimate.com/github/BetterTyped/hyper-fetch/maintainability)
[![Stars](https://badgen.net/github/stars/BetterTyped/hyper-fetch?color=green&icon=github)](https://github.com/BetterTyped/hyper-fetch)
[![REST](https://img.shields.io/badge/-REST-informational?logo=telegram&color=grey)](https://github.com/BetterTyped/hyper-fetch)
[![GraphQL](https://img.shields.io/badge/-GraphQL-E10098?logo=graphql&logoColor=white)](https://github.com/BetterTyped/hyper-fetch)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?logo=typescript&logoColor=white)](https://github.com/BetterTyped/hyper-fetch)
[![Test Coverage](https://api.codeclimate.com/v1/badges/eade9435e75ecea0c004/test_coverage)](https://codeclimate.com/github/BetterTyped/hyper-fetch/test_coverage)
[![Hits](https://hits.sh/github.com/BetterTyped/hyper-fetch.svg?color=11b8cc)](https://hits.sh/github.com/BetterTyped/hyper-fetch/)
[![Join the chat at https://gitter.im/hyper-fetch/community](https://img.shields.io/badge/chat%20-on%20gitter-brightgreen.svg?logo=gitter&color=blueviolet)](https://gitter.im/hyper-fetch/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## About

**`Hyper Fetch`** is a data-exchange framework. What makes it unique is the **typesafe design** and the **ease of use**.
This library is `backend and framework agnostic`, with aim to provide as many great and useful features as possible. In
particular `caching`, `queuing`, `persistence`, `offline first support`, `request deduplication`, `authentication`,
`progress tracking`, `structure and architecture` guidelines.

## Features

🔮 **Simple setup** - [Read more](https://hyperfetch.bettertyped.com/docs/Getting%20Started/Quick%20Start)

🎯 **Request cancelation** - [Read more](https://hyperfetch.bettertyped.com/guides/Advanced/Cancelation)

✨ **Window Focus/Blur Events** - [Read more](https://hyperfetch.bettertyped.com/guides/React/Window%20Focus%20&%20Blur)

🚀 **Queueing** - [Read more](https://hyperfetch.bettertyped.com/guides/Advanced/Queueing)

💎 **Automatic caching** - [Read more](https://hyperfetch.bettertyped.com/docs/Architecture/Cache)

🪄 **Persistance** - [Read more](https://hyperfetch.bettertyped.com/guides/Advanced/Persistence)

🎊 **SSR Support** - [Read more](https://hyperfetch.bettertyped.com/docs/Getting%20Started/Environment)

🔋 **Offline first ready** - [Read more](https://hyperfetch.bettertyped.com/guides/Advanced/Offline)

📡 **Built-in client** - [Read more](https://hyperfetch.bettertyped.com/docs/Architecture/Client)

🧪 **Easy to test** - [Read more](https://hyperfetch.bettertyped.com/docs/Getting%20Started/Testing)

🧩 **Authentication** - [Read more](https://hyperfetch.bettertyped.com/guides/Basic/Authentication)

💡 **Prefetching** - [Read more](https://hyperfetch.bettertyped.com/guides/Advanced/Prefetching)

## Sources

- #### [Quick Start](https://hyperfetch.bettertyped.com/docs/Getting%20Started/Quick%20Start)
- #### [Docs](https://hyperfetch.bettertyped.com/)
- #### [API](https://hyperfetch.bettertyped.com/api/)
- #### [Guides](https://hyperfetch.bettertyped.com/guides/Basic/Dispatching)

## Installation

### Clean

```bash
npm install --save @better-typed/hyper-fetch
or
yarn add @better-typed/hyper-fetch
```

### React

```bash
npm install --save @better-typed/hyper-fetch @better-typed/react-hyper-fetch
or
yarn add @better-typed/hyper-fetch @better-typed/react-hyper-fetch
```

## Packages

<table>
  <thead>
    <tr>
      <th>Package</th>
      <th>Stats</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>
        <a href="https://github.com/BetterTyped/hyper-fetch/tree/main/packages/core" >Hyper Fetch</a>
      </td>
      <td>
        <a href="https://www.npmjs.com/package/@better-typed/hyper-fetch"><img src="https://img.shields.io/npm/dm/@better-typed/hyper-fetch"/></a>
        <a href="https://www.npmjs.com/package/@better-typed/hyper-fetch"><img src="https://img.shields.io/npm/v/@better-typed/hyper-fetch.svg"/></a>
        <a href="https://www.npmjs.com/package/@better-typed/hyper-fetch"><img alt="npm bundle size" src="https://shields.api-test.nl/bundlephobia/min/@better-typed/hyper-fetch"></a>
      </td>
    </tr>
    <tr>
      <td>
        <a href="https://github.com/BetterTyped/hyper-fetch/tree/main/packages/react" >React Hyper Fetch</a>
      </td>
      <td>
        <a href="https://www.npmjs.com/package/@better-typed/react-hyper-fetch"><img src="https://img.shields.io/npm/dm/@better-typed/react-hyper-fetch" /></a>
        <a href="https://www.npmjs.com/package/@better-typed/react-hyper-fetch"><img src="https://img.shields.io/npm/v/@better-typed/react-hyper-fetch.svg"/></a>
        <a href="https://www.npmjs.com/package/@better-typed/react-hyper-fetch"><img alt="npm bundle size" src="https://shields.api-test.nl/bundlephobia/min/@better-typed/react-hyper-fetch"></a>
      </td>
    </tr>
  </tbody>
</table>

## Example

```tsx
import { Builder } from "@better-typed/hyper-fetch";
import { useFetch, useSubmit } from "@better-typed/react-hyper-fetch";

// Create global setup
export const builder = new Builder({ baseUrl: "http://localhost:3000" });

// Create reusable command to trigger requests
export const postData = builder.createCommand<ResponseType, RequestType, LocalErrorType, QueryParamsType>()({
  method: "POST",
  endpoint: "/data/:accountId",
});

// Set the information to command (it returns command clone)
const command = postData
  .setParams({ accountId: 104 }) // Set Params
  .setQueryParams({ paramOne: "test", paramTwo: "test2" })
  .setData({ name: "My new entity", description: "Some description" }); // Add payload data

// Use command directly
const [data, error, status] = await command.send();

// OR pass dynamic data directly to '.send' method
const [data, error, status] = await command.send({
  params: { accountId: 104 },
  data: { name: "My new entity", description: "Some description" },
  queryParams: { paramOne: "test", paramTwo: "test2" },
});

/**
 * OR use with react hooks
 **/

// Lifecycle fetching
const { data, error, isLoading } = useFetch(command);

// Manual triggering
const { submit, data, error, isSubmitting } = useSubmit(command);

return <button onClick={() => submit()}>Trigger request!</button>;

// OR
return (
  <button
    onClick={() =>
      submit({
        params: { accountId: 104 },
        data: { name: "My new entity", description: "Some description" },
        queryParams: { paramOne: "test", paramTwo: "test2" },
      })
    }
  >
    Trigger request!
  </button>
);
```

#### [Find out more examples](https://hyperfetch.bettertyped.com/guides/Basic/Dispatching)
