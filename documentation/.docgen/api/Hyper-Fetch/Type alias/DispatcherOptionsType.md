

# DispatcherOptionsType

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { DispatcherOptionsType } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type">

```ts
type DispatcherOptionsType = {
  onClearStorage: (dispatcherInstance: Dispatcher) => void; 
  onDeleteFromStorage: <Command>(queueKey: string, data: DispatcherData<Command>) => void; 
  onInitialization: (dispatcherInstance: Dispatcher) => void; 
  onUpdateStorage: <Command>(queueKey: string, data: DispatcherData<Command>) => void; 
  storage: DispatcherStorageType; 
}
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [dispatcher/dispatcher.types.ts:4](https://github.com/BetterTyped/hyper-fetch/blob/0bdb96c0/packages/core/src/dispatcher/dispatcher.types.ts#L4)

</p>