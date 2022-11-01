

# ExtractRequestData

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { ExtractRequestData } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [types/fetch.types.ts:11](https://github.com/BetterTyped/hyper-fetch/blob/9cf1f580/packages/core/src/types/fetch.types.ts#L11)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type single">

```ts
type ExtractRequestData<T> = T extends Command<any, infer  D, any, any, any, any, any, any, any, any> ? D : never;
```

</div>