

# ExtractClientReturnType

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { ExtractClientReturnType } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [types/fetch.types.ts:4](https://github.com/BetterTyped/hyper-fetch/blob/7e232edb/packages/core/src/types/fetch.types.ts#L4)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type single">

```ts
type ExtractClientReturnType<T> = ClientResponseType<ExtractResponse<T>, ExtractError<T>>;
```

</div>