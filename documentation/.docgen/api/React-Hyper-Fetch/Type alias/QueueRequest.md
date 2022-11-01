

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

Defined in [hooks/use-queue/use-queue.types.ts:7](https://github.com/BetterTyped/hyper-fetch/blob/6c3eaa91/packages/react/src/hooks/use-queue/use-queue.types.ts#L7)

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
  0: D;
  1: i;
  2: s;
  3: p;
  4: a;
  5: t;
  6: c;
  7: h;
  8: e;
  9: r;
  10: D;
  11: u;
  12: m;
  13: p;
  14: V;
  15: a;
  16: l;
  17: u;
  18: e;
  19: T;
  20: y;
  21: p;
  22: e;
  23: <;
  24: C;
  25: o;
  26: m;
  27: m;
  28: a;
  29: n;
  30: d;
  31: >;
  deleteRequest: () => void;
  downloading: FetchProgressType;
  startRequest: () => void;
  stopRequest: () => void;
  uploading: FetchProgressType;
}
```

</div>