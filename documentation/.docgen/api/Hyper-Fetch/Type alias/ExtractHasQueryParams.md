

# ExtractHasQueryParams

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { ExtractHasQueryParams } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [types/fetch.types.ts:37](https://github.com/BetterTyped/hyper-fetch/blob/6c3eaa91/packages/core/src/types/fetch.types.ts#L37)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type single">

```ts
type ExtractHasQueryParams<T> = T extends Command<any, any, any, any, any, any, any, any, any, infer  Q> ? Q : never;
```

</div><div class="api-docs__section">

## Structure

</div><div class="api-docs__returns">

```ts
T extends Command<any, any, any, any, any, any, any, any, any, infer Q> ? Q : never
```

</div>