# getCommandKey

<div class="api-docs__separator">

---

</div><div class="api-docs__import">

```ts
import { getCommandKey } from "@hyper-fetch/core";
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

</span></div><p class="api-docs__definition">

Defined in
[command/command.utils.ts:80](https://github.com/BetterTyped/hyper-fetch/blob/3fe127e9/packages/core/src/command/command.utils.ts#L80)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview fn">

```ts
getCommandKey(command, useInitialValues);
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

`CommandInstance | CommandDump<CommandInstance, unknown, ClientQueryParamsType, null>`

</td></tr><tr param-data="useInitialValues"><td class="api-docs__param-name optional">

### useInitialValues

`Optional`

</td><td class="api-docs__param-type">

`boolean`

</td></tr></tbody></table></div><div class="api-docs__section">

## Returns

</div><div class="api-docs__returns">

```ts
string;
```

</div>
