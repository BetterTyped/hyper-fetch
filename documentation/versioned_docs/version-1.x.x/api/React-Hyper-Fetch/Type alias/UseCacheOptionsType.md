

# UseCacheOptionsType

<div class="api-docs__separator">

---

</div><div class="api-docs__import">

```ts
import { UseCacheOptionsType } from "@hyper-fetch/react"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [hooks/use-cache/use-cache.types.ts:12](https://github.com/BetterTyped/hyper-fetch/blob/3fe127e9/packages/react/src/hooks/use-cache/use-cache.types.ts#L12)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type">

```ts
type UseCacheOptionsType<T> = {
  deepCompare: boolean | typeof isEqual; 
  dependencyTracking: boolean; 
  initialData: CacheValueType<ExtractResponse<T>, ExtractError<T>>[data] | null; 
}
```

</div><div class="api-docs__section">

## Structure

</div><div class="api-docs__returns">

```ts
{
  deepCompare: boolean | typeof isEqual;
  dependencyTracking: boolean;
  initialData: ClientResponseType<Response, Error> | null;
}
```

</div>