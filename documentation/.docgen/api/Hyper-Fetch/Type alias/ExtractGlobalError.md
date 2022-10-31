

# ExtractGlobalError

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { ExtractGlobalError } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type single">

```ts
type ExtractGlobalError<T> = T extends Command<any, any, any, infer  E, any, any, any, any, any, any> ? E : never;
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [types/fetch.types.ts:19](https://github.com/BetterTyped/hyper-fetch/blob/0bdb96c0/packages/core/src/types/fetch.types.ts#L19)

</p>