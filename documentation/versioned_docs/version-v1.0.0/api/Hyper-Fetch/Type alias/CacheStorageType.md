

# CacheStorageType

<div class="api-docs__separator">

---

</div><div class="api-docs__import">

```ts
import { CacheStorageType } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [cache/cache.types.ts:49](https://github.com/BetterTyped/hyper-fetch/blob/3fe127e9/packages/core/src/cache/cache.types.ts#L49)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type">

```ts
type CacheStorageType = {
  clear: () => void; 
  delete: (key: string) => void; 
  get: <Response,Error>(key: string) => CacheValueType<Response, Error> | undefined; 
  keys: () => string[] | IterableIterator<string> | string[]; 
  set: <Response,Error>(key: string, data: CacheValueType<Response, Error>) => void; 
}
```

</div><div class="api-docs__section">

## Structure

</div><div class="api-docs__returns">

```ts
{
  clear: () => void;
  delete: (key: string) => void;
  get: (key: string) => CacheValueType<Response, Error> | undefined;
  keys: () => string[] | IterableIterator<string> | string[];
  set: (key: string, data: CacheValueType<Response, Error>) => void;
}
```

</div>