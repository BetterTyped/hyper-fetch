

# parseErrorResponse

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { parseErrorResponse } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [client/fetch.client.utils.ts:26](https://github.com/BetterTyped/hyper-fetch/blob/6c3eaa91/packages/core/src/client/fetch.client.utils.ts#L26)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview fn">

```ts
parseErrorResponse<T>(response)
```

</div><div class="api-docs__section">

## Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Details</th></tr></thead><tbody><tr param-data="response"><td class="api-docs__param-name required">

### response 

`Required`

</td><td class="api-docs__param-type">

`unknown`

</td></tr></tbody></table></div><div class="api-docs__section">

## Returns

</div><div class="api-docs__returns">

```ts
T extends Command<any, any, any, infer G, infer L, any, any, any, any, any> ? G | L : never
```

</div>