

# CacheValueType

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { CacheValueType } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [cache/cache.types.ts:33](https://github.com/BetterTyped/hyper-fetch/blob/7e232edb/packages/core/src/cache/cache.types.ts#L33)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type">

```ts
type CacheValueType<Response,Error> = {
  cacheTime: number; 
  clearKey: string; 
  data: ClientResponseType<Response, Error>; 
  details: CommandResponseDetails; 
}
```

</div>