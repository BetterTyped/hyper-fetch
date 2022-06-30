# Hyper Fetch

[![BetterTyped](https://img.shields.io/static/v1?label=Created%20by&message=BetterTyped&color=blue&logo=BT)](https://github.com/BetterTyped)
[![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/BetterTyped/hyper-fetch/issues)
[![semantic-release: angular](https://img.shields.io/badge/semantic--release-commitzen-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)
[![Maintainability](https://api.codeclimate.com/v1/badges/eade9435e75ecea0c004/maintainability)](https://codeclimate.com/github/BetterTyped/hyper-fetch/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/eade9435e75ecea0c004/test_coverage)](https://codeclimate.com/github/BetterTyped/hyper-fetch/test_coverage)
[![License](https://badgen.net/github/license/BetterTyped/hyper-fetch?color=yellow)](https://github.com/BetterTyped/hyper-fetch/blob/main/License.md)
[![Stars](https://badgen.net/github/stars/BetterTyped/hyper-fetch?color=green&icon=github)](https://github.com/BetterTyped/hyper-fetch)
[![REST](https://img.shields.io/badge/-REST-informational?logo=telegram&color=grey)](https://github.com/BetterTyped/hyper-fetch)
[![GraphQL](https://img.shields.io/badge/-GraphQL-E10098?logo=graphql&logoColor=white)](https://github.com/BetterTyped/hyper-fetch)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?logo=typescript&logoColor=white)](https://github.com/BetterTyped/hyper-fetch)
[![HitCount](https://hits.dwyl.com/BetterTyped/hyper-fetch.svg?style=?style=plastic&logo=appveyor)](http://hits.dwyl.com/BetterTyped/hyper-fetch)
[![Join the chat at https://gitter.im/hyper-fetch/community](https://img.shields.io/badge/chat%20-on%20gitter-brightgreen.svg?logo=gitter&color=blueviolet)](https://gitter.im/hyper-fetch/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## About

**`Hyper Fetch`** is a fetch library, and what makes it unique is the number of solutions provided and the **ease of
use**. This library is `backend agnostic` and aims to provide as many great and useful features as possible, in
particular - caching, queuing, persistence, offline first support, request deduplication, authentication, easy progress
tracking, structure and architecture solutions.

## Features

✨ **Simple config** – Hyper Fetch has prepared `setup out of the box` - from caching, queueing to query parameters
parsing, deduplication and much more. It has built-in http client to help you with often problematic setup, at the same
time allowing you to use your favorite libraries like Axios or Fetch!

⚡️ **Lighting fast** – Our `caching and request deduplication` solutions allow you to take advantage of fully modern
fetching approach. This way you not only save your time, but also resources as we dramatically can reduce and optimize
the frontend to backend communication.

🚀 **Persistance and offline** – Did you ever had the problem with connection or your device crashed? We provide
solutions to solve data loss problems - with command approach we can store and persist(with some storage based
limitations) data and restore them in subsequent sessions allowing for fully offline first experience.

💎 **Queueing** – If you need to send requests in an orderly manner, we have solutions that allow you to use one of
several approaches. `Concurrent` to allow you to send all requests at once, `one-by-one` to send them in order or
`only-last` to cancel all running requests except the last one and the `deduplicated` to send only one at the given
time.

🌍 **Opinionated** – Hyper Fetch was built with architecture in mind to tackle multiple problems at once. By observing
the fetch approach and setup creation, we have developed a structure that should be readable by everyone.

## Sources

- #### [Quick Start](https://hyperfetch.bettertyped.com/docs/Getting%20Started/Quick%20Start)
- #### [Docs](https://hyperfetch.bettertyped.com/)
- #### [API](https://hyperfetch.bettertyped.com/api/)
- #### [Guides](https://hyperfetch.bettertyped.com/guides/Basic/Dispatching)

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
      </td>
    </tr>
    <tr>
      <td>
        <a href="https://github.com/BetterTyped/hyper-fetch/tree/main/packages/react" >React Hyper Fetch</a>
      </td>
      <td>
        <a href="https://www.npmjs.com/package/@better-typed/react-hyper-fetch"><img src="https://img.shields.io/npm/dm/@better-typed/react-hyper-fetch" /></a>
        <a href="https://www.npmjs.com/package/@better-typed/react-hyper-fetch"><img src="https://img.shields.io/npm/v/@better-typed/react-hyper-fetch.svg"/></a>
      </td>
    </tr>
  </tbody>
</table>

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
