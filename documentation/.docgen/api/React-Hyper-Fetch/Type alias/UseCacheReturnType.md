

# UseCacheReturnType

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { UseCacheReturnType } from "@hyper-fetch/react"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [hooks/use-cache/use-cache.types.ts:27](https://github.com/BetterTyped/hyper-fetch/blob/7e232edb/packages/react/src/hooks/use-cache/use-cache.types.ts#L27)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type single">

```ts
type UseCacheReturnType<T> = UseTrackedStateType<T> & UseTrackedStateActions<T> & { onCacheChange: (callback: OnFinishedCallbackType<T>) => void; onCacheError: (callback: OnErrorCallbackType<T>) => void; onCacheSuccess: (callback: OnSuccessCallbackType<T>) => void; revalidate: (invalidateKey?: string | RegExp | CommandInstance) => void };
```

</div>