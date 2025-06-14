

# UseSubmitReturnType

<div class="api-docs__separator">

---

</div><div class="api-docs__import">

```ts
import { UseSubmitReturnType } from "@hyper-fetch/react"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [hooks/use-submit/use-submit.types.ts:52](https://github.com/BetterTyped/hyper-fetch/blob/3fe127e9/packages/react/src/hooks/use-submit/use-submit.types.ts#L52)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type single">

```ts
type UseSubmitReturnType<T> = Omit<UseTrackedStateType<T>, loading> & UseTrackedStateActions<T> & { abort: () => void; bounce: { active: boolean; reset: () => void }; onSubmitAbort: (callback: OnErrorCallbackType<T>) => void; onSubmitDownloadProgress: (callback: OnProgressCallbackType) => void; onSubmitError: (callback: OnErrorCallbackType<T>) => void; onSubmitFinished: (callback: OnFinishedCallbackType<T>) => void; onSubmitOfflineError: (callback: OnErrorCallbackType<T>) => void; onSubmitRequestStart: (callback: OnStartCallbackType<T>) => void; onSubmitResponseStart: (callback: OnStartCallbackType<T>) => void; onSubmitSuccess: (callback: OnSuccessCallbackType<T>) => void; onSubmitUploadProgress: (callback: OnProgressCallbackType) => void; revalidate: (invalidateKey: InvalidationKeyType | InvalidationKeyType[]) => void; submit: (...parameters: Parameters<T[send]>) => Promise<ExtractClientReturnType<T>>; submitting: boolean };
```

</div><div class="api-docs__section">

## Structure

</div><div class="api-docs__returns">

```ts
{
  data: null | T extends Command<infer D, any, any, any, any, any, any, any, any, any> ? D : never;
  error: null | T extends Command<any, any, any, infer G, infer L, any, any, any, any, any> ? \G\ | \L\ : never;
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