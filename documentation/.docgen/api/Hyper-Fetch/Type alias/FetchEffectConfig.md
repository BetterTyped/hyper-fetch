

# FetchEffectConfig

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { FetchEffectConfig } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [effect/fetch.effect.types.ts:10](https://github.com/BetterTyped/hyper-fetch/blob/6c3eaa91/packages/core/src/effect/fetch.effect.types.ts#L10)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type">

```ts
type FetchEffectConfig<T> = {
  effectKey: string; 
  onError: (response: ClientResponseErrorType<ExtractError<T>>, command: CommandInstance) => void; 
  onFinished: (response: ClientResponseType<ResponseType, ExtractError<T>>, command: CommandInstance) => void; 
  onStart: (command: CommandInstance) => void; 
  onSuccess: (response: ClientResponseSuccessType<ResponseType>, command: CommandInstance) => void; 
  onTrigger: (command: CommandInstance) => void; 
}
```

</div><div class="api-docs__section">

## Structure

</div><div class="api-docs__returns">

```ts
{
  effectKey: string;
  onError: (response: ClientResponseErrorType<T extends Command<any, any, any, infer G, infer L, any, any, any, any, any> ? G | L : never>, command: CommandInstance) => void;
  onFinished: (response: ClientResponseType<ResponseType, T extends Command<any, any, any, infer G, infer L, any, any, any, any, any> ? G | L : never>, command: CommandInstance) => void;
  onStart: (command: CommandInstance) => void;
  onSuccess: (response: ClientResponseSuccessType<ResponseType>, command: CommandInstance) => void;
  onTrigger: (command: CommandInstance) => void;
}
```

</div>