# useQueue

<div class="api-docs__separator">

---

</div><div class="api-docs__import">

```ts
import { useQueue } from "@hyper-fetch/react";
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

</span></div><p class="api-docs__definition">

Defined in
[hooks/use-queue/use-queue.hooks.ts:14](https://github.com/BetterTyped/hyper-fetch/blob/3fe127e9/packages/react/src/hooks/use-queue/use-queue.hooks.ts#L14)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview fn">

```ts
useQueue<Command>(command, options);
```

</div><div class="api-docs__section">

## Parameters

</div>
<div class="api-docs__parameters">
<table>
<thead><tr><th>Name</th><th>Details</th></tr></thead>
<tbody><tr param-data="command"><td class="api-docs__param-name required">

### command

`Required`

</td><td class="api-docs__param-type">

`Command`

</td></tr><tr param-data="options"><td class="api-docs__param-name required">

### options

`Required`

</td><td class="api-docs__param-type">

`UseQueueOptionsType`

</td></tr></tbody></table></div><div class="api-docs__section">

## Returns

</div><div class="api-docs__returns">

```ts
{
  pause: () => void;
  requests: {
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
  }[];
  start: () => void;
  stop: () => void;
  stopped: boolean;
}
```

</div>
