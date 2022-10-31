

# OnStartCallbackType

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { OnStartCallbackType } from "@hyper-fetch/react"
```

</div><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type single">

```ts
type OnStartCallbackType<Command> = (params: { command: Command; details: CommandEventDetails<Command> }) => void | Promise<void>;
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [helpers/use-command-events/use-command-events.types.ts:101](https://github.com/BetterTyped/hyper-fetch/blob/0bdb96c0/packages/react/src/helpers/use-command-events/use-command-events.types.ts#L101)

</p>