# Eslint Plugin Hyper Fetch

<p>
  <a href="https://bettertyped.com/">
    <img src="https://custom-icon-badges.demolab.com/static/v1?label=&message=BetterTyped&color=333&logo=BT" />
  </a>
  <a href="https://github.com/BetterTyped/hyper-fetch">
    <img src="https://custom-icon-badges.demolab.com/github/stars/BetterTyped/hyper-fetch?logo=star&color=118ab2" />
  </a>
  <a href="https://github.com/BetterTyped/hyper-fetch/blob/main/License.md">
    <img src="https://custom-icon-badges.demolab.com/github/license/BetterTyped/hyper-fetch?logo=law&color=yellow" />
  </a>
  <a href="https://www.npmjs.com/package/@hyper-fetch/react">
    <img src="https://custom-icon-badges.demolab.com/npm/v/@hyper-fetch/react.svg?logo=npm&color=e76f51" />
  </a>
  <a href="https://api.codeclimate.com/v1/badges/eade9435e75ecea0c004/test_coverage">
    <img src="https://api.codeclimate.com/v1/badges/eade9435e75ecea0c004/test_coverage" />
  </a>
  <a href="https://github.com/BetterTyped/hyper-fetch">
    <img src="https://custom-icon-badges.demolab.com/badge/typescript-%23007ACC.svg?logo=typescript&logoColor=white" />
  </a>
  <a href="https://www.npmjs.com/package/@hyper-fetch/react">
    <img src="https://custom-icon-badges.demolab.com/bundlephobia/minzip/@hyper-fetch/react?color=64BC4B&logo=package" />
  </a>
</p>

## About

**`Eslint Plugin Hyper Fetch`** is a plugin for eslint rules to add some additional functionality for your code static
analysis. It allows to find generic types issues like typos, missing values or completely incorrect usage of types.

## Installation

Assuming you already have ESLint installed, run:

```sh
#npm
npm i eslint-plugin-hyper-fetch

#yarn
yarn add -D eslint-plugin-hyper-fetch
```

Then extend the recommended eslint config:

```js
{
  "extends": [
    // ...
    "plugin:hyper-fetch/recommended"
  ]
}
```

### Custom Configuration

If you want more fine-grained configuration, you can instead add a snippet like this to your ESLint configuration file:

```js
{
  "plugins": [
    // ...
    "hyper-fetch"
  ],
  "rules": {
    // ...
    "hyper-fetch/client-generic-types": "error",
    "hyper-fetch/request-generic-types": "warn"
  }
}
```

## Help me keep working on this project ❤️

- [Become a Sponsor on GitHub](https://github.com/sponsors/prc5)

## Sources

- #### [Installation](https://hyperfetch.bettertyped.com/docs/documentation/getting-started/installation)
- #### [Docs](https://hyperfetch.bettertyped.com/docs/react/overview)
- #### [API](https://hyperfetch.bettertyped.com/api/)
- #### [NPM](https://www.npmjs.com/package/@hyper-fetch/react)
- #### [Guides](https://hyperfetch.bettertyped.com/guides/basic/setup)

## Other Packages

- - #### [Hyper Fetch](https://github.com/BetterTyped/hyper-fetch/tree/main/packages/core)
