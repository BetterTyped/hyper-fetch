

# UseQueueReturnType

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { UseQueueReturnType } from "@hyper-fetch/react"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [hooks/use-queue/use-queue.types.ts:30](https://github.com/BetterTyped/hyper-fetch/blob/7e232edb/packages/react/src/hooks/use-queue/use-queue.types.ts#L30)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type">

```ts
type UseQueueReturnType<T> = {
  pause: () => void; 
  requests: QueueRequest<T>[]; 
  start: () => void; 
  stop: () => void; 
  stopped: boolean; 
}
```

</div>