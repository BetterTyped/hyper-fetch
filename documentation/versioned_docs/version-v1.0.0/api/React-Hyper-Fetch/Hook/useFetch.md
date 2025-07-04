# useFetch

<div class="api-docs__separator">

---

</div><div class="api-docs__import">

```ts
import { useFetch } from "@hyper-fetch/react";
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

</span></div><p class="api-docs__definition">

Defined in
[hooks/use-fetch/use-fetch.hooks.ts:18](https://github.com/BetterTyped/hyper-fetch/blob/3fe127e9/packages/react/src/hooks/use-fetch/use-fetch.hooks.ts#L18)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview fn">

```ts
useFetch<T>(command, options);
```

</div><div class="api-docs__section">

## Parameters

</div>
<div class="api-docs__parameters">
<table>
<thead><tr><th>Name</th><th>Details</th></tr></thead>
<tbody><tr param-data="command"><td class="api-docs__param-name required">

### command

`Required`

</td><td class="api-docs__param-type">

Command instance

`T`

</td></tr><tr param-data="options"><td class="api-docs__param-name required">

### options

`Required`

</td><td class="api-docs__param-type">

Hook options

`UseFetchOptionsType<T>`

</td></tr></tbody></table></div><div class="api-docs__section">

## Returns

</div><div class="api-docs__returns">

```ts
{
  data: null | T extends Command<infer D, any, any, any, any, any, any, any, any, any> ? D : never;
  error: null | T extends Command<any, any, any, infer G, infer L, any, any, any, any, any> ? \G\ | \L\ : never;
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
