

# BuilderConfig

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { BuilderConfig } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Configuration setup for the builder

</span></div><p class="api-docs__definition">

Defined in [builder/builder.types.ts:12](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.types.ts#L12)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type">

```ts
type BuilderConfig = {
  appManager: <B,A>(builder: B) => A; 
  baseUrl: string; 
  cache: <B,C>(builder: B) => C; 
  client: ClientType; 
  fetchDispatcher: <B,D>(builder: B) => D; 
  isNodeJS: boolean; 
  submitDispatcher: <B,D>(builder: B) => D; 
}
```

</div><div class="api-docs__section">

## Structure

</div><div class="api-docs__returns">

```ts
{
  appManager: (builder: B) => A;
  baseUrl: string;
  cache: (builder: B) => C;
  client: (command: CommandInstance, requestId: string) => Promise<[GenericDataType | null, GenericErrorType | null, number | null]>;
  fetchDispatcher: (builder: B) => D;
  isNodeJS: boolean;
  submitDispatcher: (builder: B) => D;
}
```

</div>