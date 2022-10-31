

# UseTrackedStateProps

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { UseTrackedStateProps } from "@hyper-fetch/react"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [helpers/use-tracked-state/use-tracked-state.types.ts:13](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/react/src/helpers/use-tracked-state/use-tracked-state.types.ts#L13)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type">

```ts
type UseTrackedStateProps<T> = {
  command: T; 
  deepCompare: boolean | typeof isEqual; 
  defaultCacheEmitting: boolean; 
  dependencyTracking: boolean; 
  dispatcher: Dispatcher; 
  initialData: ClientResponseType<ExtractResponse<T>, ExtractError<T>> | null; 
  logger: LoggerType; 
}
```

</div>