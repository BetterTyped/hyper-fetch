

# UseTrackedStateProps

<div class="api-docs__separator">

---

</div><div class="api-docs__import">

```ts
import { UseTrackedStateProps } from "@hyper-fetch/react"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [helpers/use-tracked-state/use-tracked-state.types.ts:13](https://github.com/BetterTyped/hyper-fetch/blob/3fe127e9/packages/react/src/helpers/use-tracked-state/use-tracked-state.types.ts#L13)

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

</div><div class="api-docs__section">

## Structure

</div><div class="api-docs__returns">

```ts
{
  command: T;
  deepCompare: boolean | typeof isEqual;
  defaultCacheEmitting: boolean;
  dependencyTracking: boolean;
  dispatcher: Dispatcher;
  initialData: [\GenericDataType\ | \null\, \GenericErrorType\ | \null\, \number\ | \null\] | null;
  logger: Record<LoggerLevelType, (message: LoggerMessageType, ...additionalData: LoggerMessageType[]) => void>;
}
```

</div>