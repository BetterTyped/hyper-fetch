

# CommandCurrentType

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { CommandCurrentType } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.types.ts:163](https://github.com/BetterTyped/hyper-fetch/blob/4197368e/packages/core/src/command/command.types.ts#L163)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type single">

```ts
type CommandCurrentType<ResponseType,RequestDataType,QueryParamsType,ErrorType,GenericEndpoint,ClientOptions,MappedData> = { data?: CommandData<RequestDataType, MappedData>; headers?: HeadersInit; mockCallback?: (data: RequestDataType) => ClientResponseType<ResponseType, ErrorType>; params?: ExtractRouteParams<GenericEndpoint> | NegativeTypes; queryParams?: QueryParamsType | NegativeTypes; updatedAbortKey?: boolean; updatedCacheKey?: boolean; updatedEffectKey?: boolean; updatedQueueKey?: boolean; used?: boolean } & Partial<NullableKeys<CommandConfig<GenericEndpoint, ClientOptions>>>;
```

</div>