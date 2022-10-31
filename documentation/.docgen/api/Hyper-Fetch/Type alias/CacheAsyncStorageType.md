

# CacheAsyncStorageType

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { CacheAsyncStorageType } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [cache/cache.types.ts:41](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/cache/cache.types.ts#L41)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type">

```ts
type CacheAsyncStorageType = {
  delete: (key: string) => Promise<void>; 
  get: <Response,Error>(key: string) => Promise<CacheValueType<Response, Error> | undefined>; 
  keys: () => Promise<string[] | IterableIterator<string> | string[]>; 
  set: <Response,Error>(key: string, data: CacheValueType<Response, Error>) => Promise<void>; 
}
```

</div>