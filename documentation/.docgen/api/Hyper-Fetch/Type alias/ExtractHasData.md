

# ExtractHasData

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { ExtractHasData } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [types/fetch.types.ts:33](https://github.com/BetterTyped/hyper-fetch/blob/6c3eaa91/packages/core/src/types/fetch.types.ts#L33)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type single">

```ts
type ExtractHasData<T> = T extends Command<any, any, any, any, any, any, any, infer  D, any, any> ? D : never;
```

</div><div class="api-docs__section">

## Structure

</div><div class="api-docs__returns">

```ts
T extends Command<any, any, any, any, any, any, any, infer D, any, any> ? D : never
```

</div>