

# DispatcherData

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { DispatcherData } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [dispatcher/dispatcher.types.ts:20](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/dispatcher/dispatcher.types.ts#L20)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type">

```ts
type DispatcherData<Command> = {
  requests: DispatcherDumpValueType<Command>[]; 
  stopped: boolean; 
}
```

</div><div class="api-docs__section">

## Structure

</div><div class="api-docs__returns">

```ts
{
  requests: [object Object][];
  stopped: boolean;
}
```

</div>