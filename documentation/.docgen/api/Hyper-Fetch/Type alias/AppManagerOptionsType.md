

# AppManagerOptionsType

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { AppManagerOptionsType } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type">

```ts
type AppManagerOptionsType = {
  focusEvent: (setFocused: (isFocused: boolean) => void, builder: BuilderInstance) => void; 
  initiallyFocused: boolean | () => boolean | Promise<boolean>; 
  initiallyOnline: boolean | () => boolean | Promise<boolean>; 
  onlineEvent: (setOnline: (isOnline: boolean) => void, builder: BuilderInstance) => void; 
}
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [managers/app/app.manager.types.ts:3](https://github.com/BetterTyped/hyper-fetch/blob/479dcad6/packages/core/src/managers/app/app.manager.types.ts#L3)

</p>