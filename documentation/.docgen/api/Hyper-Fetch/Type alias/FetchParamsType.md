

# FetchParamsType

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { FetchParamsType } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type single">

```ts
type FetchParamsType<EndpointType,HasParams> = ExtractRouteParams<EndpointType> extends NegativeTypes ? { params?: NegativeTypes } : true extends HasParams ? { params?: NegativeTypes } : { params: ExtractRouteParams<EndpointType> };
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

If the command endpoint parameters are not filled it will throw an error

</span></div><p class="api-docs__definition">

Defined in [command/command.types.ts:212](https://github.com/BetterTyped/hyper-fetch/blob/479dcad6/packages/core/src/command/command.types.ts#L212)

</p>