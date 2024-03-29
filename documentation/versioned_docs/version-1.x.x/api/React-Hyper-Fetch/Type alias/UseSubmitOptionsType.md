

# UseSubmitOptionsType

<div class="api-docs__separator">

---

</div><div class="api-docs__import">

```ts
import { UseSubmitOptionsType } from "@hyper-fetch/react"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [hooks/use-submit/use-submit.types.ts:21](https://github.com/BetterTyped/hyper-fetch/blob/3fe127e9/packages/react/src/hooks/use-submit/use-submit.types.ts#L21)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type">

```ts
type UseSubmitOptionsType<T> = {
  bounce: boolean; 
  bounceTime: number; 
  bounceType: debounce | throttle; 
  deepCompare: boolean | typeof isEqual; 
  dependencyTracking: boolean; 
  disabled: boolean; 
  initialData: CacheValueType<ExtractResponse<T>, ExtractError<T>>[data] | null; 
}
```

</div><div class="api-docs__section">

## Structure

</div><div class="api-docs__returns">

```ts
{
  bounce: boolean;
  bounceTime: number;
  bounceType: debounce | throttle;
  deepCompare: boolean | typeof isEqual;
  dependencyTracking: boolean;
  disabled: boolean;
  initialData: ClientResponseType<Response, Error> | null;
}
```

</div>