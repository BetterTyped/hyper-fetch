

# UseFetchReturnType

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { UseFetchReturnType } from "@hyper-fetch/react"
```

</div><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type single">

```ts
type UseFetchReturnType<T> = UseTrackedStateType<T> & UseTrackedStateActions<T> & UseCommandEventsActionsType<T> & { bounce: { active: boolean; reset: () => void }; revalidate: (invalidateKey?: InvalidationKeyType | InvalidationKeyType[]) => void };
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [hooks/use-fetch/use-fetch.types.ts:70](https://github.com/BetterTyped/hyper-fetch/blob/479dcad6/packages/react/src/hooks/use-fetch/use-fetch.types.ts#L70)

</p>