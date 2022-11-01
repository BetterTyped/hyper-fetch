

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

Defined in [helpers/use-command-events/use-command-events.types.ts:21](https://github.com/BetterTyped/hyper-fetch/blob/6c3eaa91/packages/react/src/helpers/use-command-events/use-command-events.types.ts#L21)

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

</div><div class="api-docs__section">

## Structure

</div><div class="api-docs__returns">

```ts
{
  actions: {
      setData: (data: ExtractResponse<T>, emitToCache?: boolean) => void;
      setError: (error: ExtractError<T>, emitToCache?: boolean) => void;
      setLoading: (loading: boolean, emitToHooks?: boolean) => void;
      setRetries: (retries: number, emitToCache?: boolean) => void;
      setStatus: (status: number | null, emitToCache?: boolean) => void;
      setTimestamp: (timestamp: Date, emitToCache?: boolean) => void;
  };
  command: T;
  dispatcher: Dispatcher;
  logger: LoggerType;
  setCacheData: (cacheData: CacheValueType<ExtractResponse<T>, ExtractError<T>>) => void;
}
```

</div>