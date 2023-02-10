

# FetchOptionsType

<div class="api-docs__separator">

---

</div><div class="api-docs__import">

```ts
import { FetchOptionsType } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.types.ts:200](https://github.com/BetterTyped/hyper-fetch/blob/3fe127e9/packages/core/src/command/command.types.ts#L200)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type single">

```ts
type FetchOptionsType<ClientOptions> = Omit<Partial<CommandConfig<string, ClientOptions>>, endpoint | method>;
```

</div><div class="api-docs__section">

## Structure

</div><div class="api-docs__returns">

```ts
Partial<CommandConfig<string, ClientOptions>>
```

</div>