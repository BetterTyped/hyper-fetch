# getProgressData

<div class="api-docs__separator">

---

</div><div class="api-docs__import">

```ts
import { getProgressData } from "@hyper-fetch/core";
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

</span></div><p class="api-docs__definition">

Defined in
[command/command.utils.ts:39](https://github.com/BetterTyped/hyper-fetch/blob/3fe127e9/packages/core/src/command/command.utils.ts#L39)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview fn">

```ts
getProgressData(requestStartTime, progressDate, progressEvent);
```

</div><div class="api-docs__section">

## Parameters

</div>
<div class="api-docs__parameters">
<table>
<thead><tr><th>Name</th><th>Details</th></tr></thead>
<tbody><tr param-data="requestStartTime"><td class="api-docs__param-name required">

### requestStartTime

`Required`

</td><td class="api-docs__param-type">

`Date`

</td></tr><tr param-data="progressDate"><td class="api-docs__param-name required">

### progressDate

`Required`

</td><td class="api-docs__param-type">

`Date`

</td></tr><tr param-data="progressEvent"><td class="api-docs__param-name required">

### progressEvent

`Required`

</td><td class="api-docs__param-type">

`ClientProgressEvent`

</td></tr></tbody></table></div><div class="api-docs__section">

## Returns

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