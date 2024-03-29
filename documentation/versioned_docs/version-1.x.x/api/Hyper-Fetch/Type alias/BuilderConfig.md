

# BuilderConfig

<div class="api-docs__separator">

---

</div><div class="api-docs__import">

```ts
import { BuilderConfig } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Configuration setup for the builder

</span></div><p class="api-docs__definition">

Defined in [builder/builder.types.ts:12](https://github.com/BetterTyped/hyper-fetch/blob/3fe127e9/packages/core/src/builder/builder.types.ts#L12)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type">

```ts
type BuilderConfig = {
  appManager: <B,A>(builder: B) => A; 
  cache: <B,C>(builder: B) => C; 
  client: ClientType; 
  fetchDispatcher: <B,D>(builder: B) => D; 
  submitDispatcher: <B,D>(builder: B) => D; 
  url: string; 
}
```

</div><div class="api-docs__section">

## Structure

</div><div class="api-docs__returns">

```ts
{
  appManager: (builder: B) => A;
  cache: (builder: B) => C;
  client: (command: CommandInstance, requestId: string) => Promise<ClientResponseType<any, any>>;
  fetchDispatcher: (builder: B) => D;
  submitDispatcher: (builder: B) => D;
  url: string;
}
```

</div>