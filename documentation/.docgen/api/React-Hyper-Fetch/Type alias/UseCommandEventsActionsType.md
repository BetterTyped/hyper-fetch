

# UseCommandEventsActionsType

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { UseCommandEventsActionsType } from "@hyper-fetch/react"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [helpers/use-command-events/use-command-events.types.ts:29](https://github.com/BetterTyped/hyper-fetch/blob/c746dc1f/packages/react/src/helpers/use-command-events/use-command-events.types.ts#L29)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type">

```ts
type UseCommandEventsActionsType<T> = {
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
}
```

</div>