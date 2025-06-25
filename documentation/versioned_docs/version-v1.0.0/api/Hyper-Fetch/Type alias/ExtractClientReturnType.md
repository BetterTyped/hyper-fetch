

# ExtractClientReturnType

<div class="api-docs__separator">

---

</div><div class="api-docs__import">

```ts
import { ExtractClientReturnType } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [types/fetch.types.ts:4](https://github.com/BetterTyped/hyper-fetch/blob/3fe127e9/packages/core/src/types/fetch.types.ts#L4)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type single">

```ts
type ExtractClientReturnType<T> = ClientResponseType<ExtractResponse<T>, ExtractError<T>>;
```

</div><div class="api-docs__section">

## Structure

</div><div class="api-docs__returns">

```ts
[GenericDataType | null, GenericErrorType | null, number | null]
```

</div>