# browserClient

<div class="api-docs__separator">

---

</div><div class="api-docs__import">

```ts
import { browserClient } from "@hyper-fetch/core";
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

</span></div><p class="api-docs__definition">

Defined in
[client/fetch.client.browser.ts:4](https://github.com/BetterTyped/hyper-fetch/blob/3fe127e9/packages/core/src/client/fetch.client.browser.ts#L4)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview fn">

```ts
browserClient(command, requestId);
```

</div><div class="api-docs__section">

## Parameters

</div>
<div class="api-docs__parameters">
<table>
<thead><tr><th>Name</th><th>Details</th></tr></thead>
<tbody><tr param-data="command"><td class="api-docs__param-name required">

### command

`Required`

</td><td class="api-docs__param-type">

`CommandInstance`

</td></tr><tr param-data="requestId"><td class="api-docs__param-name required">

### requestId

`Required`

</td><td class="api-docs__param-type">

`string`

</td></tr></tbody></table></div><div class="api-docs__section">

## Returns

</div><div class="api-docs__returns">

```ts
Promise<ClientResponseType<any, any>>;
```

</div>
