

# ExtractQueryParams

<div class="api-docs__separator">

---

</div><div class="api-docs__import">

```ts
import { ExtractQueryParams } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [types/fetch.types.ts:13](https://github.com/BetterTyped/hyper-fetch/blob/3fe127e9/packages/core/src/types/fetch.types.ts#L13)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type single">

```ts
type ExtractQueryParams<T> = T extends Command<any, any, infer  Q, any, any, any, any, any, any, any> ? Q : never;
```

</div><div class="api-docs__section">

## Structure

</div><div class="api-docs__returns">

```ts
T extends Command<any, any, infer Q, any, any, any, any, any, any, any> ? Q : never
```

</div>