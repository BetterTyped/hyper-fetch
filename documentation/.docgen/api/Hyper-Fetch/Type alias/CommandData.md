

# CommandData

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { CommandData } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.types.ts:159](https://github.com/BetterTyped/hyper-fetch/blob/9cf1f580/packages/core/src/command/command.types.ts#L159)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type single">

```ts
type CommandData<RequestDataType,MappedData> = (MappedData extends undefined ? RequestDataType : MappedData) | NegativeTypes;
```

</div>