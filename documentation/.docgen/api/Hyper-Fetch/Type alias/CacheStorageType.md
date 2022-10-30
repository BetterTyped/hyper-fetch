
      
# CacheStorageType

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type">

```ts
type CacheStorageType = {
  clear: () => void; 
  delete: (key: string) => void; 
  get: <Response, Error>(key: string) => CacheValueType<Response, Error> | undefined; 
  keys: () => string[] | IterableIterator<string> | string[]; 
  set: <Response, Error>(key: string, data: CacheValueType<Response, Error>) => void; 
}
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [cache/cache.types.ts:48](https://github.com/BetterTyped/hyper-fetch/blob/1a97772c/packages/core/src/cache/cache.types.ts#L48)

</div>