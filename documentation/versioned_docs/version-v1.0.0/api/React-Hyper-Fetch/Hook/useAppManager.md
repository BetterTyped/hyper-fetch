# useAppManager

<div class="api-docs__separator">

---

</div><div class="api-docs__import">

```ts
import { useAppManager } from "@hyper-fetch/react";
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

</span></div><p class="api-docs__definition">

Defined in
[hooks/use-app-manager/use-app-manager.hooks.ts:7](https://github.com/BetterTyped/hyper-fetch/blob/3fe127e9/packages/react/src/hooks/use-app-manager/use-app-manager.hooks.ts#L7)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview fn">

```ts
useAppManager<B>(builder);
```

</div><div class="api-docs__section">

## Parameters

</div>
<div class="api-docs__parameters">
<table>
<thead><tr><th>Name</th><th>Details</th></tr></thead>
<tbody><tr param-data="builder"><td class="api-docs__param-name required">

### builder

`Required`

</td><td class="api-docs__param-type">

`B`

</td></tr></tbody></table></div><div class="api-docs__section">

## Returns

</div><div class="api-docs__returns">

```ts
{
  isFocused: boolean;
  isOnline: boolean;
  setFocused: (isFocused: boolean) => void;
  setOnline: (isOnline: boolean) => void;
}
```

</div>
