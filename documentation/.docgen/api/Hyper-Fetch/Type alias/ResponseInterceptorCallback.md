

# ResponseInterceptorCallback

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { ResponseInterceptorCallback } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [builder/builder.types.ts:50](https://github.com/BetterTyped/hyper-fetch/blob/6c3eaa91/packages/core/src/builder/builder.types.ts#L50)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type single">

```ts
type ResponseInterceptorCallback<Response,Error> = (response: ClientResponseType<Response, Error>, command: CommandInstance) => Promise<ClientResponseType<any, any>> | ClientResponseType<any, any>;
```

</div><div class="api-docs__section">

## Structure

</div><div class="api-docs__returns">

```ts
(response: ClientResponseType<Response, Error>, command: CommandInstance) => Promise<[GenericDataType | null, GenericErrorType | null, number | null]> | ClientResponseType<any, any>
```

</div>