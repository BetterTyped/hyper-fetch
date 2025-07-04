# interceptResponse

<div class="api-docs__separator">

---

</div><div class="api-docs__import">

```ts
import { interceptResponse } from "@hyper-fetch/core";
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

</span></div><p class="api-docs__definition">

Defined in
[builder/builder.utils.ts:36](https://github.com/BetterTyped/hyper-fetch/blob/3fe127e9/packages/core/src/builder/builder.utils.ts#L36)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview fn">

```ts
interceptResponse<GlobalErrorType>(interceptors, response, command);
```

</div><div class="api-docs__section">

## Parameters

</div>
<div class="api-docs__parameters">
<table>
<thead><tr><th>Name</th><th>Details</th></tr></thead>
<tbody><tr param-data="interceptors"><td class="api-docs__param-name required">

### interceptors

`Required`

</td><td class="api-docs__param-type">

`ResponseInterceptorCallback<any, any>[]`

</td></tr><tr param-data="response"><td class="api-docs__param-name required">

### response

`Required`

</td><td class="api-docs__param-type">

`ClientResponseType<any, GlobalErrorType>`

</td></tr><tr param-data="command"><td class="api-docs__param-name required">

### command

`Required`

</td><td class="api-docs__param-type">

`CommandInstance`

</td></tr></tbody></table></div><div class="api-docs__section">

## Returns

</div><div class="api-docs__returns">

```ts
Promise<ClientResponseType<any, GlobalErrorType>>;
```

</div>
