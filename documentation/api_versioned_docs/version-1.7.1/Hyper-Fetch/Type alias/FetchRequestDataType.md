

# FetchRequestDataType

<div class="api-docs__separator">

---

</div><div class="api-docs__import">

```ts
import { FetchRequestDataType } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

If the command data is not filled it will throw an error

</span></div><p class="api-docs__definition">

Defined in [command/command.types.ts:229](https://github.com/BetterTyped/hyper-fetch/blob/3fe127e9/packages/core/src/command/command.types.ts#L229)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type single">

```ts
type FetchRequestDataType<RequestDataType,HasData> = RequestDataType extends NegativeTypes ? { data?: NegativeTypes } : HasData extends true ? { data?: NegativeTypes } : { data: RequestDataType };
```

</div><div class="api-docs__section">

## Structure

</div><div class="api-docs__returns">

```ts
RequestDataType extends NegativeTypes ? {
    data: NegativeTypes;
  } : (HasData extends true ? {
  data: NegativeTypes;
} : {
  data: RequestDataType;
})
```

</div>