

# ClientType

<div class="api-docs__separator">

---

</div><div class="api-docs__import">

```ts
import { ClientType } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [client/fetch.client.types.ts:5](https://github.com/BetterTyped/hyper-fetch/blob/3fe127e9/packages/core/src/client/fetch.client.types.ts#L5)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type single">

```ts
type ClientType = (command: CommandInstance, requestId: string) => Promise<ClientResponseType<any, any>>;
```

</div><div class="api-docs__section">

## Structure

</div><div class="api-docs__returns">

```ts
(command: CommandInstance, requestId: string) => Promise<ClientResponseType<any, any>>
```

</div>