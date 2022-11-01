

# useSubmit

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { useSubmit } from "@hyper-fetch/react"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [hooks/use-submit/use-submit.hooks.ts:28](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/react/src/hooks/use-submit/use-submit.hooks.ts#L28)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview fn">

```ts
useSubmit<Command>(command, options)
```

</div><div class="api-docs__section">

## Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Details</th></tr></thead><tbody><tr param-data="command"><td class="api-docs__param-name required">

### command 

`Required`

</td><td class="api-docs__param-type">

`Command`

</td></tr><tr param-data="options"><td class="api-docs__param-name required">

### options 

`Required`

</td><td class="api-docs__param-type">

`UseSubmitOptionsType<Command>`

</td></tr></tbody></table></div><div class="api-docs__section">

## Returns

</div><div class="api-docs__returns">

```ts
{
  data: null | ExtractResponse<T>;
  error: null | ExtractError<T>;
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
  bounce: {
      active: boolean;
      reset: () => void;
  };
  onSubmitAbort: (callback: OnErrorCallbackType<T>) => void;
  onSubmitDownloadProgress: (callback: OnProgressCallbackType) => void;
  onSubmitError: (callback: OnErrorCallbackType<T>) => void;
  onSubmitFinished: (callback: OnFinishedCallbackType<T>) => void;
  onSubmitOfflineError: (callback: OnErrorCallbackType<T>) => void;
  onSubmitRequestStart: (callback: OnStartCallbackType<T>) => void;
  onSubmitResponseStart: (callback: OnStartCallbackType<T>) => void;
  onSubmitSuccess: (callback: OnSuccessCallbackType<T>) => void;
  onSubmitUploadProgress: (callback: OnProgressCallbackType) => void;
  revalidate: (invalidateKey: InvalidationKeyType | InvalidationKeyType[]) => void;
  submit: (...parameters: Parameters<T[send]>) => Promise<ExtractClientReturnType<T>>;
  submitting: boolean;
}
```

</div>