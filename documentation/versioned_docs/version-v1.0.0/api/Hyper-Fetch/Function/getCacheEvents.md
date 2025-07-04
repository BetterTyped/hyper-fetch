# getCacheEvents

<div class="api-docs__separator">

---

</div><div class="api-docs__import">

```ts
import { getCacheEvents } from "@hyper-fetch/core";
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

</span></div><p class="api-docs__definition">

Defined in
[cache/cache.events.ts:6](https://github.com/BetterTyped/hyper-fetch/blob/3fe127e9/packages/core/src/cache/cache.events.ts#L6)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview fn">

```ts
getCacheEvents(emitter);
```

</div><div class="api-docs__section">

## Parameters

</div>
<div class="api-docs__parameters">
<table>
<thead><tr><th>Name</th><th>Details</th></tr></thead>
<tbody><tr param-data="emitter"><td class="api-docs__param-name required">

### emitter

`Required`

</td><td class="api-docs__param-type">

`EventEmitter`

</td></tr></tbody></table></div><div class="api-docs__section">

## Returns

</div><div class="api-docs__returns">

```ts
{
  emitCacheData: (cacheKey: string, data: CacheValueType<Response, Error>) => void;
  emitRevalidation: (cacheKey: string) => void;
  onData: (cacheKey: string, callback: (data: CacheValueType<Response, Error>) => void) => VoidFunction;
  onRevalidate: (cacheKey: string, callback: () => void) => VoidFunction;
}
```

</div>
