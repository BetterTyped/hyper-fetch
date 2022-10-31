

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

Defined in [hooks/use-submit/use-submit.hooks.ts:28](https://github.com/BetterTyped/hyper-fetch/blob/7e232edb/packages/react/src/hooks/use-submit/use-submit.hooks.ts#L28)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview fn">

```ts
useSubmit<Command>(command, options)
```

</div><div class="api-docs__section">

## Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="command"><td class="api-docs__param-name required">

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
  0: O;
  1: m;
  2: i;
  3: t;
  setData: (data: ExtractResponse, emitToCache?: boolean) => void;
  setError: (error: ExtractError, emitToCache?: boolean) => void;
  setLoading: (loading: boolean, emitToHooks?: boolean) => void;
  setRetries: (retries: number, emitToCache?: boolean) => void;
  setStatus: (status: number | null, emitToCache?: boolean) => void;
  setTimestamp: (timestamp: Date, emitToCache?: boolean) => void;
  abort: () => void;
  bounce: {
      active: boolean;
      reset: () => void;
  };
  onSubmitAbort: (callback: OnErrorCallbackType) => void;
  onSubmitDownloadProgress: (callback: OnProgressCallbackType) => void;
  onSubmitError: (callback: OnErrorCallbackType) => void;
  onSubmitFinished: (callback: OnFinishedCallbackType) => void;
  onSubmitOfflineError: (callback: OnErrorCallbackType) => void;
  onSubmitRequestStart: (callback: OnStartCallbackType) => void;
  onSubmitResponseStart: (callback: OnStartCallbackType) => void;
  onSubmitSuccess: (callback: OnSuccessCallbackType) => void;
  onSubmitUploadProgress: (callback: OnProgressCallbackType) => void;
  revalidate: (invalidateKey: InvalidationKeyType | InvalidationKeyType[]) => void;
  submit: (...parameters: Parameters) => Promise;
  submitting: boolean;
};

```

</div>