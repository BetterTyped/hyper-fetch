

# FetchOptionsType

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { FetchOptionsType } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.types.ts:195](https://github.com/BetterTyped/hyper-fetch/blob/7e232edb/packages/core/src/command/command.types.ts#L195)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type single">

```ts
type FetchOptionsType<ClientOptions> = Omit<Partial<CommandConfig<string, ClientOptions>>, endpoint | method>;
```

</div>