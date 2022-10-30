

# FetchRequestDataType

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type single">

```ts
type FetchRequestDataType = RequestDataType extends NegativeTypes ? { data?: NegativeTypes } : HasData extends true ? { data?: NegativeTypes } : { data: RequestDataType };
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

If the command data is not filled it will throw an error

</span></div><p class="api-docs__definition">

Defined in [command/command.types.ts:224](https://github.com/BetterTyped/hyper-fetch/blob/d6c03b85/packages/core/src/command/command.types.ts#L224)

</p>