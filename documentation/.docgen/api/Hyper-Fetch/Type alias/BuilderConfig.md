
      
# BuilderConfig

<div class="api-docs__section" data-reactroot="">

## Preview

</div><div class="api-docs__preview type" data-reactroot="">

```ts
type BuilderConfig = {
  appManager: <B, A>(builder: B) => A; 
  baseUrl: string; 
  cache: <B, C>(builder: B) => C; 
  client: ClientType; 
  fetchDispatcher: <B, D>(builder: B) => D; 
  isNodeJS: boolean; 
  submitDispatcher: <B, D>(builder: B) => D; 
}
```

</div><div class="api-docs__section" data-reactroot="">

## Description

</div><div class="api-docs__description" data-reactroot=""><span class="api-docs__do-not-parse">

Configuration setup for the builder

</span></div><div class="api-docs__definition" data-reactroot="">

Defined in [builder/builder.types.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.types.ts#L12)

</div>