
      
# CommandCurrentType

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type single">

```ts
type CommandCurrentType = { data?: CommandData<RequestDataType, MappedData>; headers?: HeadersInit; mockCallback?: (data: RequestDataType) => ClientResponseType<ResponseType, ErrorType>; params?: ExtractRouteParams<GenericEndpoint> | NegativeTypes; queryParams?: QueryParamsType | NegativeTypes; updatedAbortKey?: boolean; updatedCacheKey?: boolean; updatedEffectKey?: boolean; updatedQueueKey?: boolean; used?: boolean } & Partial<NullableKeys<CommandConfig<GenericEndpoint, ClientOptions>>>;
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [command/command.types.ts:163](https://github.com/BetterTyped/hyper-fetch/blob/1a97772c/packages/core/src/command/command.types.ts#L163)

</div>