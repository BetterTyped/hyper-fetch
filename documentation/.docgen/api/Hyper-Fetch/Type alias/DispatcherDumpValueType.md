

# DispatcherDumpValueType

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { DispatcherDumpValueType } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type">

```ts
type DispatcherDumpValueType<Command> = {
  commandDump: CommandDump<Command>; 
  requestId: string; 
  retries: number; 
  stopped: boolean; 
  timestamp: number; 
}
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [dispatcher/dispatcher.types.ts:13](https://github.com/BetterTyped/hyper-fetch/blob/0bdb96c0/packages/core/src/dispatcher/dispatcher.types.ts#L13)

</p>