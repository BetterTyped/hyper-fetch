

# initialState

<div class="api-docs__separator">

---

</div><div class="api-docs__import">

```ts
import { initialState } from "@hyper-fetch/react"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [helpers/use-tracked-state/use-tracked-state.constants.ts:3](https://github.com/BetterTyped/hyper-fetch/blob/3fe127e9/packages/react/src/helpers/use-tracked-state/use-tracked-state.constants.ts#L3)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview var">

```ts
const initialState = UseTrackedStateType
```

</div><div class="api-docs__section">

## Structure

</div><div class="api-docs__returns">

```ts
{
  data: null | T extends Command<infer D, any, any, any, any, any, any, any, any, any> ? D : never;
  error: null | T extends Command<any, any, any, infer G, infer L, any, any, any, any, any> ? \G\ | \L\ : never;
  loading: boolean;
  retries: number;
  status: null | number;
  timestamp: null | Date;
}
```

</div>