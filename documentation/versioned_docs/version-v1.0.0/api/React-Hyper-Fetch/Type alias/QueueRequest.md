

# QueueRequest

<div class="api-docs__separator">

---

</div><div class="api-docs__import">

```ts
import { QueueRequest } from "@hyper-fetch/react"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [hooks/use-queue/use-queue.types.ts:7](https://github.com/BetterTyped/hyper-fetch/blob/3fe127e9/packages/react/src/hooks/use-queue/use-queue.types.ts#L7)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type single">

```ts
type QueueRequest<Command> = DispatcherDumpValueType<Command> & { deleteRequest: () => void; downloading?: FetchProgressType; startRequest: () => void; stopRequest: () => void; uploading?: FetchProgressType };
```

</div><div class="api-docs__section">

## Structure

</div><div class="api-docs__returns">

```ts
{
  commandDump: CommandDump<Command>;
  requestId: string;
  retries: number;
  stopped: boolean;
  timestamp: number;
  deleteRequest: () => void;
  downloading: {
    loaded: number;
    progress: number;
    sizeLeft: number;
    startTimestamp: number;
    timeLeft: number | null;
    total: number;
  };
  startRequest: () => void;
  stopRequest: () => void;
  uploading: {
    loaded: number;
    progress: number;
    sizeLeft: number;
    startTimestamp: number;
    timeLeft: number | null;
    total: number;
  };
}
```

</div>