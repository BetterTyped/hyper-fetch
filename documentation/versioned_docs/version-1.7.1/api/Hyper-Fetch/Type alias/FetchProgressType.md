

# FetchProgressType

<div class="api-docs__separator">

---

</div><div class="api-docs__import">

```ts
import { FetchProgressType } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [client/fetch.client.types.ts:76](https://github.com/BetterTyped/hyper-fetch/blob/3fe127e9/packages/core/src/client/fetch.client.types.ts#L76)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type">

```ts
type FetchProgressType = {
  loaded: number; 
  progress: number; 
  sizeLeft: number; 
  startTimestamp: number; 
  timeLeft: number | null; 
  total: number; 
}
```

</div><div class="api-docs__section">

## Structure

</div><div class="api-docs__returns">

```ts
{
  loaded: number;
  progress: number;
  sizeLeft: number;
  startTimestamp: number;
  timeLeft: number | null;
  total: number;
}
```

</div>