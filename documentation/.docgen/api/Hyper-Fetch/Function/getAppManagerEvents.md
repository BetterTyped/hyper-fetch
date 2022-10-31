

# getAppManagerEvents

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { getAppManagerEvents } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [managers/app/app.manager.events.ts:5](https://github.com/BetterTyped/hyper-fetch/blob/7e232edb/packages/core/src/managers/app/app.manager.events.ts#L5)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview fn">

```ts
getAppManagerEvents(emitter)
```

</div><div class="api-docs__section">

## Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="emitter"><td class="api-docs__param-name required">

### emitter 

`Required`

</td><td class="api-docs__param-type">

`EventEmitter`

</td></tr></tbody></table></div><div class="api-docs__section">

## Returns

</div><div class="api-docs__returns">

```ts
{
  emitBlur: () => void;
  emitFocus: () => void;
  emitOffline: () => void;
  emitOnline: () => void;
  onBlur: (callback: () => void) => VoidFunction;
  onFocus: (callback: () => void) => VoidFunction;
  onOffline: (callback: () => void) => VoidFunction;
  onOnline: (callback: () => void) => VoidFunction;
};

```

</div>