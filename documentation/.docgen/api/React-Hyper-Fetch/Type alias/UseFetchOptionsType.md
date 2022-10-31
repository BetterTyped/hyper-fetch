

# UseFetchOptionsType

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { UseFetchOptionsType } from "@hyper-fetch/react"
```

</div><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type">

```ts
type UseFetchOptionsType<T> = {
  bounce: boolean; 
  bounceTime: number; 
  bounceType: debounce | throttle; 
  deepCompare: boolean | typeof isEqual; 
  dependencies: any[]; 
  dependencyTracking: boolean; 
  disabled: boolean; 
  initialData: CacheValueType<ExtractResponse<T>, ExtractError<T>>[data] | null; 
  refresh: boolean; 
  refreshBlurred: boolean; 
  refreshOnBlur: boolean; 
  refreshOnFocus: boolean; 
  refreshOnReconnect: boolean; 
  refreshTime: number; 
  revalidateOnMount: boolean; 
}
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [hooks/use-fetch/use-fetch.types.ts:7](https://github.com/BetterTyped/hyper-fetch/blob/0bdb96c0/packages/react/src/hooks/use-fetch/use-fetch.types.ts#L7)

</p>