

# getCacheData

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { getCacheData } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [cache/cache.utils.ts:5](https://github.com/BetterTyped/hyper-fetch/blob/479dcad6/packages/core/src/cache/cache.utils.ts#L5)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview fn">

```ts
getCacheData<T>(previousResponse, response)
```

</div><div class="api-docs__section">

## Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="previousResponse"><td class="api-docs__param-name required">

### previousResponse 

`Required`

</td><td class="api-docs__param-type">

`ExtractClientReturnType<T>`

</td></tr><tr param-data="response"><td class="api-docs__param-name required">

### response 

`Required`

</td><td class="api-docs__param-type">

`ExtractClientReturnType<T>`

</td></tr></tbody></table></div><div class="api-docs__section">

## Returns

</div><div class="api-docs__returns">

```ts
["GenericDataType" | "null","GenericErrorType" | "null","number" | "null"]
```

</div>