
      
# getCacheEvents

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview fn">

```ts
getCacheEvents(emitter)
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [cache/cache.events.ts:6](https://github.com/BetterTyped/hyper-fetch/blob/1a97772c/packages/core/src/cache/cache.events.ts#L6)

</div><div class="api-docs__section">

## Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr param-data="emitter"><td>

**emitter**

</td><td>

`EventEmitter`

</td><td>



</td></tr></tbody></table></div><div class="api-docs__section">

## Returns

</div><div class="api-docs__returns">

```ts
{ emitCacheData: <Response, Error>(cacheKey: string, data: CacheValueType<Response, Error>) => void; emitRevalidation: (cacheKey: string) => void; onData: <Response, Error>(cacheKey: string, callback: (data: CacheValueType<Response, Error>) => void) => VoidFunction; onRevalidate: (cacheKey: string, callback: () => void) => VoidFunction }
```

</div>