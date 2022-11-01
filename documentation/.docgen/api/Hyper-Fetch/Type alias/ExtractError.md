

# ExtractError

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { ExtractError } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [types/fetch.types.ts:15](https://github.com/BetterTyped/hyper-fetch/blob/6c3eaa91/packages/core/src/types/fetch.types.ts#L15)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type single">

```ts
type ExtractError<T> = T extends Command<any, any, any, infer  G, infer  L, any, any, any, any, any> ? G | L : never;
```

</div><div class="api-docs__section">

## Structure

</div><div class="api-docs__returns">

```ts
T extends Command<any, any, any, infer G, infer L, any, any, any, any, any> ? G | L : never
```

</div>