

# UseFetchReturnType

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { UseFetchReturnType } from "@hyper-fetch/react"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [hooks/use-fetch/use-fetch.types.ts:70](https://github.com/BetterTyped/hyper-fetch/blob/6c3eaa91/packages/react/src/hooks/use-fetch/use-fetch.types.ts#L70)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type single">

```ts
type UseFetchReturnType<T> = UseTrackedStateType<T> & UseTrackedStateActions<T> & UseCommandEventsActionsType<T> & { bounce: { active: boolean; reset: () => void }; revalidate: (invalidateKey?: InvalidationKeyType | InvalidationKeyType[]) => void };
```

</div><div class="api-docs__section">

## Structure

</div><div class="api-docs__returns">

```ts
{
  data: null | ExtractResponse<T>;
  error: null | ExtractError<T>;
  loading: boolean;
  retries: number;
  status: null | number;
  timestamp: null | Date;
  setData: (data: ExtractResponse<T>, emitToCache?: boolean) => void;
  setError: (error: ExtractError<T>, emitToCache?: boolean) => void;
  setLoading: (loading: boolean, emitToHooks?: boolean) => void;
  setRetries: (retries: number, emitToCache?: boolean) => void;
  setStatus: (status: number | null, emitToCache?: boolean) => void;
  setTimestamp: (timestamp: Date, emitToCache?: boolean) => void;
  abort: () => void;
  onAbort: (callback: OnErrorCallbackType<T>) => void;
  onDownloadProgress: (callback: OnProgressCallbackType) => void;
  onError: (callback: OnErrorCallbackType<T>) => void;
  onFinished: (callback: OnFinishedCallbackType<T>) => void;
  onOfflineError: (callback: OnErrorCallbackType<T>) => void;
  onRequestStart: (callback: OnStartCallbackType<T>) => void;
  onResponseStart: (callback: OnStartCallbackType<T>) => void;
  onSuccess: (callback: OnSuccessCallbackType<T>) => void;
  onUploadProgress: (callback: OnProgressCallbackType) => void;
  bounce: {
      active: boolean;
      reset: () => void;
  };
  revalidate: (invalidateKey?: InvalidationKeyType | InvalidationKeyType[]) => void;
}
```

</div>