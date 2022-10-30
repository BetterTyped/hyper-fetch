
      
# UseCommandEventsActionsType

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__section" data-reactroot="">

## Preview

</div><div class="api-docs__preview type" data-reactroot="">

```ts
type UseCommandEventsActionsType = {
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

</div><div class="api-docs__section" data-reactroot="">

## Description

</div><div class="api-docs__description" data-reactroot=""><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition" data-reactroot="">

Defined in [helpers/use-command-events/use-command-events.types.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/react/src/helpers/use-command-events/use-command-events.types.ts#L29)

</div>