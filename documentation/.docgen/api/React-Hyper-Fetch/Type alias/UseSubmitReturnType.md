

# UseSubmitReturnType

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { UseSubmitReturnType } from "@hyper-fetch/react"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [hooks/use-submit/use-submit.types.ts:52](https://github.com/BetterTyped/hyper-fetch/blob/c746dc1f/packages/react/src/hooks/use-submit/use-submit.types.ts#L52)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type single">

```ts
type UseSubmitReturnType<T> = Omit<UseTrackedStateType<T>, loading> & UseTrackedStateActions<T> & { abort: () => void; bounce: { active: boolean; reset: () => void }; onSubmitAbort: (callback: OnErrorCallbackType<T>) => void; onSubmitDownloadProgress: (callback: OnProgressCallbackType) => void; onSubmitError: (callback: OnErrorCallbackType<T>) => void; onSubmitFinished: (callback: OnFinishedCallbackType<T>) => void; onSubmitOfflineError: (callback: OnErrorCallbackType<T>) => void; onSubmitRequestStart: (callback: OnStartCallbackType<T>) => void; onSubmitResponseStart: (callback: OnStartCallbackType<T>) => void; onSubmitSuccess: (callback: OnSuccessCallbackType<T>) => void; onSubmitUploadProgress: (callback: OnProgressCallbackType) => void; revalidate: (invalidateKey: InvalidationKeyType | InvalidationKeyType[]) => void; submit: (...parameters: Parameters<T[send]>) => Promise<ExtractClientReturnType<T>>; submitting: boolean };
```

</div>