

# CacheOptionsType

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { CacheOptionsType } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type">

```ts
type CacheOptionsType = {
  clearKey: string; 
  lazyStorage: CacheAsyncStorageType; 
  onChange: <Response,Error>(key: string, data: CacheValueType<Response, Error>) => void; 
  onDelete: (key: string) => void; 
  onInitialization: (cache: Cache) => void; 
  storage: CacheStorageType; 
}
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [cache/cache.types.ts:5](https://github.com/BetterTyped/hyper-fetch/blob/0bdb96c0/packages/core/src/cache/cache.types.ts#L5)

</p>