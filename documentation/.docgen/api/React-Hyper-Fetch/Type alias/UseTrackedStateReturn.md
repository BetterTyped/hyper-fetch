

# UseTrackedStateReturn

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { UseTrackedStateReturn } from "@hyper-fetch/react"
```

</div><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type single">

```ts
type UseTrackedStateReturn<T> = [UseTrackedStateType<T>, UseTrackedStateActions<T>, { getStaleStatus: () => boolean; setCacheData: (cacheData: CacheValueType<ExtractResponse<T>, ExtractError<T>>) => void; setRenderKey: (renderKey: keyof UseTrackedStateType<T>) => void }];
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [helpers/use-tracked-state/use-tracked-state.types.ts:23](https://github.com/BetterTyped/hyper-fetch/blob/479dcad6/packages/react/src/helpers/use-tracked-state/use-tracked-state.types.ts#L23)

</p>