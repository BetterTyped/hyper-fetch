

# OnProgressCallbackType

<div class="api-docs__separator">

---

</div><div class="api-docs__import">

```ts
import { OnProgressCallbackType } from "@hyper-fetch/react"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [helpers/use-command-events/use-command-events.types.ts:105](https://github.com/BetterTyped/hyper-fetch/blob/3fe127e9/packages/react/src/helpers/use-command-events/use-command-events.types.ts#L105)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type single">

```ts
type OnProgressCallbackType = <Command>(progress: FetchProgressType, details: CommandEventDetails<Command>) => void | Promise<void>;
```

</div><div class="api-docs__section">

## Structure

</div><div class="api-docs__returns">

```ts
(progress: FetchProgressType, details: CommandEventDetails<Command>) => void | Promise<void>
```

</div>