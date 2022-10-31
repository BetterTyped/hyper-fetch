

# FetchRequestDataType

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { FetchRequestDataType } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

If the command data is not filled it will throw an error

</span></div><p class="api-docs__definition">

Defined in [command/command.types.ts:224](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.types.ts#L224)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type single">

```ts
type FetchRequestDataType<RequestDataType,HasData> = RequestDataType extends NegativeTypes ? { data?: NegativeTypes } : HasData extends true ? { data?: NegativeTypes } : { data: RequestDataType };
```

</div>