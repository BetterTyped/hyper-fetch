

# RequiredKeys

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { RequiredKeys } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [types/helpers.types.ts:13](https://github.com/BetterTyped/hyper-fetch/blob/9cf1f580/packages/core/src/types/helpers.types.ts#L13)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type single">

```ts
type RequiredKeys<T> = { [ P in keyof T ]-?: Exclude<T[P], NegativeTypes> };
```

</div>