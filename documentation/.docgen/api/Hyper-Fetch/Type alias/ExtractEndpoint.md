

# ExtractEndpoint

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { ExtractEndpoint } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [types/fetch.types.ts:27](https://github.com/BetterTyped/hyper-fetch/blob/c746dc1f/packages/core/src/types/fetch.types.ts#L27)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type single">

```ts
type ExtractEndpoint<T> = T extends Command<any, any, any, any, any, infer  E, any, any, any, any> ? E : never;
```

</div>