# getValidCacheData

<div class="api-docs__separator">

---

</div><div class="api-docs__import">

```ts
import { getValidCacheData } from "@hyper-fetch/react";
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

</span></div><p class="api-docs__definition">

Defined in
[helpers/use-tracked-state/use-tracked-state.utils.ts:33](https://github.com/BetterTyped/hyper-fetch/blob/3fe127e9/packages/react/src/helpers/use-tracked-state/use-tracked-state.utils.ts#L33)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview fn">

```ts
getValidCacheData<T>(command, initialData, cacheData);
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

`T`

</td></tr><tr param-data="initialData"><td class="api-docs__param-name required">

### initialData

`Required`

</td><td class="api-docs__param-type">

`ClientResponseType<ExtractResponse<T>, ExtractError<T>>`

</td></tr><tr param-data="cacheData"><td class="api-docs__param-name required">

### cacheData

`Required`

</td><td class="api-docs__param-type">

`CacheValueType<ExtractResponse<T>, ExtractError<T>>`

</td></tr></tbody></table></div><div class="api-docs__section">

## Returns

</div><div class="api-docs__returns">

```ts
{
  cacheTime: number;
  clearKey: string;
  data: ClientResponseType<Response, Error>;
  details: CommandResponseDetails;
  garbageCollection: number;
}
```

</div>
