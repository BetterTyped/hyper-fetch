

# NonNullableKeys

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { NonNullableKeys } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [types/helpers.types.ts:9](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/types/helpers.types.ts#L9)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type single">

```ts
type NonNullableKeys<T> = { [ P in keyof T ]-?: NonNullable<T[P]> };
```

</div><div class="api-docs__section">

## Structure

</div><div class="api-docs__returns">

```ts
[P in keyof T]-?: NonNullable<T[P]>
```

</div>