

# useCache

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { useCache } from "@hyper-fetch/react"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [hooks/use-cache/use-cache.hooks.ts:8](https://github.com/BetterTyped/hyper-fetch/blob/7e232edb/packages/react/src/hooks/use-cache/use-cache.hooks.ts#L8)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview fn">

```ts
useCache<T>(command, options)
```

</div><div class="api-docs__section">

## Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="command"><td class="api-docs__param-name required">

### command 

`Required`

</td><td class="api-docs__param-type">

`T`

</td></tr><tr param-data="options"><td class="api-docs__param-name required">

### options 

`Required`

</td><td class="api-docs__param-type">

`UseCacheOptionsType<T>`

</td></tr></tbody></table></div><div class="api-docs__section">

## Returns

</div><div class="api-docs__returns">

```ts
{
  data: null | ExtractResponse;
  error: null | ExtractError;
  loading: boolean;
  retries: number;
  status: null | number;
  timestamp: null | Date;
  setData: (data: ExtractResponse, emitToCache?: boolean) => void;
  setError: (error: ExtractError, emitToCache?: boolean) => void;
  setLoading: (loading: boolean, emitToHooks?: boolean) => void;
  setRetries: (retries: number, emitToCache?: boolean) => void;
  setStatus: (status: number | null, emitToCache?: boolean) => void;
  setTimestamp: (timestamp: Date, emitToCache?: boolean) => void;
  onCacheChange: (callback: OnFinishedCallbackType) => void;
  onCacheError: (callback: OnErrorCallbackType) => void;
  onCacheSuccess: (callback: OnSuccessCallbackType) => void;
  revalidate: (invalidateKey?: string | RegExp | CommandInstance) => void;
};

```

</div>