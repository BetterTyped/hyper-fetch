

# ExtractRouteParams

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { ExtractRouteParams } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.types.ts:187](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.types.ts#L187)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type single">

```ts
type ExtractRouteParams<T> = string extends T ? NegativeTypes : T extends `${string}:${infer  Param}/${infer  Rest}` ? { [ k in Param | keyof ExtractRouteParams<Rest> ]: ParamType } : T extends `${string}:${infer  Param}` ? { [ k in Param ]: ParamType } : NegativeTypes;
```

</div>