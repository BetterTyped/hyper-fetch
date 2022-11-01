

# UseCommandEventsReturnType

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { UseCommandEventsReturnType } from "@hyper-fetch/react"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [helpers/use-command-events/use-command-events.types.ts:73](https://github.com/BetterTyped/hyper-fetch/blob/c746dc1f/packages/react/src/helpers/use-command-events/use-command-events.types.ts#L73)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type single">

```ts
type UseCommandEventsReturnType<T> = [UseCommandEventsActionsType<T>, { addDataListener: (command: CommandInstance) => VoidFunction; addLifecycleListeners: (command: CommandInstance, requestId?: string) => VoidFunction; clearDataListener: VoidFunction; clearLifecycleListeners: () => void; removeLifecycleListener: (requestId: string) => void }];
```

</div>