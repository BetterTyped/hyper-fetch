

# OnSuccessCallbackType

<div class="api-docs__separator">

---

</div><div class="api-docs__import">

```ts
import { OnSuccessCallbackType } from "@hyper-fetch/react"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [helpers/use-command-events/use-command-events.types.ts:92](https://github.com/BetterTyped/hyper-fetch/blob/3fe127e9/packages/react/src/helpers/use-command-events/use-command-events.types.ts#L92)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type single">

```ts
type OnSuccessCallbackType<Command> = (params: CallbackParameters<Command, ExtractResponse<Command>>) => void | Promise<void>;
```

</div><div class="api-docs__section">

## Structure

</div><div class="api-docs__returns">

```ts
(params: CallbackParameters<Command, ExtractResponse<Command>>) => void | Promise<void>
```

</div>