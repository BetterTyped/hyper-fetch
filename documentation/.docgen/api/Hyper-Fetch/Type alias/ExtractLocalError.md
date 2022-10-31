

# ExtractLocalError

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { ExtractLocalError } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [types/fetch.types.ts:21](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/types/fetch.types.ts#L21)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type single">

```ts
type ExtractLocalError<T> = T extends Command<any, any, any, any, infer  E, any, any, any, any, any> ? E : never;
```

</div>