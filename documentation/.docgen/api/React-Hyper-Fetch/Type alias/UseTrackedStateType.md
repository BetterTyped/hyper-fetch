

# UseTrackedStateType

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { UseTrackedStateType } from "@hyper-fetch/react"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [helpers/use-tracked-state/use-tracked-state.types.ts:33](https://github.com/BetterTyped/hyper-fetch/blob/4197368e/packages/react/src/helpers/use-tracked-state/use-tracked-state.types.ts#L33)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type">

```ts
type UseTrackedStateType<T> = {
  data: null | ExtractResponse<T>; 
  error: null | ExtractError<T>; 
  loading: boolean; 
  retries: number; 
  status: null | number; 
  timestamp: null | Date; 
}
```

</div>