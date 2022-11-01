

# QueueRequest

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { QueueRequest } from "@hyper-fetch/react"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [hooks/use-queue/use-queue.types.ts:7](https://github.com/BetterTyped/hyper-fetch/blob/4197368e/packages/react/src/hooks/use-queue/use-queue.types.ts#L7)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type single">

```ts
type QueueRequest<Command> = DispatcherDumpValueType<Command> & { deleteRequest: () => void; downloading?: FetchProgressType; startRequest: () => void; stopRequest: () => void; uploading?: FetchProgressType };
```

</div>