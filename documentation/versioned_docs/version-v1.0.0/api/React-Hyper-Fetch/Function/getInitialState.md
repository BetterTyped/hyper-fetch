# getInitialState

<div class="api-docs__separator">

---

</div><div class="api-docs__import">

```ts
import { getInitialState } from "@hyper-fetch/react";
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

</span></div><p class="api-docs__definition">

Defined in
[helpers/use-tracked-state/use-tracked-state.utils.ts:61](https://github.com/BetterTyped/hyper-fetch/blob/3fe127e9/packages/react/src/helpers/use-tracked-state/use-tracked-state.utils.ts#L61)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview fn">

```ts
getInitialState<T>(initialData, dispatcher, command);
```

</div><div class="api-docs__section">

## Parameters

</div>
<div class="api-docs__parameters">
<table>
<thead><tr><th>Name</th><th>Details</th></tr></thead>
<tbody><tr param-data="initialData"><td class="api-docs__param-name required">

### initialData

`Required`

</td><td class="api-docs__param-type">

`ClientResponseType<ExtractResponse<T>, ExtractError<T>>`

</td></tr><tr param-data="dispatcher"><td class="api-docs__param-name required">

### dispatcher

`Required`

</td><td class="api-docs__param-type">

`Dispatcher`

</td></tr><tr param-data="command"><td class="api-docs__param-name required">

### command

`Required`

</td><td class="api-docs__param-type">

`T`

</td></tr></tbody></table></div><div class="api-docs__section">

## Returns

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
