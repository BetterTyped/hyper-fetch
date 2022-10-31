

# UseCommandEventsPropsType

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { UseCommandEventsPropsType } from "@hyper-fetch/react"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [helpers/use-command-events/use-command-events.types.ts:21](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/react/src/helpers/use-command-events/use-command-events.types.ts#L21)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type">

```ts
type UseCommandEventsPropsType<T> = {
  actions: UseTrackedStateActions<T>; 
  command: T; 
  dispatcher: Dispatcher; 
  logger: LoggerType; 
  setCacheData: (cacheData: CacheValueType<ExtractResponse<T>, ExtractError<T>>) => void; 
}
```

</div>